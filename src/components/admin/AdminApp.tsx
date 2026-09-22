import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Layers, FileText, HelpCircle, FileEdit,
  Trophy, BarChart3, LogOut, Menu, X, Shield, ClipboardList,
  History, Award, Sliders, Sun, Moon
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { AdminStudents, AdminStudentDetail } from "./AdminStudents";
import { AdminStructure } from "./AdminStructure";
import { AdminQuizzes } from "./AdminQuizzes";
import { AdminQuestions } from "./AdminQuestions";
import { AdminTemplates } from "./AdminTemplates";
import { AdminBulkImport } from "./AdminBulkImport";
import { AdminAchievements } from "./AdminAchievements";
import { AdminLeaderboard } from "./AdminLeaderboard";
import { AdminAttempts, AdminAttemptDetail } from "./AdminAttempts";
import { AdminNameChanges } from "./AdminNameChanges";
import { AdminReports } from "./AdminReports";
import { AdminActivityLog } from "./AdminActivityLog";
import { AdminSettings } from "./AdminSettings";

type AdminPage =
  | "dashboard" | "students" | "student-detail" | "structure" | "quizzes"
  | "questions" | "templates" | "bulk-import" | "achievements" | "leaderboard"
  | "attempts" | "attempt-detail" | "name-changes" | "reports" | "activity-log" | "settings";

const navItems: { key: AdminPage; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "students", label: "Students", icon: <Users className="w-5 h-5" /> },
  { key: "structure", label: "Quiz Structure", icon: <Layers className="w-5 h-5" /> },
  { key: "quizzes", label: "Quizzes", icon: <FileText className="w-5 h-5" /> },
  { key: "questions", label: "Questions", icon: <HelpCircle className="w-5 h-5" /> },
  { key: "templates", label: "Question Templates", icon: <FileEdit className="w-5 h-5" /> },
  { key: "bulk-import", label: "Bulk Import", icon: <ClipboardList className="w-5 h-5" /> },
  { key: "achievements", label: "Achievements", icon: <Award className="w-5 h-5" /> },
  { key: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" /> },
  { key: "attempts", label: "Quiz Attempts", icon: <BarChart3 className="w-5 h-5" /> },
  { key: "name-changes", label: "Name Change History", icon: <History className="w-5 h-5" /> },
  { key: "reports", label: "Reports / Statistics", icon: <BarChart3 className="w-5 h-5" /> },
  { key: "activity-log", label: "Activity Log", icon: <ClipboardList className="w-5 h-5" /> },
  { key: "settings", label: "System Settings", icon: <Sliders className="w-5 h-5" /> },
];

interface AdminAppProps {
  token: string | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
}

export function AdminApp({ token, onLogin, onLogout }: AdminAppProps) {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  // تفعيل الوضع الليلي تلقائياً
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  if (!token) {
    return <AdminLogin onLogin={onLogin} onBack={() => { window.location.hash = ""; window.location.reload(); }} />;
  }

  const handleLogout = async () => {
    try { await adminApi.logout(token); } catch { /* ignore */ }
    onLogout();
    window.location.hash = "";
    window.location.reload();
  };

  const navigate = (p: AdminPage) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <AdminDashboard token={token} />;
      case "students": return <AdminStudents token={token} onViewStudent={(id) => { setSelectedStudentId(id); setPage("student-detail"); }} />;
      case "student-detail": return selectedStudentId ? <AdminStudentDetail token={token} studentId={selectedStudentId} onBack={() => setPage("students")} /> : null;
      case "structure": return <AdminStructure token={token} />;
      case "quizzes": return <AdminQuizzes token={token} />;
      case "questions": return <AdminQuestions token={token} />;
      case "templates": return <AdminTemplates token={token} />;
      case "bulk-import": return <AdminBulkImport token={token} />;
      case "achievements": return <AdminAchievements token={token} />;
      case "leaderboard": return <AdminLeaderboard token={token} />;
      case "attempts": return <AdminAttempts token={token} onViewAttempt={(id) => { setSelectedAttemptId(id); setPage("attempt-detail"); }} />;
      case "attempt-detail": return selectedAttemptId ? <AdminAttemptDetail token={token} attemptId={selectedAttemptId} onBack={() => setPage("attempts")} /> : null;
      case "name-changes": return <AdminNameChanges token={token} />;
      case "reports": return <AdminReports token={token} />;
      case "activity-log": return <AdminActivityLog token={token} />;
      case "settings": return <AdminSettings token={token} />;
      default: return <AdminDashboard token={token} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex transition-colors">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white border-r border-slate-800 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === item.key ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2 text-slate-300">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-slate-100">
                {navItems.find(n => n.key === page)?.label || "Admin"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </button>
              <a href="#" className="text-sm text-teal-400 hover:underline">View Site</a>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1 bg-slate-900 text-slate-100">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}