export default async function handler(req, res) {
  const { query } = req.body;

  try {
    const person = await getPerson(query);

    const story = createStory(person);

    res.status(200).json({ story });

  } catch (err) {
    res.status(500).json({ error: "Failed to generate story" });
  }
}

async function getPerson(query) {
  const search = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
  );

  const data = await search.json();

  const title = data.query.search[0].title;

  const summaryRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );

  const summary = await summaryRes.json();

  return {
    name: summary.title,
    summary: summary.extract
  };
}

function createStory(person) {
  const name = person.name;

  const opening = [
    "liked to create things",
    "worked hard every day",
    "followed their dream",
    "loved learning"
  ];

  const middle = [
    "So they kept going.",
    "So they tried again.",
    "So they built something new.",
    "So they didn’t give up."
  ];

  const lessons = [
    "You can solve problems around you.",
    "You can keep going even when it’s hard.",
    "You can build something great.",
    "You can grow into something powerful."
  ];

  const questions = [
    "What is something you want to create?",
    "What is a problem you would like to solve?",
    "What is your big dream?",
    "How can you help someone today?"
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const summary = person.summary
    ? person.summary.split(".").slice(0, 2).join(".")
    : "";

  return `
🌙 “${name}”

${name} ${pick(opening)}.

${summary}.

${pick(middle)}

${name} showed that you can grow, learn, and create something meaningful.

✨ Lesson: ${pick(lessons)}
💬 Question: ${pick(questions)}
`.trim();
}