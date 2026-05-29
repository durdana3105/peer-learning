export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Invalid question provided" });
    }

    if (question.length > 2000) {
      return res.status(400).json({ error: "Question exceeds maximum length of 2000 characters" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI peer mentor for students. Answer questions about coding, AI, DSA, and roadmaps in a supportive, clear, and approachable way.",
            },
            {
              role: "user",
              content: question,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    res.json({
      answer: data.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({
      error: "AI request failed",
    });
  }
};

export const generateSessionSummary = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required and must be an array",
      });
    }

    // Limit to the last 100 messages to prevent excessive token usage
    const recentMessages = messages.slice(-100);

    let conversationText = recentMessages
      .map((msg) => `${msg.username || "User"}: ${msg.message}`)
      .join("\n");

    // Hard limit on character count (approx 5000 tokens max)
    if (conversationText.length > 20000) {
      conversationText = conversationText.slice(-20000);
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI learning assistant. Generate a concise learning session summary and key takeaways from the conversation. Respond ONLY in valid JSON format like: {\"summary\":\"...\",\"key_takeaways\":[\"...\",\"...\"]}",
            },
            {
              role: "user",
              content: conversationText,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        summary: content,
        key_takeaways: [],
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Summary generation failed",
    });
  }
};