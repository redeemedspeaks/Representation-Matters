export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { race, gender, career, usedPeople = [] } = req.body || {};

    if (!race && !gender && !career) {
      return res.status(400).json({ error: "Missing input" });
    }

    const category = [race, gender, career].filter(Boolean).join(" ");

    const styles = [
      "calm and gentle",
      "exciting and energetic",
      "playful and rhythmic",
      "mysterious and soft",
      "inspiring and bold"
    ];

    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content: `
You are a storytelling assistant for a children's bedtime app.

========================
SAFETY RULES
========================
- ONLY real, safe, well-known public figures
- NO criminals, violence, or explicit content
- If unsure, choose a universally safe role model

========================
ANTI-REPEAT RULE
========================
Do NOT use any of these people:
${usedPeople.join(", ") || "None"}

========================
FACT RULE
========================
- ONLY true, widely known facts
- NO invented events or emotions
- Keep everything accurate

========================
STORY STYLE
========================
- 3–5 short sentences
- Ages 3–7
- Tone: ${randomStyle}
- Warm, simple, and bedtime-friendly
- NO made-up details

========================
FORMAT
========================
Title

Story paragraph

Lesson 🌟
(1 short sentence)

Question 🤔
(1 short question)

========================
GOAL
========================
A safe, TRUE, fun bedtime story.
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
    const story = data.choices?.[0]?.message?.content;

    if (!story) {
      return res.status(500).json({ error: "No story generated" });
    }

    // Safety filter
    const unsafeWords = ["porn", "sex", "onlyfans", "rape", "kill", "murder", "explicit"];

    const lower = story.toLowerCase();

    if (unsafeWords.some(word => lower.includes(word))) {
      return res.status(500).json({ error: "Unsafe content blocked" });
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
