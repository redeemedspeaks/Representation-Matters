import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build category string
 */
function buildCategory({ race, gender, career }) {
  return [race, gender, career].filter(Boolean).join(" ").trim();
}

/**
 * SYSTEM PROMPT (LESS FORMULAIC, MORE HUMAN)
 */
const SYSTEM_PROMPT = `
You create short, fun bedtime stories for kids (ages 3–7) about REAL people.

-----------------------
CORE GOAL
-----------------------
- Tell a short, engaging story about a REAL person who matches the category
- The story should feel natural, not repetitive or templated
- Each story should feel different in tone, structure, and pacing

-----------------------
CATEGORY RULES (STRICT)
-----------------------
- The person MUST match the category given:
  - Race (if provided)
  - Gender (if provided)
  - Career (if provided)
- Do NOT ignore any category
- If unsure, choose a clearly correct match

-----------------------
SAFETY RULES (STRICT)
-----------------------
- Only include safe, positive role models
- NEVER include:
  - Criminals
  - Pornstars / adult creators
  - Controversial or harmful figures

-----------------------
FACT RULES
-----------------------
- Use widely known, real facts only
- Do NOT invent thoughts, feelings, or fake events
- Keep it simple and true

-----------------------
STYLE RULES
-----------------------
- Keep language VERY simple (ages 3–7)
- Keep it short (4–7 sentences total)
- Make it feel like a story, not a template
- DO NOT always start the same way
- DO NOT always structure sentences the same way
- Add light excitement naturally (not forced)

-----------------------
FORMAT
-----------------------
Title (1 line)

Story (short paragraph, natural flow)

Lesson 🌟 (1 short sentence)

Question 🤔 (1 simple question)
`;

/**
 * Generate story
 */
export async function generateStory({ race, gender, career }) {
  try {
    const category = buildCategory({ race, gender, career });

    if (!category) {
      throw new Error("Missing input");
    }

    const userPrompt = `
Category: "${category}"

Pick a real person who clearly fits this category.

Then write a short children's bedtime story about them.
Make it feel natural and different from other stories.
`;

    const response = await client.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9, // 🔥 more variation
      max_tokens: 400,
    });

    const story = response.choices?.[0]?.message?.content;

    if (!story) throw new Error("No story generated");

    return story;

  } catch (error) {
    console.error("Error generating story:", error);

    // Better fallback (less robotic)
    return `
A Small Start

A young creator picked up a simple idea and tried it out. At first, not many people noticed—but that didn’t stop them. They kept learning, trying, and sharing. One day, people everywhere began to see what they made.

Lesson 🌟
Starting small can still lead to big things.

Question 🤔
What is something small you can start today?
`;
  }
}
