export default async function handler(req, res) {
  // ✅ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { race, gender, career } = req.body || {};

    // Basic validation
    if (!career) {
      return res.status(400).json({ error: "Missing career input" });
    }

    const category = [race, gender, career].filter(Boolean).join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a storytelling assistant for a children's bedtime app.

SAFETY:
- Only use real people who are safe, positive, and appropriate for children
- Avoid any unsafe, adult, or controversial individuals
- If needed, choose a safe, well-known role model

STYLE:
- ONE short paragraph (4–7 sentences)
- Simple words (ages 3–7)
- Fun, warm, and exciting
- Start with a creative opening
- Include "wow!" or "guess what!"

FACTS:
- Use only widely known real facts
- Do not invent thoughts or emotions

FORMAT:
Title

Story paragraph

Lesson 🌟
(1 short sentence)

Question 🤔
(1 simple question)
            `,
          },
          {
            role: "user",
            content: `Category: ${category}. Create a bedtime story.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await response.json();

    const story = data.choices?.[0]?.message?.content;

    if (!story) {
      return res.status(500).json({ error: "No story returned" });
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: "Server error",
    });
  }
}
