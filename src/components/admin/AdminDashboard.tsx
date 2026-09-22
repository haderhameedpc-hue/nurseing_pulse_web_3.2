import { useState, useEffect } from "react";
import { Users, Layers, BookOpen, HelpCircle, FileText, Award, Trophy, ClipboardList, TrendingUp, History } from "lucide-react";
import { adminApi } from "@/lib/api";

interface DashboardData {
  totalStudents: number;
  totalStages: number;
  totalCourses: number;
  totalSubjects: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  totalCompleted: number;
  totalAchievements: number;
  totalBadges: number;
  totalTrophies: number;
  totalNameChanges: number;
  totalTemplates: number;
  recentStudents: { display_name: string; created_at: string }[];
  recentAttempts: { student_id: string; quiz_id: string; score: number; percentage: number; created_at: string }[];
  recentNameChanges: { previous_name: string; new_name: string; changed_at: string }[];
}

export function AdminDashboard({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard(token).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-12"><span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-slate-500 text-center py-8">Failed to load dashboard data.</p>;

  const stats = [
    { label: "Total Students", value: data.totalStudents, icon: <Users className="w-5 h-5" />, color: "text-teal-600 bg-teal-50" },
    { label: "Total Stages", value: data.totalStages, icon: <Layers className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
    { label: "Total Courses", value: data.totalCourses, icon: <BookOpen className="w-5 h-5" />, color: "text-indigo-600 bg-indigo-50" },
    { label: "Total Subjects", value: data.totalSubjects, icon: <BookOpen className="w-5 h-5" />, color: "text-cyan-600 bg-cyan-50" },
    { label: "Total Quizzes", value: data.totalQuizzes, icon: <FileText className="w-5 h-5" />, color: "text-teal-600 bg-teal-50" },
    { label: "Total Questions", value: data.totalQuestions, icon: <HelpCircle className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
    { label: "Total Attempts", value: data.totalAttempts, icon: <ClipboardList className="w-5 h-5" />, color: "text-slate-600 bg-slate-100" },
    { label: "Completed Quizzes", value: data.totalCompleted, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
    { label: "Total Badges", value: data.totalBadges, icon: <Award className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
    { label: "Total Trophies", value: data.totalTrophies, icon: <Trophy className="w-5 h-5" />, color: "text-teal-600 bg-teal-50" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Students */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> Recent Registrations
          </h3>
          {data.recentStudents.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{s.display_name}</span>
                  <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" /> Recent Attempts
          </h3>
          {data.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentAttempts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{a.percentage}%</span>
                  <span className="text-xs text-slate-400">{a.score.toFixed(0)} pts · {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Name Changes */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" /> Recent Name Changes
          </h3>
          {data.recentNameChanges.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No name changes yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentNameChanges.map((nc, i) => (
                <div key={i} className="text-sm">
                  <span className="text-slate-500 line-through">{nc.previous_name}</span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className="font-medium text-slate-700">{nc.new_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
