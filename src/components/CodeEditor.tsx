import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, AlertCircle } from "lucide-react";

type Language = {
  id: number;
  name: string;
  value: string;
  defaultCode: string;
};

const LANGUAGES: Language[] = [
  {
    id: 93,
    name: "JavaScript (Node.js)",
    value: "javascript",
    defaultCode: `console.log("Hello, World!");`,
  },
  {
    id: 71,
    name: "Python (3.8)",
    value: "python",
    defaultCode: `print("Hello, World!")`,
  },
  {
    id: 54,
    name: "C++ (GCC 9.2)",
    value: "cpp",
    defaultCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  },
  {
    id: 62,
    name: "Java (OpenJDK 13)",
    value: "java",
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  },
];

export const CodeEditor = () => {
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang =
      LANGUAGES.find((l) => l.value === e.target.value) || LANGUAGES[0];
    setSelectedLang(lang);
    setCode(lang.defaultCode);
    setOutput("");
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput("Executing...");
    setIsError(false);

    try {
      const response = await fetch(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            stdin: "", // Can be expanded to support stdin from UI if needed
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to reach execution server. It might be rate limited.",
        );
      }

      const data = await response.json();

      if (data.stderr || data.compile_output) {
        setIsError(true);
        setOutput(
          data.stderr || data.compile_output || data.message || "Unknown Error",
        );
      } else {
        setOutput(data.stdout || "Program exited with no output.");
      }
    } catch (error: any) {
      setIsError(true);
      setOutput(
        error.message || "An unexpected error occurred during execution.",
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      {/* Editor Header / Toolbar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <select
            value={selectedLang.value}
            onChange={handleLanguageChange}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.value}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRunCode}
          disabled={isExecuting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          {isExecuting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          Run
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={selectedLang.value}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Output / Terminal Area */}
      <div className="h-1/3 shrink-0 border-t border-slate-800 bg-slate-900 flex flex-col">
        <div className="h-8 flex items-center px-4 border-b border-slate-800 bg-slate-950/50">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Terminal Output{" "}
            {isError && <AlertCircle size={14} className="text-red-400" />}
          </span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <pre
            className={`text-sm font-mono whitespace-pre-wrap ${
              isError ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {output || "Output will appear here..."}
          </pre>
        </div>
      </div>
    </div>
  );
};
