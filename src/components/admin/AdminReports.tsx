import { useState, useEffect } from "react";
import { Users, ClipboardList, TrendingUp, Clock, Trophy, HelpCircle, Target } from "lucide-react";
import { adminApi } from "@/lib/api";
import { LoadingSpinner } from "./shared";

export function AdminReports({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getReports(token).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-slate-500 text-center py-8">Failed to load reports.</p>;

  const stats = [
    { label: "Total Students", value: data.totalStudents, icon: <Users className="w-5 h-5" />, color: "text-teal-600 bg-teal-50" },
    { label: "Total Attempts", value: data.totalAttempts, icon: <ClipboardList className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
    { label: "Average Score", value: `${data.averageScore}%`, icon: <Target className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
    { label: "Avg Completion Time", value: `${Math.floor(data.averageCompletionTime / 60)}m ${data.averageCompletionTime % 60}s`, icon: <Clock className="w-5 h-5" />, color: "text-slate-600 bg-slate-100" },
    { label: "Total Points Awarded", value: data.totalPointsAwarded.toFixed(0), icon: <Trophy className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Students */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Top Students</h3>
          {data.topStudents.length === 0 ? <p className="text-sm text-slate-400 py-4">No data yet.</p> : (
            <div className="space-y-2">
              {data.topStudents.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span><span className="text-slate-400 mr-2">#{i + 1}</span><span className="font-medium text-slate-700">{s.display_name}</span></span>
                  <span className="text-amber-600 font-medium">{s.total_points.toFixed(0)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Attempted Quizzes */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Most Attempted Quizzes</h3>
          {data.mostAttempted.length === 0 ? <p className="text-sm text-slate-400 py-4">No data yet.</p> : (
            <div className="space-y-2">
              {data.mostAttempted.map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 truncate">{q.name}</span>
                  <span className="text-slate-500 ml-2">{q.count} attempts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Difficult Questions */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-red-500" /> Most Difficult Questions (by wrong-answer frequency)</h3>
          {data.mostDifficult.length === 0 ? <p className="text-sm text-slate-400 py-4">No data yet.</p> : (
            <div className="space-y-2">
              {data.mostDifficult.map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-700 truncate flex-1">{q.question_text || "(no text)"}</span>
                  <span className="badge bg-red-100 text-red-600 ml-3">{q.wrong_count} wrong</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
