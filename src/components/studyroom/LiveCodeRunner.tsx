import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Code, Share, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/env";

const PISTON_API_URL = env.VITE_PISTON_API_URL ?? "https://emkc.org/api/v2/piston/execute";

const MAX_OUTPUT_CHARS = 4096;
const MAX_SHARE_CHARS = 1024;

interface LiveCodeRunnerProps {
  onShare: (code: string, language: string, output: string) => void;
}

const LANGUAGES = [
  { id: "python", name: "Python", version: "*" },
  { id: "javascript", name: "JavaScript", version: "*" },
  { id: "cpp", name: "C++", version: "*" },
  { id: "java", name: "Java", version: "*" },
];

export function LiveCodeRunner({ onShare }: LiveCodeRunnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to run");
      return;
    }

    setIsRunning(true);
    setOutput("");

    try {
      const response = await fetch(PISTON_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: language.id,
          version: language.version,
          files: [
            {
              content: code,
            },
          ],
        }),
      });

      const data = await response.json();

      const truncate = (raw: string) =>
        raw.length > MAX_OUTPUT_CHARS
          ? raw.slice(0, MAX_OUTPUT_CHARS) + `\n\n[Output truncated — ${raw.length.toLocaleString()} characters total]`
          : raw;

      if (data.compile && data.compile.code !== 0) {
        setOutput(truncate(`Compilation Error:\n${data.compile.output}`));
      } else if (data.run) {
        if (data.run.signal === "SIGKILL") {
          setOutput("Execution timed out or memory limit exceeded.");
        } else if (data.run.code !== 0) {
          setOutput(truncate(`Runtime Error (Exit Code: ${data.run.code}):\n${data.run.output}`));
        } else {
          setOutput(truncate(data.run.output || "Program finished with no output."));
        }
      } else {
        setOutput(data.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Code execution failed:", error);
      setOutput("Failed to connect to execution server.");
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleShare = () => {
    if (!code.trim()) {
      toast.error("Nothing to share");
      return;
    }
    const shareOutput =
      output.length > MAX_SHARE_CHARS
        ? output.slice(0, MAX_SHARE_CHARS) + "... [truncated]"
        : output;
    onShare(code, language.id, shareOutput);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          title="Live Code Runner"
          className="bg-white/10 border border-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition"
        >
          <Code size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Code className="text-cyan-400" /> Live Code Runner
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <select
              value={language.id}
              onChange={(e) => setLanguage(LANGUAGES.find((l) => l.id === e.target.value) || LANGUAGES[0])}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                Run
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
              >
                <Share size={16} /> Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
            <div className="flex flex-col gap-2 h-full">
              <label className="text-sm font-medium text-gray-400">Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-gray-950 text-gray-100 font-mono text-sm p-4 rounded-xl border border-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
                placeholder={`Write your ${language.name} code here...`}
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-2 h-full">
              <label className="text-sm font-medium text-gray-400">Output</label>
              <div className="w-full h-full bg-black text-green-400 font-mono text-sm p-4 rounded-xl border border-gray-800 overflow-y-auto whitespace-pre-wrap">
                {output || "Output will appear here..."}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
