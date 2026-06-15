import { useState, useEffect } from "react";
 import { toast } from "sonner";

export default function StudyTimer() {
  const [seconds, setSeconds] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && seconds === 0) {
      setIsRunning(false);
      setHasCompleted(true);
      toast.success("⏰ Study session complete! Great work.", { duration: 5000 });
    }

    return () => clearInterval(timer);
  }, [isRunning, seconds]);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const TOTAL = 1500;
const progress = ((TOTAL - seconds) / TOTAL) * 100;
const isWarning = seconds <= 60 && seconds > 0;



  const handleReset = () => {
    setSeconds(1500);
    setIsRunning(false);
    setHasCompleted(false);
  };
  const handleToggle = () => {
    if (seconds === 0) return;
    setIsRunning((prev) => !prev);
  };

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 transition-colors ${isWarning ? "border-red-500" : "border-slate-700"}`}>
      <h2 className="font-semibold mb-3">⏳ Collaborative Study Timer</h2>
  
      {/* Progress bar */}
      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${hasCompleted ? "bg-green-500" : isWarning ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
  
      <p className={`text-3xl font-bold text-center mb-4 ${isWarning ? "text-red-400" : ""}`}>
        {minutes}:{remainingSeconds.toString().padStart(2, "0")}
      </p>
  
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          disabled={seconds === 0}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            isRunning ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
  
        <button
          onClick={handleReset}
          className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  );