// Maximum number of characters allowed in a single question.
// Keeps token consumption bounded and prevents single-request API credit drain.
const MAX_QUESTION_LENGTH = 2000;

export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ error: "A non-empty question is required." });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        error: `Question must not exceed ${MAX_QUESTION_LENGTH} characters.`,
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4",
        messages: [
          { role: "system", content: "You are an AI peer mentor for students. Answer questions about coding, AI, DSA, and roadmaps in a supportive, clear, and approachable way." },
          { role: "user", content: question.trim() }
        ]
      })
    });

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "AI request failed" });
  }
};
