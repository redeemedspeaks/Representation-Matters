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

    // ---- SYSTEM PROMPT ----
    // NOTE: This prompt makes EXPLICIT the single-use of the full name, then ONLY first name or pronoun thereafter.
    const systemPrompt = `
You are a world-class children's story writer.

WRITE A STORY (ages 3–7) about a real person matching the categories below.

IMPORTANT RULES:
- The title is metaphorical, poetic, or about their journey/action—NEVER the person's name.
- The FIRST time you mention the person, use their **full real name** (first and last, with middle/initial if it’s in common use, e.g., "Michael B. Jordan").
- After mentioning their full name ONCE, use ONLY their FIRST NAME or pronouns ("he", "she", "they") for the rest of the story. Never write the full name again.
- Do NOT repeat or partially repeat the full name elsewhere in the story.
- Use short, poetic, bedtime-story-style lines.
- One action, challenge, or moment—avoid biography lists.
- Be truthful. Mention real achievements, teams, or works only if important.
- End with:
  "✨ Lesson: [one short, positive, actionable lesson]"
  "💬 Question for kids: [one open-ended creative question]"
- NEVER use the person's name in the title.
- Never start with the person's job.
- Do NOT use or mention: ${usedPeople.join(", ") || "None"}.

EXAMPLE FORMAT (for your structure only):

The Leap That Inspired

Michael B. Jordan stood under the lights.  
He breathed deep and spoke his first lines.  
After that night, Michael brought characters to life.  
He showed that believing in yourself can turn dreams real.

✨ Lesson: Trust yourself—you shine brightest when you try.  
💬 Question for kids: What story do you want to tell?

---

Write the story now for a real person who fits: ${categoryDesc}.
`;

    const userPrompt = `Write the story now for a real person who fits: ${categoryDesc}.`;

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
        model: "gpt-4o",
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

    // Safety filter
    const unsafeWords = [
      "porn", "sex", "onlyfans", "rape", "kill", "murder", "explicit", "suicide",
      "drugs", "alcohol", "crime", "jail", "prison"
    ];
    const lower = story.toLowerCase();
    if (unsafeWords.some(word => lower.includes(word))) {
      res.status(500).json({ error: "Unsafe content blocked" });
      return;
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
