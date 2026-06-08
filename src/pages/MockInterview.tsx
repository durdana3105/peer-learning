import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";
import { toast } from "sonner";
import { Loader2, Send, Bot, User, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useNavigate } from "react-router-dom";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type Report = {
  strengths: string[];
  areas_for_improvement: string[];
  overall_score: number;
  summary: string;
};

const ROLES = [
  "Senior Frontend Engineer",
  "Backend Developer",
  "Full Stack Engineer",
  "Data Scientist",
  "Product Manager",
  "HR Manager (Behavioral)",
];

const getAccessToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const MockInterview = () => {
  const { user } = useAuth();
  const [role, setRole] = useState(ROLES[0]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startInterview = async () => {
    const token = await getAccessToken();
    if (!token) {
      toast.error("You must be logged in to start a mock interview.");
      return;
    }

    setHasStarted(true);
    const initialMsg: Message = { role: "user", content: "Hi! I am ready for the mock interview. Please start by asking your first question." };
    setMessages([initialMsg]);
    await sendMessage([initialMsg]);
  };

  const sendMessage = async (currentMessages: Message[]) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/mock-interview/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ messages: currentMessages, role }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to process interview message.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // --- FIX: submitAnswer has no event parameter at all ---
  // Called from both the form onSubmit and the textarea onKeyDown safely
  const submitAnswer = async () => {
    if (!inputValue.trim() || loading) return;
    const newMsg: Message = { role: "user", content: inputValue.trim() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue("");
    await sendMessage(updatedMessages);
  };

  const endInterview = async () => {
    if (messages.length < 3) {
      toast.error("You need to answer some questions before ending the interview.");
      return;
    }

    setIsFinished(true);
    setGeneratingReport(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Session expired. Please log in again.");
        setGeneratingReport(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/mock-interview/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      const { error: insertError } = await (supabase as any).from("interview_sessions").insert({
        user_id: user!.id,
        role,
        messages,
        strengths: data.strengths,
        improvements: data.areas_for_improvement,
        overall_score: data.overall_score,
        summary: data.summary,
      });

      if (insertError) {
        console.error("Failed to save interview session:", insertError);
        toast.error("Interview completed but failed to save to history.");
      }

      setReport(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate evaluation report.";
      toast.error(message);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 p-8 pt-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            AI-Powered Mock Interviews
          </h1>
          <p className="text-slate-400 text-lg">
            Simulate a real technical or behavioral interview with our AI. Get immediate feedback and an evaluation report at the end.
          </p>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 text-left shadow-2xl mt-8">
            <h2 className="text-xl font-semibold">Select your Interviewer Role</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-4 rounded-xl border text-left transition-all ${role === r ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}
                >
                  <div className="font-semibold">{r}</div>
                </button>
              ))}
            </div>

            <button
              onClick={startInterview}
              className="w-full mt-6 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              Start Interview <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 p-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Interview Evaluation Report</h1>
            <p className="text-slate-400">Role: {role}</p>
          </div>

          {generatingReport ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <p className="text-slate-400">Analyzing your performance and generating feedback...</p>
            </div>
          ) : report ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-6">
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="#1e293b" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke={report.overall_score >= 80 ? "#22c55e" : report.overall_score >= 60 ? "#eab308" : "#ef4444"} strokeWidth="12" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * report.overall_score) / 100} className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{report.overall_score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Overall Summary</h3>
                  <p className="text-slate-300 leading-relaxed">{report.summary}</p>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
                  <CheckCircle2 /> Strengths
                </h3>
                <ul className="space-y-3">
                  {report.strengths.map((str, i) => (
                    <li key={i} className="flex gap-2 text-slate-300">
                      <span className="text-emerald-500">•</span> {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 mb-4">
                  <AlertTriangle /> Areas for Improvement
                </h3>
                <ul className="space-y-3">
                  {report.areas_for_improvement.map((area, i) => (
                    <li key={i} className="flex gap-2 text-slate-300">
                      <span className="text-yellow-500">•</span> {area}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2 flex justify-center mt-8 gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Start Another Interview
                </button>
                <button
                    onClick={() => navigate("/interview-history")}
                    className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl font-medium text-white transition-colors"
                  >
                    View History
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-red-400">Failed to load report. Please try again.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{role}</h2>
              <p className="text-xs text-slate-400">Mock Interview in progress...</p>
            </div>
          </div>
          <button
            onClick={endInterview}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            End Interview
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => {
            if (idx === 0 && msg.role === "user") return null;
            const isAI = msg.role === "assistant" || msg.role === "system";
            return (
              <div key={idx} className={`flex gap-4 ${isAI ? "" : "flex-row-reverse"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {isAI ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${isAI ? "bg-slate-800 rounded-tl-none text-slate-200" : "bg-blue-600 rounded-tr-none text-white"}`}>
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <Bot size={16} />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-none px-5 py-3 text-slate-400 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Interviewer is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {/* --- FIX: form onSubmit calls submitAnswer directly, no event needed --- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAnswer();
            }}
            className="flex gap-3"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 resize-none min-h-[50px] max-h-32 text-slate-200 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // --- FIX: call submitAnswer() directly, no event passed ---
                  submitAnswer();
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="w-12 shrink-0 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-2">
            Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;