export default async function handler(req, res) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "No input provided" });
    }

    const person = await findSafePerson(query);

    if (!person) {
      return res.status(404).json({
        error: "No safe match found. Try different words."
      });
    }

    const story = await generateStory(person);

    return res.status(200).json({ story });

  } catch (err) {
    console.error("GLOBAL ERROR:", err);

    return res.status(500).json({
      error: "Server error. Check logs."
    });
  }
}

//////////////////////////
// MAIN SEARCH FUNCTION
//////////////////////////

async function findSafePerson(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    if (!data || !data.query || !Array.isArray(data.query.search)) {
      return null;
    }

    const results = data.query.search;

    for (let i = 0; i < Math.min(5, results.length); i++) {
      const result = results[i];

      if (!result || !result.title) continue;

      const title = result.title;

      if (isBadTitle(title)) continue;

      const page = await getSummary(title);

      if (!page || !page.extract) continue;

      if (!isPerson(page)) continue;

      if (isUnsafe(page.extract)) continue;

      return {
        name: page.title,
        text: page.extract
      };
    }

    return null;

  } catch (err) {
    console.error("findSafePerson error:", err);
    return null;
  }
}

//////////////////////////
// FILTER FUNCTIONS
//////////////////////////

function isBadTitle(title) {
  const t = title.toLowerCase();

  return (
    t.includes("list of") ||
    t.includes("category") ||
    t.includes("index") ||
    t.includes("disambiguation")
  );
}

function isPerson(page) {
  if (!page || !page.extract) return false;

  const text = page.extract.toLowerCase();

  return (
    text.includes("born") ||
    text.includes("was born") ||
    text.includes("is a") ||
    text.includes("was a") ||
    text.includes("actor") ||
    text.includes("singer") ||
    text.includes("artist")
  );
}

function isUnsafe(text) {
  if (!text) return false;

  const lower = text.toLowerCase();

  const banned = [
    "porn",
    "adult",
    "xxx",
    "onlyfans",
    "sex",
    "erotic",
    "nude"
  ];

  return banned.some(word => lower.includes(word));
}

//////////////////////////
// WIKIPEDIA FETCH
//////////////////////////

async function getSummary(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    if (!data || !data.extract) return null;

    return data;

  } catch (err) {
    console.error("getSummary error:", err);
    return null;
  }
}

//////////////////////////
// STORY GENERATION
//////////////////////////

async function generateStory(person) {
  const { name, text } = person;

  const sentences = text
    .split(".")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const titles = [
    `${name} Found a Way`,
    `${name} and the Big Dream`,
    `${name} Kept Going`,
    `${name} Changed Things`,
    `${name} Made It Happen`
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];

  return `
🌙 Story: “${title}”

${name} had a dream.

${sentences.join(".\n")}

They kept going.
They kept learning.
They didn’t give up.

✨ Lesson: You can do big things too.
💬 Question: What is something you want to try?
`.trim();
}
