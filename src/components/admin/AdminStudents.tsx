import { useState, useEffect } from "react";
import { Search, Eye, ArrowLeft, Trophy, Award, Clock, CheckCircle2, XCircle } from "lucide-react";
import { adminApi, Student } from "@/lib/api";
import { LoadingSpinner, EmptyState } from "./shared";

export function AdminStudents({
  token,
  onViewStudent,
}: {
  token: string;
  onViewStudent: (id: string) => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi
      .getStudents(token, search || undefined)
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, search]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m}m ${seconds % 60}s`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Search student by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState message="No students found." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Student ID</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Points</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Quizzes Completed</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Badges / Trophies</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Time Spent</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{st.display_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{st.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600">{st.total_points}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{st.total_completed_quizzes}</td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    <span className="badge bg-amber-100 text-amber-700 mr-1">{st.badge_count || 0}</span>
                    <span className="badge bg-teal-100 text-teal-700">{st.trophy_count || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatTime(st.total_time_spent_seconds)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => onViewStudent(st.id)} className="btn-ghost p-1.5" title="View Profile">
                      <Eye className="w-4 h-4 text-slate-600" />
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

export function AdminStudentDetail({
  token,
  studentId,
  onBack,
}: {
  token: string;
  studentId: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStudentDetail(token, studentId)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, studentId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState message="Student details not found." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="btn-ghost flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {/* Info Card */}
      <div className="card p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{data.display_name}</h2>
            <p className="text-xs font-mono text-slate-400 mt-1">ID: {data.id}</p>
            <p className="text-xs text-slate-500 mt-1">Registered: {new Date(data.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-500">{data.total_points}</span>
            <span className="block text-xs text-slate-400">Total Points</span>
          </div>
        </div>
      </div>

      {/* Name Changes History */}
      {data.nameChanges?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">Name Change History</h3>
          <div className="space-y-2">
            {data.nameChanges.map((nc: any) => (
              <div key={nc.id} className="text-sm border-b pb-2 flex justify-between">
                <span>
                  <span className="line-through text-slate-400">{nc.previous_name}</span> &rarr;{" "}
                  <strong className="text-slate-700">{nc.new_name}</strong>
                </span>
                <span className="text-xs text-slate-400">{new Date(nc.changed_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Attempts */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4 text-sm">All Quiz Attempts</h3>
        {data.attempts?.length === 0 ? (
          <p className="text-sm text-slate-400">No attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {data.attempts.map((att: any) => (
              <div key={att.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800">{att.quizzes?.name || "Quiz"}</p>
                  <span className="text-xs text-slate-400">{new Date(att.created_at).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700">{att.percentage}%</span>
                  <span className="block text-xs text-slate-500">{att.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}