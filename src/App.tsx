import { useState, useEffect } from "react";
// import { Shield } from "lucide-react"; // تم تعطيلها لعدم الحاجة لها حالياً
import { useStudent } from "@/lib/hooks";
// import { useAdminToken } from "@/lib/hooks"; // معطل مؤقتاً
import type { Student, Quiz } from "@/lib/api";
import { Home } from "@/components/student/Home";
import { ModeSelection, Profile, SettingsPage } from "@/components/student/Profile";
import { QuizPlayer } from "@/components/student/QuizPlayer";
import { QuizResult } from "@/components/student/QuizResult";
// import { AdminApp } from "@/components/admin/AdminApp"; // معطل مؤقتاً

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
  | { name: "settings" };
  // | { name: "admin" }; // معطل مؤقتاً

function App() {
  // نستدعي معلومات الطالب الأساسية لتجنب تعطل المكونات، لكن سنتجاوز حالات التحميل
  const { student, setStudent, logout } = useStudent();
  const [view, setView] = useState<View>({ name: "home" });

  // إنشاء طالب وهمي (زائر) لتمريره للتطبيق فوراً وتجاوز شاشة تسجيل الدخول والتحميل
  const currentStudent: Student = student || {
    id: "guest_direct",
    display_name: "طالب زائر",
    total_points: 0,
    total_completed_quizzes: 0,
    created_at: new Date().toISOString()
  };

  /*
  ===========================================================================
    [الأكواد المعطلة: نظام الأدمن، لوحة تسجيل الدخول، وشاشات التحميل]
    تم وضعها هنا في تعليقات لكي تستعيدها بسهولة إذا غيرت رأيك لاحقاً.
  ===========================================================================
  const { token, login: setAdminLoginToken, logout: adminLogout, validating } = useAdminToken();
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
        onLogin={(t) => setAdminLoginToken(t)}
        onLogout={() => {
          adminLogout();
          setAdminMode(false);
        }}
      />
    );
  }

  // شاشات التحميل المعطلة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  // واجهة مطالبة الطالب بتسجيل الدخول المعطلة
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin inline-block" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">جاري التحميل...</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm py-2 px-4"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const adminLink = (
    <a href="#admin" title="Admin Panel"></a>
  );
  ===========================================================================
  */

  // عرض الواجهات مباشرة فور فتح الرابط
  switch (view.name) {
    case "home":
      return (
        <Home
          student={currentStudent}
          onLogout={() => {
            logout();
            setView({ name: "home" });
          }}
          onOpenSettings={() => setView({ name: "settings" })}
          onSelectQuiz={(quiz) => setView({ name: "mode-select", quiz })}
          onStudentUpdated={(updated) => setStudent(updated)}
        />
      );
    case "mode-select":
      return (
        <ModeSelection
          quiz={view.quiz}
          onSelectMode={(mode) => setView({ name: "quiz", quiz: view.quiz, mode })}
          onBack={() => setView({ name: "home" })}
        />
      );
    case "quiz":
      return (
        <QuizPlayer
          quiz={view.quiz}
          studentId={currentStudent.id}
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
                ...currentStudent,
                total_points: currentStudent.total_points + (view.result.total_score || 0),
                total_completed_quizzes: currentStudent.total_completed_quizzes + 1,
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
        <Profile
          studentId={currentStudent.id}
          studentName={currentStudent.display_name}
          onBack={() => setView({ name: "home" })}
        />
      );
    case "settings":
      return (
        <SettingsPage
          studentId={currentStudent.id}
          currentName={currentStudent.display_name}
          onNameChanged={(newName) => setStudent({ ...currentStudent, display_name: newName })}
          onBack={() => setView({ name: "home" })}
        />
      );
    default:
      return null;
  }
}

export default App;