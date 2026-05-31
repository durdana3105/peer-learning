"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);


export default function AnalyticsCharts({ profile, sessions }) {
  const learningHoursData = useMemo(() => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Learning Hours",
        data: [2, 3, 1, 4, 5, 2, 6], // replace with Supabase data
        borderColor: "rgb(34,211,238)",
        backgroundColor: "rgba(34,211,238,0.3)",
      },
    ],
  }), []);

  const attendanceData = useMemo(() => ({
    labels: ["Attended", "Missed"],
    datasets: [
      {
        label: "Sessions",
        data: [sessions.filter(s => s.status === "attended").length,
               sessions.filter(s => s.status === "missed").length],
        backgroundColor: ["rgba(34,211,238,0.6)", "rgba(239,68,68,0.6)"],
      },
    ],
  }), [sessions]);

  const xpGrowthData = useMemo(() => ({
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "XP Growth",
        data: [100, 200, 350, profile?.points || 0],
        borderColor: "rgb(59,130,246)",
        backgroundColor: "rgba(59,130,246,0.3)",
      },
    ],
  }), [profile?.points]);

  return (
    <div className="grid gap-8 md:grid-cols-2 mt-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">📈 Learning Hours</h2>
        <Line data={learningHoursData} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">📊 Session Attendance</h2>
        <Bar data={attendanceData} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">⚡ XP Growth</h2>
        <Line data={xpGrowthData} />
      </div>
    </div>
  );
}
