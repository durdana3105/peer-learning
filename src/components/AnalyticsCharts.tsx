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

interface AnalyticsChartsProps {
  profile: { points?: number | null } | null;
  /**
   * Learning hours per day for the current week (Mon → Sun, exactly 7 values).
   * Provided by the parent once real session-duration data is available.
   * Defaults to all-zeros so the chart renders an honest empty state.
   * Values that are non-finite (NaN / Infinity) are treated as 0.
   */
  weeklyHours?: number[];
  /**
   * Number of historical sessions with status "attended".
   * Pass a real count from the historical sessions query.
   * Defaults to 0 until the parent supplies historical session data.
   */
  attendedCount?: number;
  /**
   * Number of historical sessions with status "missed".
   * Pass a real count from the historical sessions query.
   * Defaults to 0 until the parent supplies historical session data.
   */
  missedCount?: number;
}

const DEFAULT_WEEKLY_HOURS: number[] = [0, 0, 0, 0, 0, 0, 0];

export default function AnalyticsCharts({
  profile,
  weeklyHours = DEFAULT_WEEKLY_HOURS,
  attendedCount = 0,
  missedCount = 0,
}: AnalyticsChartsProps) {
  // Normalise to exactly 7 finite numeric values (Mon–Sun) so Chart.js
  // always receives a dataset that aligns with the fixed label array.
  const normalizedWeeklyHours = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const v = weeklyHours[i];
        return Number.isFinite(v) ? v : 0;
      }),
    [weeklyHours],
  );

  const learningHoursData = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Learning Hours",
          data: normalizedWeeklyHours,
          borderColor: "rgb(34,211,238)",
          backgroundColor: "rgba(34,211,238,0.3)",
        },
      ],
    }),
    [normalizedWeeklyHours],
  );

  const attendanceData = useMemo(
    () => ({
      labels: ["Attended", "Missed"],
      datasets: [
        {
          label: "Sessions",
          data: [attendedCount, missedCount],
          backgroundColor: [
            "rgba(34,211,238,0.6)",
            "rgba(239,68,68,0.6)",
          ],
        },
      ],
    }),
    [attendedCount, missedCount],
  );

  const xpGrowthData = useMemo(() => {
    const currentXP = profile?.points ?? 0;
    // Weeks 1–3 are shown as 0 until a dedicated XP-history table is
    // available. Only the current week reflects real data.
    return {
      labels: ["Week 1", "Week 2", "Week 3", "This Week"],
      datasets: [
        {
          label: "XP Growth",
          data: [0, 0, 0, currentXP],
          borderColor: "rgb(59,130,246)",
          backgroundColor: "rgba(59,130,246,0.3)",
        },
      ],
    };
  }, [profile?.points]);

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
