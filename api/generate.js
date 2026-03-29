export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { race, gender, career, shownPeople = [], lastStyle } = req.body;

    // =========================
    // STEP 1: GET PEOPLE
    // =========================
    const sparql = `
      SELECT ?person ?personLabel WHERE {
        ?person wdt:P31 wd:Q5.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 100
    `;

    const wikidataRes = await fetch(
      "https://query.wikidata.org/sparql?query=" +
        encodeURIComponent(sparql),
      {
        headers: { Accept: "application/sparql-results+json" }
      }
    );

    const data = await wikidataRes.json();

    let people = data.results.bindings.map(
      (p) => p.personLabel.value
    );

    // Remove duplicates already shown
    people = people.filter((p) => !shownPeople.includes(p));

    if (!people.length) {
      return res.status(200).json({
        story: "No new people found. Try resetting history."
      });
    }

    // =========================
    // STEP 2: SMART RANKING
    // =========================
    const rankingPrompt = `
User:
Race: ${race || "any"}
Gender: ${gender || "any"}
Career: ${career || "any"}

Rank the BEST match.

Return JSON:
{ "person": "name" }

People:
${people.slice(0, 20).join("\n")}
`;

    const rankRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: rankingPrompt }],
        temperature: 0.3
      })
    });

    const rankData = await rankRes.json();

    let selected = people[0];
    try {
      selected = JSON.parse(rankData.choices[0].message.content).person;
    } catch {}

    // =========================
    // STEP 3: WIKIPEDIA FETCH
    // =========================
    let summary = await getWikipediaSummary(selected);

    if (!summary) {
      const alt = await searchWikipedia(selected);
      if (alt.length > 0) {
        selected = alt[0];
        summary = await getWikipediaSummary(selected);
      }
    }

    if (!summary) {
      return res.status(200).json({
        story: "Couldn't find a valid story."
      });
    }

    // =========================
    // STEP 4: STYLE RANDOMIZER
    // =========================
    const styles = ["cinematic", "playful", "calm", "action", "imaginative"];

    let style;
    do {
      style = styles[Math.floor(Math.random() * styles.length)];
    } while (style === lastStyle);

    // =========================
    // STEP 5: STORY GENERATION
    // =========================
    const prompt = `
You are a children's bedtime storyteller.

STYLE: ${style}

STRICT RULES:
- Use ONLY the facts provided
- Do NOT invent events or emotions
- Do NOT assume thoughts or struggles
- Keep language simple for kids

STORY RULES:
- Start with a UNIQUE opening (no repetition)
- Make it feel like a short story
- Fun and engaging tone

FORMAT:

Title

Story

✨ Lesson:
💬 Question:

FACTS:
${summary}
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const aiData = await aiRes.json();

    const story =
      aiData.choices?.[0]?.message?.content || "Try again!";

    res.status(200).json({
      story,
      person: selected,
      style
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// =========================
// HELPERS
// =========================

async function getWikipediaSummary(name) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.extract;
  } catch {
    return null;
  }
}

async function searchWikipedia(query) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`
    );
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}