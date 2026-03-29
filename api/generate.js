export default async function handler(req, res) {
  const { query } = req.body;

  try {
    const person = await findSafePerson(query);

    if (!person) {
      return res.status(404).json({
        error: "No safe, valid person found. Try different words."
      });
    }

    const story = await generateStory(person);

    res.status(200).json({ story });

  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
}

//////////////////////////
// SEARCH PIPELINE
//////////////////////////

async function findSafePerson(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  for (let result of data.query.search.slice(0, 5)) {
    const title = result.title;

    if (isBadTitle(title)) continue;

    const page = await getSummary(title);
    if (!page) continue;

    if (!isPerson(page)) continue;
    if (isUnsafe(page.extract)) continue;

    return {
      name: page.title,
      text: page.extract
    };
  }

  return null;
}

//////////////////////////
// FILTERS
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
  if (!page.extract) return false;

  const text = page.extract.toLowerCase();

  return (
    text.includes("born") ||
    text.includes("is a") ||
    text.includes("was a") ||
    text.includes("actor") ||
    text.includes("singer") ||
    text.includes("artist")
  );
}

function isUnsafe(text) {
  const lower = text.toLowerCase();

  const banned = [
    "porn",
    "adult",
    "xxx",
    "onlyfans",
    "erotic",
    "sex"
  ];

  return banned.some(word => lower.includes(word));
}

//////////////////////////
// WIKIPEDIA FETCH
//////////////////////////

async function getSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  const res = await fetch(url);

  if (!res.ok) return null;

  return await res.json();
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
    `${name} and the Big Idea`,
    `${name} Kept Going`,
    `${name} Changed Things`,
    `${name} and the Journey`
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];

  return `
🌙 Story: “${title}”

${name} had something inside them.

${sentences.join(".\n")}

They kept trying.
They kept learning.
They didn’t give up.

✨ Lesson: You can do big things too.
💬 Question: What is something you want to try?
`.trim();
}
