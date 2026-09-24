import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useStudent, useAdminToken } from "@/lib/hooks";
import type { Student, Quiz } from "@/lib/api";
import { Registration } from "@/components/student/Registration";
import { Home } from "@/components/student/Home";
import { ModeSelection, Profile, SettingsPage } from "@/components/student/Profile";
import { QuizPlayer } from "@/components/student/QuizPlayer";
import { QuizResult } from "@/components/student/QuizResult";
import { AdminApp } from "@/components/admin/AdminApp";

type View =
  | { name: "home" }
  | { name: "mode-select"; quiz: Quiz }
  | {
      name: "quiz";
      quiz: Quiz;
      mode: "timed" | "untimed";
      questionIds?: string[];
      isRetryWrong?: boolean;
    }
  | { name: "result"; quiz: Quiz; result: any; mode: "timed" | "untimed" }
  | { name: "profile" }
  | { name: "settings" }
  | { name: "admin" };

function App() {
  const { student, setStudent, setStudentId, logout, loading } = useStudent();
  const { token, login: setAdminLoginToken, logout: adminLogout, validating } = useAdminToken();
  const [view, setView] = useState<View>({ name: "home" });
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#admin") {
      setAdminMode(true);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setAdminMode(window.location.hash === "#admin");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (adminMode) {
    if (validating) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <AdminApp
        token={token}
        onLogin={(t) => {
          setAdminLoginToken(t);
        }}
        onLogout={() => {
          adminLogout();
          setAdminMode(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <Registration
        onRegistered={(s: Student) => {
          setStudentId(s.id);
          setStudent(s);
          setView({ name: "home" });
        }}
      />
    );
  }

  const adminLink = (
    <a
      href="#admin"
      className="fixed bottom-4 right-4 p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors z-40 opacity-40 hover:opacity-100"
      title="Admin Panel"
    >
      <Shield className="w-5 h-5" />
    </a>
  );

  switch (view.name) {
    case "home":
      return (
        <>
          <Home
            student={student}
            onLogout={() => {
              logout();
              setView({ name: "home" });
            }}
            onOpenSettings={() => setView({ name: "settings" })}
            onSelectQuiz={(quiz) => setView({ name: "mode-select", quiz })}
          />
          {adminLink}
        </>
      );
    case "mode-select":
      return (
        <>
          <ModeSelection
            quiz={view.quiz}
            onSelectMode={(mode) => setView({ name: "quiz", quiz: view.quiz, mode })}
            onBack={() => setView({ name: "home" })}
          />
          {adminLink}
        </>
      );
    case "quiz":
      return (
        <QuizPlayer
          quiz={view.quiz}
          studentId={student.id}
          mode={view.mode}
          questionIds={view.questionIds}
          isRetryWrong={view.isRetryWrong}
          onComplete={(result) => setView({ name: "result", quiz: view.quiz, result, mode: view.mode })}
          onExit={() => setView({ name: "home" })}
        />
      );
    case "result":
      return (
        <QuizResult
          quiz={view.quiz}
          result={view.result}
          onHome={() => {
            setView({ name: "home" });
            if (!view.result.isPractice) {
              setStudent({
                ...student,
                total_points: student.total_points + (view.result.total_score || 0),
                total_completed_quizzes: student.total_completed_quizzes + 1,
              });
            }
          }}
          onRetry={() => setView({ name: "mode-select", quiz: view.quiz })}
          onRetryWrong={(wrongIds) =>
            setView({
              name: "quiz",
              quiz: view.quiz,
              mode: view.mode,
              questionIds: wrongIds,
              isRetryWrong: true,
            })
          }
        />
      );
    case "profile":
      return (
        <>
          <Profile
            studentId={student.id}
            studentName={student.display_name}
            onBack={() => setView({ name: "home" })}
          />
          {adminLink}
        </>
      );
    case "settings":
      return (
        <SettingsPage
          studentId={student.id}
          currentName={student.display_name}
          onNameChanged={(newName) => setStudent({ ...student, display_name: newName })}
          onBack={() => setView({ name: "home" })}
        />
      );
    default:
      return null;
  }
}

export default App;