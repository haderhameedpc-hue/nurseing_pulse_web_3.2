import { useState, useEffect } from "react";
import { Search, Eye, Trophy, Award, Target, Clock } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Student } from "@/lib/api";
import { LoadingSpinner, EmptyState, SearchBar } from "./shared";

export function AdminStudents({ token, onViewStudent }: { token: string; onViewStudent: (id: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.getStudents(token).then(d => { setStudents(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (search.length >= 2 || search.length === 0) {
      adminApi.getStudents(token, search || undefined).then(setStudents).catch(() => {});
    }
  }, [search, token]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or ID..." />
      {students.length === 0 ? (
        <EmptyState message="No students found." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Registered</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Points</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Completed</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Attempts</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Badges</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Trophies</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Score</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.display_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{s.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">{s.total_points.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">{s.total_completed_quizzes}</td>
                  <td className="px-4 py-3 text-right">{s.total_attempts}</td>
                  <td className="px-4 py-3 text-right">{s.badge_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">{s.trophy_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {s.total_attempts > 0 ? (s.total_points / s.total_attempts).toFixed(0) : "0"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => onViewStudent(s.id)} className="btn-ghost p-1.5" title="View Profile">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminStudentDetail({ token, studentId, onBack }: { token: string; studentId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStudentDetail(token, studentId).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token, studentId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState message="Student not found." />;

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const badges = (data.achievements || []).filter((a: any) => a.achievements?.achievement_type === "badge");
  const trophies = (data.achievements || []).filter((a: any) => a.achievements?.achievement_type === "trophy");

  return (
    <div className="space-y-4 animate-fadeIn">
      <button onClick={onBack} className="btn-ghost flex items-center gap-2">← Back to Students</button>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-800">{data.display_name}</h2>
        <p className="text-sm text-slate-500 mt-1">Student ID: {data.id}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-amber-50 rounded-lg"><Trophy className="w-5 h-5 text-amber-500 mb-1" /><p className="font-bold text-amber-700">{data.total_points.toFixed(0)}</p><p className="text-xs text-amber-600">Points</p></div>
          <div className="p-3 bg-teal-50 rounded-lg"><Target className="w-5 h-5 text-teal-600 mb-1" /><p className="font-bold text-teal-700">{data.total_completed_quizzes}</p><p className="text-xs text-teal-600">Completed</p></div>
          <div className="p-3 bg-slate-100 rounded-lg"><Award className="w-5 h-5 text-slate-600 mb-1" /><p className="font-bold text-slate-700">{badges.length + trophies.length}</p><p className="text-xs text-slate-600">Achievements</p></div>
          <div className="p-3 bg-blue-50 rounded-lg"><Clock className="w-5 h-5 text-blue-500 mb-1" /><p className="font-bold text-blue-700">{formatTime(data.total_time_spent_seconds)}</p><p className="text-xs text-blue-600">Time Spent</p></div>
        </div>
      </div>

      {(data.nameChanges?.length > 0) && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Name Change History</h3>
          <div className="space-y-2">
            {data.nameChanges.map((nc: any) => (
              <div key={nc.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                <span><span className="text-slate-500 line-through">{nc.previous_name}</span> → <span className="font-medium">{nc.new_name}</span></span>
                <span className="text-xs text-slate-400">{new Date(nc.changed_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-3">Quiz History</h3>
        {(data.attempts?.length === 0) ? <EmptyState message="No quiz attempts yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Quiz</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Score</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">%</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Correct</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Wrong</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Time</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">Mode</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{a.quizzes?.name || "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-right">{a.score.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-medium">{a.percentage}%</td>
                    <td className="px-3 py-2 text-right text-green-600">{a.correct_answers}</td>
                    <td className="px-3 py-2 text-right text-red-500">{a.wrong_answers}</td>
                    <td className="px-3 py-2 text-right">{formatTime(a.completion_time_seconds)}</td>
                    <td className="px-3 py-2 text-center"><span className={`badge ${a.mode === "timed" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>{a.mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
