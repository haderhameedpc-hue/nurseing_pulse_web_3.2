import { useState, useEffect } from "react";
import { Users, Layers, BookOpen, HelpCircle, FileText, Award, Trophy, ClipboardList, TrendingUp, History } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardData {
  totalStudents: number;
  totalStages: number;
  totalCourses: number;
  totalSubjects: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  totalCompleted: number;
  totalBadges: number;
  totalTrophies: number;
  recentStudents: { display_name: string; created_at: string }[];
  recentAttempts: { student_id: string; quiz_id: string; score: number; percentage: number; created_at: string }[];
  recentNameChanges: { previous_name: string; new_name: string; changed_at: string }[];
}

export function AdminDashboard({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          studentsRes, stagesRes, coursesRes, subjectsRes, quizzesRes,
          questionsRes, attemptsRes, completedRes, badgesRes, trophiesRes,
          recentStudentsRes, recentAttemptsRes, recentNameChangesRes
        ] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("stages").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("subjects").select("id", { count: "exact", head: true }),
          supabase.from("quizzes").select("id", { count: "exact", head: true }),
          supabase.from("questions").select("id", { count: "exact", head: true }),
          supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
          supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("achievements").select("id", { count: "exact", head: true }).eq("achievement_type", "badge"),
          supabase.from("achievements").select("id", { count: "exact", head: true }).eq("achievement_type", "trophy"),
          supabase.from("students").select("display_name, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("quiz_attempts").select("student_id, quiz_id, score, percentage, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("name_change_history").select("previous_name, new_name, changed_at").order("changed_at", { ascending: false }).limit(5),
        ]);

        setData({
          totalStudents: studentsRes.count ?? 0,
          totalStages: stagesRes.count ?? 0,
          totalCourses: coursesRes.count ?? 0,
          totalSubjects: subjectsRes.count ?? 0,
          totalQuizzes: quizzesRes.count ?? 0,
          totalQuestions: questionsRes.count ?? 0,
          totalAttempts: attemptsRes.count ?? 0,
          totalCompleted: completedRes.count ?? 0,
          totalBadges: badgesRes.count ?? 0,
          totalTrophies: trophiesRes.count ?? 0,
          recentStudents: recentStudentsRes.data ?? [],
          recentAttempts: recentAttemptsRes.data ?? [],
          recentNameChanges: recentNameChangesRes.data ?? [],
        });
      } catch (err) {
        console.error("Failed to load dashboard directly:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
        <p className="text-slate-400">Failed to load dashboard data. Please verify database connection.</p>
      </div>
    );
  }

  const stats = [
    { label: "Total Students", value: data.totalStudents, icon: <Users className="w-5 h-5" />, color: "text-teal-400 bg-teal-950/60" },
    { label: "Total Stages", value: data.totalStages, icon: <Layers className="w-5 h-5" />, color: "text-blue-400 bg-blue-950/60" },
    { label: "Total Courses", value: data.totalCourses, icon: <BookOpen className="w-5 h-5" />, color: "text-indigo-400 bg-indigo-950/60" },
    { label: "Total Subjects", value: data.totalSubjects, icon: <BookOpen className="w-5 h-5" />, color: "text-cyan-400 bg-cyan-950/60" },
    { label: "Total Quizzes", value: data.totalQuizzes, icon: <FileText className="w-5 h-5" />, color: "text-teal-400 bg-teal-950/60" },
    { label: "Total Questions", value: data.totalQuestions, icon: <HelpCircle className="w-5 h-5" />, color: "text-amber-400 bg-amber-950/60" },
    { label: "Total Attempts", value: data.totalAttempts, icon: <ClipboardList className="w-5 h-5" />, color: "text-slate-300 bg-slate-800" },
    { label: "Completed Quizzes", value: data.totalCompleted, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-400 bg-green-950/60" },
    { label: "Total Badges", value: data.totalBadges, icon: <Award className="w-5 h-5" />, color: "text-amber-400 bg-amber-950/60" },
    { label: "Total Trophies", value: data.totalTrophies, icon: <Trophy className="w-5 h-5" />, color: "text-teal-400 bg-teal-950/60" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* الطلاب المسجلين حديثاً */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" /> Recent Registrations
          </h3>
          {data.recentStudents.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-800/60 last:border-0">
                  <span className="font-medium text-slate-300">{s.display_name}</span>
                  <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* المحاولات الأخيرة */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" /> Recent Attempts
          </h3>
          {data.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentAttempts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-800/60 last:border-0">
                  <span className="font-medium text-slate-300">{a.percentage}%</span>
                  <span className="text-xs text-slate-500">{a.score.toFixed(0)} pts &bull; {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تغييرات الأسماء الأخيرة */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> Recent Name Changes
          </h3>
          {data.recentNameChanges.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No name changes yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentNameChanges.map((nc, i) => (
                <div key={i} className="text-sm py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-500 line-through">{nc.previous_name}</span>
                  <span className="text-slate-400 mx-2">&rarr;</span>
                  <span className="font-medium text-slate-300">{nc.new_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}