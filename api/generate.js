const usedStories = new Map(); // simple in-memory memory (per server instance)
const styleTracker = new Map();

const STORY_STYLES = [
  "adventure",
  "friendly",
  "mystery",
  "journey"
];

// ---------- Helper: pick a non-repeating style ----------
function getRandomStyle(sessionId = "default") {
  const lastStyle = styleTracker.get(sessionId);

  let style;
  do {
    style = STORY_STYLES[Math.floor(Math.random() * STORY_STYLES.length)];
  } while (style === lastStyle && STORY_STYLES.length > 1);

  styleTracker.set(sessionId, style);
  return style;
}

// ---------- Helper: fetch person from Wikipedia ----------
async function searchWikipedia(query) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
  );

  if (!res.ok) return null;

  return await res.json();
}

// ---------- Helper: simple ranking ----------
function scorePerson(data, race, gender, career) {
  let score = 0;

  if (!data) return 0;

  const extract = (data.extract || "").toLowerCase();

  if (career && extract.includes(career.toLowerCase())) score += 3;
  if (gender && extract.includes(gender.toLowerCase())) score += 2;
  if (race && extract.includes(race.toLowerCase())) score += 2;

  return score;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { race, gender, career, sessionId } = req.body;

    const key = `${race}-${gender}-${career}`;

    // ---------- MEMORY CHECK ----------
    if (usedStories.has(key)) {
      return res.status(200).json({
        title: "Already seen story",
        story: "Try changing your inputs to discover a new story!"
      });
    }

    // ---------- WIKIPEDIA SEARCH ----------
    let wikiData = await searchWikipedia(career);

    if (!wikiData) {
      // fallback
      wikiData = await searchWikipedia(`${career} person`);
    }

    // ---------- AI PROMPT ----------
    const style = getRandomStyle(sessionId);

    const prompt = `
You are a children's storyteller.

Use ONLY factual information.

Create a ${style} bedtime story about a REAL person.

Inputs:
Race: ${race}
Gender: ${gender}
Career: ${career}

Person Info:
${wikiData?.extract || "No data found"}

Rules:
- DO NOT invent events
- DO NOT exaggerate
- Keep it factual
- Keep it fun for kids
- Change storytelling style each time
- Never repeat previous stories
- Output JSON ONLY:

{
  "title": "...",
  "story": "..."
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const rawText = await aiRes.text();

    console.log("OpenAI RAW:", rawText);

    if (!aiRes.ok) {
      return res.status(500).json({ error: "OpenAI failed" });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: "Bad AI response" });
    }

    const content = parsed?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    let storyData;
    try {
      storyData = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: "Story format error" });
    }

    // ---------- SAVE MEMORY ----------
    usedStories.set(key, true);

    return res.status(200).json({
      title: storyData.title,
      story: storyData.story
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
