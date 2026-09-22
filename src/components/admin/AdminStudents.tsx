import { useState, useEffect } from "react";
import { Search, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner, EmptyState } from "./shared";

export function AdminStudents({
  token,
  onViewStudent,
}: {
  token: string;
  onViewStudent: (id: string) => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        let q = supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        if (search.trim()) {
          q = q.ilike("display_name", `%${search.trim()}%`);
        }

        const { data, error } = await q;
        if (!error && data) {
          setStudents(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Search student by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          No students found.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Student ID</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Total Points</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Quizzes Completed</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Time Spent</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-medium text-slate-200">{st.display_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{st.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-400">{st.total_points}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{st.total_completed_quizzes}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{formatTime(st.total_time_spent_seconds || 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => onViewStudent(st.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400 transition-colors" title="View Profile">
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

export function AdminStudentDetail({
  token,
  studentId,
  onBack,
}: {
  token: string;
  studentId: string;
  onBack: () => void;
}) {
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [nameChanges, setNameChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const [stRes, attRes, ncRes] = await Promise.all([
          supabase.from("students").select("*").eq("id", studentId).single(),
          supabase.from("quiz_attempts").select("*, quizzes(name)").eq("student_id", studentId).order("created_at", { ascending: false }),
          supabase.from("name_change_history").select("*").eq("student_id", studentId).order("changed_at", { ascending: false }),
        ]);

        if (stRes.data) setStudent(stRes.data);
        if (attRes.data) setAttempts(attRes.data || []);
        if (ncRes.data) setNameChanges(ncRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [studentId]);

  if (loading) return <LoadingSpinner />;
  if (!student) return <EmptyState message="Student details not found." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {/* Info Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">{student.display_name}</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">ID: {student.id}</p>
            <p className="text-xs text-slate-400 mt-1">Registered: {new Date(student.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-400">{student.total_points}</span>
            <span className="block text-xs text-slate-500">Total Points</span>
          </div>
        </div>
      </div>

      {/* Name Changes History */}
      {nameChanges.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-200 mb-3 text-sm">Name Change History</h3>
          <div className="space-y-2">
            {nameChanges.map((nc) => (
              <div key={nc.id} className="text-sm border-b border-slate-800/60 pb-2 flex justify-between">
                <span>
                  <span className="line-through text-slate-500">{nc.previous_name}</span> &rarr;{" "}
                  <strong className="text-teal-400">{nc.new_name}</strong>
                </span>
                <span className="text-xs text-slate-500">{new Date(nc.changed_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Attempts */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-slate-200 mb-4 text-sm">All Quiz Attempts</h3>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500">No attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {attempts.map((att) => (
              <div key={att.id} className="p-3 bg-slate-900 rounded-lg flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-200">{att.quizzes?.name || "Quiz"}</p>
                  <span className="text-xs text-slate-500">{new Date(att.created_at).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-200">{att.percentage}%</span>
                  <span className="block text-xs text-slate-400">{att.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}