import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildCategory({ race, gender, career }) {
  return [race, gender, career].filter(Boolean).join(" ").trim();
}

const SYSTEM_PROMPT = `
You create fun, short, child-friendly bedtime stories about REAL people.

RULES:
- Only choose real, safe, positive people
- Match the category exactly (race, gender, career)
- Do NOT use explicit, adult, or unsafe people
- Do NOT invent false facts
- Keep language very simple (kids age 3–7)

FORMAT:
Title

Story (short, natural, NOT formulaic)

Lesson 🌟
(one sentence)

Question 🤔
(one simple question)
`;

export default async function handler(req, res) {
  try {
    const { race, gender, career } = req.body;

    const category = buildCategory({ race, gender, career });

    if (!category) {
      return res.status(400).json({ error: "Missing input" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Category: ${category}. Create a story.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 400,
    });

    const story = response.choices?.[0]?.message?.content;

    if (!story) {
      throw new Error("No story returned");
    }

    res.status(200).json({ story });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error. Check logs.",
    });
  }
}
