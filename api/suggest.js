const FAMILY_FAVOURITES = [
  "Pesto Pasta Salad", "Pizza", "Tacos", "Hamburgers", "Mexican Chicken",
  "Fish", "Fried Rice", "Fish and chips", "Pasta bake", "Ramen",
  "Healthy butter chicken", "Chicken parmigiana", "Cannelloni", "Bolognese",
  "Lemongrass pork noodle salad", "Roast chicken", "Turmeric chicken",
  "Chili", "Gnocchi", "Feijao", "Italian rice", "Breakfast for dinner",
  "Beef bowls", "Beans and rice", "Soba noodle salad"
];

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { currentMeal, dayName, constraints } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are a family meal planner for an Australian family of 4 (two adults, a 6-year-old boy, and a younger child) in Melbourne. They like simple, healthy, kid-friendly meals.

Their favourite meals include: ${FAMILY_FAVOURITES.join(", ")}.

Current meal for ${dayName}: "${currentMeal}"
${constraints ? `Constraints: ${constraints}` : ""}

Suggest ONE different meal. It should be different from "${currentMeal}".

Respond ONLY in this exact JSON format, no markdown backticks or other text:
{"title": "Meal Name", "desc": "2-3 sentence description of the meal, written casually for a family audience. Include key ingredients and any tips for making it kid-friendly.", "tags": ["tag1", "tag2"], "emoji": "single emoji"}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const suggestion = JSON.parse(clean);
    return res.status(200).json(suggestion);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "Failed to get suggestion" });
  }
}
