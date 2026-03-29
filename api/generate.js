const seenPeople = new Map();

// ---------- INTERPRET INPUT ----------
function interpretInput(input) {
  const text = input.toLowerCase();

  let gender = null;
  if (text.includes("male") || text.includes("man")) gender = "male";
  if (text.includes("female") || text.includes("woman")) gender = "female";

  return {
    gender,
    career: text // unlimited career input
  };
}

// ---------- WIKIDATA QUERY ----------
function buildQuery({ gender, career }) {
  let filters = [];

  if (gender === "male") {
    filters.push(`?person wdt:P21 wd:Q6581097`);
  }

  if (gender === "female") {
    filters.push(`?person wdt:P21 wd:Q6581072`);
  }

  filters.push(`
    ?person rdfs:label ?label .
    FILTER(CONTAINS(LCASE(?label), "${career.toLowerCase()}"))
  `);

  return `
  SELECT ?person ?personLabel WHERE {
    ?person wdt:P31 wd:Q5 .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }

    ${filters.join(" . ")}
  }
  LIMIT 25
  `;
}

// ---------- FETCH WIKIDATA ----------
async function getPeople(query) {
  const res = await fetch(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results.bindings.map(p => p.personLabel.value);
}

// ---------- WIKIPEDIA FALLBACK ----------
async function wikiSearch(query) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`
  );
  const data = await res.json();
  return data.query.search.map(r => r.title);
}

// ---------- SUMMARY ----------
async function getSummary(title) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );

  if (!res.ok) return null;
  return res.json();
}

// ---------- NO REPEAT SYSTEM ----------
function getUniquePerson(list, key) {
  const seen = seenPeople.get(key) || new Set();

  for (const person of list) {
    if (!seen.has(person)) {
      seen.add(person);
      seenPeople.set(key, seen);
      return person;
    }
  }

  seenPeople.set(key, new Set());
  return list[0];
}

// ---------- STORY TEMPLATE (STRICT SPACING) ----------
function formatStory(person) {
  return `
“The Story of ${person}”

The lights came on. 🎬
A story was about to begin.

${person} followed their dreams and worked hard every day.
They kept learning, even when things were not easy.

Over time, they grew and shared their work with others.
People around the world saw what they did and felt inspired.

Their journey shows that you can do great things if you keep going.

✨ Lesson: Keep trying, even when it is hard.
💬 Question: What is something you want to keep working on?

`.trim();
}

// ---------- MAIN ----------
export default async function handler(req, res) {
  try {
    const { input } = req.body;

    const { gender, career } = interpretInput(input);
    const key = input;

    let people = await getPeople(buildQuery({ gender, career }));

    if (!people.length) {
      people = await wikiSearch(career);
    }

    if (!people.length) {
      return res.status(500).json({ error: "No results found" });
    }

    const person = getUniquePerson(people, key);

    const wiki = await getSummary(person);

    // Optional: future AI enrichment (not needed for formatting control)

    const story = formatStory(person);

    return res.status(200).json({ story });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
