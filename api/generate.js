export default async function handler(req, res) {
  try {
    const { race, gender, career } = req.body;

    const category = [race, gender, career].filter(Boolean).join(" ");

    if (!category) {
      return res.status(400).json({ error: "Missing input" });
    }

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
You create short, child-friendly bedtime stories about REAL people.

- Choose a real person matching the category
- Keep it simple, fun, and safe
- Do not include adult or unsafe content
- 4–7 sentences max
            `,
          },
          {
            role: "user",
            content: `Category: ${category}. Create a story.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    const story = data.choices?.[0]?.message?.content;

    if (!story) {
      throw new Error("No story returned");
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error",
    });
  }
}
