import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, ArrowLeft, Trophy, Award, Target, TrendingUp } from "lucide-react";
import { studentApi } from "@/lib/api";
import type { Quiz } from "@/lib/api";

interface ModeSelectionProps {
  quiz: Quiz;
  onSelectMode: (mode: "timed" | "untimed") => void;
  onBack: () => void;
}

export function ModeSelection({ quiz, onSelectMode, onBack }: ModeSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg">
        <button
          onClick={onBack}
          className="btn-ghost mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" /> العودة للرئيسية
        </button>
        <div className="card p-8 animate-fadeIn bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl text-right">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{quiz.name}</h1>
          {quiz.description && (
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">{quiz.description}</p>
          )}
          {quiz.instructions && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60 mb-6">
              <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">{quiz.instructions}</p>
            </div>
          )}
          <div className="space-y-3">
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">اختر نمط الاختبار:</p>
            {quiz.timed_mode_enabled && (
              <button
                onClick={() => onSelectMode("timed")}
                className="w-full text-right p-5 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-all group bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="p-3 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">نمط المؤقت (Timed Mode)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {quiz.time_limit_seconds} ثانية لكل سؤال
                      {quiz.timed_bonus_points > 0 ? ` • +${quiz.timed_bonus_points} نقاط إضافية` : ""}
                    </p>
                  </div>
                </div>
              </button>
            )}
            {quiz.untimed_mode_enabled && (
              <button
                onClick={() => onSelectMode("untimed")}
                className="w-full text-right p-5 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-all group bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">نمط بدون وقت (Untimed Mode)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">بدون ضغط عداد الوقت • تصفح براحتك</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfileProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

export function Profile({ studentId, studentName, onBack }: ProfileProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentApi.getMyAttempts(studentId), studentApi.getStudent(studentId)])
      .then(([attData, stData]) => {
        setAttempts(attData || []);
        setAchievements(stData.achievements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const badges = achievements.filter((a: any) => a.achievements?.achievement_type === "badge");
  const trophies = achievements.filter((a: any) => a.achievements?.achievement_type === "trophy");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> العودة
          </button>
          <h1 className="font-semibold text-slate-800 dark:text-slate-100">الملف الشخصي</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{studentName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">معرف الطالب: {studentId.slice(0, 8)}...</p>
        </div>

        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> الأوسمة والجوائز
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <Award className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{badges.length}</p>
              <p className="text-sm text-amber-600 dark:text-amber-300">أوسمة</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/50">
              <Trophy className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-2" />
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{trophies.length}</p>
              <p className="text-sm text-teal-600 dark:text-teal-300">كؤوس</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" /> سجل المحاولات
          </h3>
          {attempts.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">لا توجد محاولات حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att: any) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{att.quizzes?.name || "اختبار"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> {att.correct_answers}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" /> {att.wrong_answers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(att.completion_time_seconds)}
                      </span>
                    </div>
                  </div>
                  <div className="text-left mr-4">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{att.percentage}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{att.score.toFixed(0)} نقطة</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  studentId: string;
  currentName: string;
  onNameChanged: (newName: string) => void;
  onBack: () => void;
}

export function SettingsPage({ studentId, currentName, onNameChanged, onBack }: SettingsProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newName.trim()) {
      setError("يرجى إدخال الاسم الجديد.");
      return;
    }
    setLoading(true);
    try {
      await studentApi.changeName(studentId, newName);
      setSuccess("تم تغيير الاسم بنجاح!");
      onNameChanged(newName.trim());
      setNewName("");
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> العودة
          </button>
          <h1 className="font-semibold text-slate-900 dark:text-white">الإعدادات</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">تغيير اسم الطالب</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            الاسم الحالي: <strong>{currentName}</strong>
          </p>
          <form onSubmit={handleChange} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">الاسم الجديد</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: أحمد علي12"
                className="input-field"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "جاري الحفظ..." : "حفظ الاسم"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}