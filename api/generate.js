export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { race = "", gender = "", career = "", usedPeople = [] } = req.body || {};
    if (!race && !gender && !career) {
      res.status(400).json({ error: "Missing input" });
      return;
    }

    const fields = [];
    if (race) fields.push(race);
    if (gender) fields.push(gender);
    if (career) fields.push(career);
    const categoryDesc = fields.length > 0 ? fields.join(", ") : "any category";

    const systemPrompt = `
You are a children's story writer. Write magical, poetic bedtime stories for ages 3–7 about real people fitting these categories.

RULES:
- Title is metaphorical or action—NEVER the person's name.
- Start story with first name or nickname.
- Show one big challenge or achievement in short lines and simple language.
- Stay truthful and safe—no violence or made-up events.
- Real teams, creations, or achievements if relevant.
- End with "✨ Lesson: [short, positive]"
- End with "💬 Question for kids: [open-ended]"
- Lots of line breaks; small sentences.
- No encyclopedia paragraphs. Like a bedtime story!
- NEVER put name in the title.
- Never start with the person's job.
- Do NOT use or mention: ${usedPeople.join(", ") || "None"}
Format: 
Title

[Short magical story. Their name early on. One big action.]

✨ Lesson: [positive, actionable]
💬 Question for kids: [open-ended]
`;

    const userPrompt = `Categories: ${categoryDesc}. Pick a real person who matches. Write a short magical story.`;

    // --- OpenAI API Call ---
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "OpenAI API key not set." });
      return;
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Can use gpt-4o, gpt-4, gpt-3.5-turbo, depending on availability/cost
        temperature: 0.85,
        max_tokens: 340,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", errText);
      res.status(500).json({ error: "OpenAI API error" });
      return;
    }

    const data = await openaiRes.json();
    const story = data.choices?.[0]?.message?.content;

    if (!story) {
      res.status(500).json({ error: "No story generated" });
      return;
    }

    // Safety filter (very basic, you
