import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Trophy, ArrowRight, RotateCcw, Home, Star, Award } from "lucide-react";
import type { Quiz } from "@/lib/api";
import { studentApi } from "@/lib/api";

interface ResultProps {
  quiz: Quiz;
  result: {
    attempt_id: string;
    correct: number;
    wrong: number;
    total: number;
    percentage: number;
    earned_points: number;
    timed_bonus: number;
    total_score: number;
    max_score: number;
    is_100: boolean;
    completion_time: number;
  };
  onHome: () => void;
  onRetry: () => void;
}

export function QuizResult({ quiz, result, onHome, onRetry }: ResultProps) {
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  const canReview = quiz.review_wrong_answers && !result.is_100 && result.wrong > 0;

  const handleReview = async () => {
    try {
      const data = await studentApi.getAttempt(result.attempt_id);
      setReviewData(data);
      setShowReview(true);
    } catch {
      // ignore
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  if (showReview && reviewData) {
    const wrongAnswers = reviewData.answers?.filter((a: any) => !a.is_correct) || [];
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-bold text-slate-900 dark:text-white">مراجعة الإجابات الخاطئة</h1>
            <button onClick={() => setShowReview(false)} className="btn-ghost">
              العودة للنتيجة
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {wrongAnswers.map((a: any, i: number) => {
            const q = a.questions;
            const answers = [
              { key: "a", text: q?.answer_a },
              { key: "b", text: q?.answer_b },
              { key: "c", text: q?.answer_c },
              { key: "d", text: q?.answer_d },
              ...(q?.answer_e && q.answer_e.trim() ? [{ key: "e", text: q.answer_e }] : []),
            ];
            return (
              <div key={a.id} className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-left" dir="ltr">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">سؤال {i + 1}</span>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 leading-relaxed">{q?.question_text}</h3>
                {quiz.show_translations && q?.question_translation && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-right" dir="rtl">
                    <p className="text-sm text-blue-900 dark:text-blue-300">{q.question_translation}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {answers.map((ans) => {
                    const isCorrect = ans.key === a.correct_answer;
                    const isStudentWrong = ans.key === a.student_answer;
                    let cls = "border-slate-200 dark:border-slate-800 opacity-60 text-slate-600 dark:text-slate-400";
                    if (isCorrect) cls = "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 opacity-100 font-medium";
                    else if (isStudentWrong) cls = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 opacity-100 font-medium";
                    return (
                      <div key={ans.key} className={`p-3 rounded-xl border-2 flex items-center gap-3 ${cls}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCorrect ? "bg-green-500 text-white" : isStudentWrong ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}>
                          {ans.key.toUpperCase()}
                        </span>
                        <span className="flex-1">{ans.text}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {isStudentWrong && <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                    );
                  })}
                </div>
                {quiz.show_translations && q?.correct_answer_translation && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-right" dir="rtl">
                    <p className="text-sm text-blue-900 dark:text-blue-300"><strong>ترجمة الحل:</strong> {q.correct_answer_translation}</p>
                  </div>
                )}
                {quiz.show_explanations && q?.explanation && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-right" dir="rtl">
                    <p className="text-sm text-amber-900 dark:text-amber-300"><strong>الشرح:</strong> {q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex gap-3">
            <button onClick={onHome} className="btn-secondary flex-1">الرئيسية</button>
            <button onClick={onRetry} className="btn-primary flex-1">إعادة المحاولة</button>
          </div>
        </div>
      </div>
    );
  }

  const grade = result.percentage >= 90 ? "ممتاز جداً" : result.percentage >= 75 ? "جيد جداً" : result.percentage >= 50 ? "مقبول" : "تحتاج إلى تدريب";
  const gradeColor = result.percentage >= 90 ? "text-green-500" : result.percentage >= 75 ? "text-teal-400" : result.percentage >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg">
        <div className="card p-8 text-center animate-fadeIn bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r="64" fill="none" stroke="#334155" strokeWidth="12" />
              <circle
                cx="72"
                cy="72"
                r="64"
                fill="none"
                stroke="#0d9488"
                strokeWidth="12"
                strokeDasharray={`${(result.percentage / 100) * 402} 402`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${gradeColor}`}>{result.percentage}%</span>
              <span className="text-xs text-slate-400 mt-1">الدرجة</span>
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${gradeColor} mb-2`}>{grade}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{quiz.name}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-900/50">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.correct}</p>
              <p className="text-xs text-green-600 dark:text-green-300">صحيحة</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50">
              <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.wrong}</p>
              <p className="text-xs text-red-600 dark:text-red-300">خاطئة</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.total_score.toFixed(1)}</p>
              <p className="text-xs text-amber-600 dark:text-amber-300">النقاط المكتسبة</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatTime(result.completion_time)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">الوقت المستغرق</p>
            </div>
          </div>

          <div className="space-y-3">
            {canReview && (
              <button onClick={handleReview} className="btn-secondary w-full py-2.5">
                مراجعة الإجابات الخاطئة
              </button>
            )}
            <div className="flex gap-3">
              <button onClick={onHome} className="btn-secondary flex-1">
                الرئيسية
              </button>
              <button onClick={onRetry} className="btn-primary flex-1">
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}