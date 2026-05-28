export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4",
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

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    const conversationText = messages
      .map((msg) => `${msg.username || "User"}: ${msg.message}`)
      .join("\n");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4",
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