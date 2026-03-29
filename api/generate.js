export default async function handler(req, res) {
  try {
    const { shownPeople = [], lastStyle } = req.body;

    // =========================
    // STEP 1: GET PEOPLE
    // =========================
    const wikidataRes = await fetch(
      "https://query.wikidata.org/sparql?query=" +
        encodeURIComponent(`
        SELECT ?person ?personLabel WHERE {
          ?person wdt:P31 wd:Q5.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 50
      `),
      { headers: { Accept: "application/sparql-results+json" } }
    );

    const data = await wikidataRes.json();

    let people = data.results.bindings.map(
      (p) => p.personLabel.value
    );

    // ✅ remove already shown
    people = people.filter((p) => !shownPeople.includes(p));

    if (!people.length) {
      return res.status(200).json({
        story: "You've seen all available people for this category. Try changing your inputs!"
      });
    }

    // =========================
    // STEP 2: RANDOM PICK
    // =========================
    let selected =
      people[Math.floor(Math.random() * people.length)];

    console.log("Selected:", selected);

    // =========================
    // STEP 3: WIKIPEDIA
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
        story: "Couldn't find a good story. Try again!"
      });
    }

    // =========================
    // STEP 4: STYLE (NO REPEAT)
    // =========================
    const styles = ["cinematic", "playful", "calm", "action", "imaginative"];

    let style;
    do {
      style = styles[Math.floor(Math.random() * styles.length)];
    } while (style === lastStyle);

    // =========================
    // STEP 5: STORY
    // =========================
    const prompt = `
You are a children's bedtime storyteller.

STYLE: ${style}

STRICT RULES:
- Use ONLY the facts provided
- Do NOT invent events or emotions
- Do NOT assume thoughts or struggles
- Keep language simple for kids
- Make it feel like a fun short story
- Use a UNIQUE opening every time

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

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error(err);

      return res.status(200).json({
        story: "Story generator is having trouble. Try again."
      });
    }

    const aiData = await aiRes.json();

    const story =
      aiData?.choices?.[0]?.message?.content || "Try again!";

    return res.status(200).json({
      story,
      person: selected,
      style
    });

  } catch (err) {
    console.error(err);

    return res.status(200).json({
      story: "Something went wrong. Please try again."
    });
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
