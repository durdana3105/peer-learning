import { useState, useEffect } from "react";

export default function StudyTimer() {
  const [seconds, setSeconds] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, seconds]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const handleReset = () => {
    setSeconds(1500);
    setIsRunning(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <h2 className="font-semibold mb-3">
          ⏳ Collaborative Study Timer
      </h2>

      <p className="text-3xl font-bold text-center mb-4">
        {minutes}:
        {remainingSeconds
          .toString()
          .padStart(2, "0")}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium"
        >
          Start
        </button>

        <button
          onClick={() => setIsRunning(false)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm font-medium"
        >
          Pause
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
}