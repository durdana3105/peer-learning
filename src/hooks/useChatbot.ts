import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";

export type Message = {
  role: string;
  text: string;
  user_id?: string;
  created_at?: string;
};

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const systemPrompt = {
    role: "system",
    content:
      "You are a friendly, smart AI assistant. Talk clearly, slightly casual, helpful, and concise like ChatGPT.",
  };

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load only the current user's chat messages
  useEffect(() => {
    const loadChats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id" as any, session.user.id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as any[]);
    };
    loadChats();
  }, []);

  // SEND MESSAGE
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;
    const userMsg = { role: "user", text: input, user_id: userId };

    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert([userMsg]);

    try {
      const formattedMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));
      const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          systemPrompt: systemPrompt.content,
          model: "openai/gpt-4",
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const botReply = data?.reply || "No response 😅";
      const botMsg = { role: "assistant", text: botReply, user_id: userId };

      // Smoother typing effect (chunked rendering)
      let currentText = "";
      const chunkSize = 3;

      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      for (let i = 0; i < botReply.length; i += chunkSize) {
        if (!isMounted.current) break;
        currentText += botReply.slice(i, i + chunkSize);

        await new Promise((resolve) => setTimeout(resolve, 20));

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: currentText,
          };
          return updated;
        });
      }

      await supabase.from("chat_messages").insert([botMsg]);
    } catch (err) {
      const errorMsg = { role: "assistant", text: "Something went wrong. Please try again.", user_id: userId };
      setMessages((prev) => [...prev, errorMsg]);
      await supabase.from("chat_messages").insert([errorMsg]);
    }

    setLoading(false);
  }, [input, loading, messages, systemPrompt.content]);

  return {
    messages,
    input,
    setInput,
    loading,
    chatEndRef,
    sendMessage,
  };
}
