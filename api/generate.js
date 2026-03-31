export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { race, gender, career } = req.body || {};

    if (!race && !gender && !career) {
      return res.status(400).json({ error: "Missing input" });
    }

    const category = [race, gender, career].filter(Boolean).join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content: `
You are a storytelling assistant for a children's bedtime app.

========================
SAFETY RULES (STRICT)
========================
- ONLY choose real people who are safe for children
- MUST be appropriate for "safe search"
- NEVER include:
  - Criminals (violent or non-violent)
  - Pornography or adult content creators
  - OnlyFans or explicit entertainers
  - People known for harmful or controversial behavior
- If unsure, choose a widely respected, kid-safe role model

========================
FACT RULES (PRIORITY)
========================
- ALL information must be true and widely known
- Do NOT make up thoughts, emotions, or internal feelings
- Do NOT exaggerate or invent events
- Keep facts simple and accurate

========================
STORY STYLE RULES
========================
- VERY SHORT (3–5 sentences total)
- Simple language (ages 3–7)
- Bedtime tone: calm, warm, a little magical
- Start with a creative, cozy, or exciting opening
- Add light imagination words (lights, sky, cozy, etc.)
- DO NOT add fake details

========================
FORMAT (STRICT)
========================
Title

Story paragraph

Lesson 🌟
(1 short sentence)

Question 🤔
(1 simple question)

========================
GOAL
========================
Make the story feel like a short, fun bedtime story,
while keeping everything TRUE and SAFE.
            `,
          },
          {
            role: "user",
            content: `Category: ${category}. Create a story.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await response.json();
    let story = data.choices?.[0]?.message?.content;

    if (!story) {
      return res.status(500).json({ error: "No story generated" });
    }

    // 🔒 EXTRA SAFETY FILTER (backup protection)
    const unsafeWords = [
      "porn",
      "sex",
      "onlyfans",
      "rape",
      "kill",
      "murder",
      "explicit"
    ];

    const lower = story.toLowerCase();

    if (unsafeWords.some(word => lower.includes(word))) {
      return res.status(500).json({
        error: "Unsafe content blocked",
      });
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
