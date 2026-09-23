import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, XCircle, ArrowRight, X, Globe, Lightbulb, Timer, AlertCircle } from "lucide-react";
import type { Quiz, Question } from "@/lib/api";
import { studentApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface QuizPlayerProps {
  quiz: Quiz;
  studentId: string;
  mode: "timed" | "untimed";
  questionIds?: string[];
  isRetryWrong?: boolean;
  onComplete: (result: any) => void;
  onExit: () => void;
}

export function QuizPlayer({
  quiz,
  studentId,
  mode,
  questionIds,
  isRetryWrong = false,
  onComplete,
  onExit,
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_seconds);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const answersRef = useRef<Record<string, { answer: string; time_spent: number }>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // جلب الأسئلة مع دعم فلترة الأسئلة الخاطئة فقط عند إعادة المحاولة
  useEffect(() => {
    async function fetchQuestions() {
      try {
        let query = supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quiz.id)
          .eq("is_enabled", true)
          .eq("is_visible", true);

        if (questionIds && questionIds.length > 0) {
          query = query.in("id", questionIds);
        }

        const { data, error: qErr } = await query.order("sort_order");

        if (qErr) throw qErr;
        setQuestions(data || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "فشل في تحميل الأسئلة.");
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [quiz.id, questionIds]);

  const handleTimeExpired = useCallback(() => {
    setShowFeedback(true);
    const q = questions[currentIdx];
    if (q && !answersRef.current[q.id]) {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      answersRef.current[q.id] = { answer: "", time_spent: elapsed };
    }
  }, [currentIdx, questions, questionStartTime]);

  useEffect(() => {
    if (mode !== "timed" || showFeedback || loading || submitting) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, showFeedback, mode, loading, submitting, handleTimeExpired]);

  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    const q = questions[currentIdx];
    const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
    answersRef.current[q.id] = { answer, time_spent: elapsed };
    if (quiz.immediate_feedback) {
      setShowFeedback(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(quiz.time_limit_seconds);
      setQuestionStartTime(Date.now());
    } else {
      await submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const completionTime = Math.floor((Date.now() - quizStartTime) / 1000);

    // حساب الأسئلة الخاطئة محلياً بدقة
    const wrongIds = questions
      .filter((q) => answersRef.current[q.id]?.answer !== q.correct_answer)
      .map((q) => q.id);

    // في حال كان تدريباً على الأسئلة الخاطئة فقط: نحسب النتيجة محلياً لعدم كسر إحصائيات الطالب الرسمية
    if (isRetryWrong) {
      const correctCount = questions.length - wrongIds.length;
      const percentage = Math.round((correctCount / questions.length) * 100);
      onComplete({
        attempt_id: "",
        correct: correctCount,
        wrong: wrongIds.length,
        total: questions.length,
        percentage,
        earned_points: 0,
        timed_bonus: 0,
        total_score: 0,
        max_score: 0,
        is_100: wrongIds.length === 0,
        completion_time: completionTime,
        answers: answersRef.current,
        wrong_question_ids: wrongIds,
        isPractice: true,
      });
      return;
    }

    try {
      const result = await studentApi.submitAttempt({
        student_id: studentId,
        quiz_id: quiz.id,
        mode,
        answers: answersRef.current,
        completion_time_seconds: completionTime,
      });

      onComplete({
        attempt_id: result.attempt_id,
        correct: result.correct_answers,
        wrong: result.wrong_answers,
        total: result.total_questions,
        percentage: result.percentage,
        earned_points: result.earned_points,
        timed_bonus: result.timed_bonus_points,
        total_score: result.total_score,
        max_score: result.max_score,
        is_100: result.is_100_percent,
        completion_time: result.completion_time_seconds,
        answers: answersRef.current,
        wrong_question_ids: wrongIds,
      });
    } catch (err: any) {
      setError(err.message || "فشل إرسال الإجابات.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card p-8 max-w-md text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-200 mb-4">{error}</p>
          <button onClick={onExit} className="btn-primary">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card p-8 max-w-md text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-800 dark:text-slate-200 mb-4">لا توجد أسئلة متبقية في هذا الاختبار.</p>
          <button onClick={onExit} className="btn-primary">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const isCorrect = selectedAnswer === q.correct_answer;

  const answers = [
    { key: "a", text: q.answer_a },
    { key: "b", text: q.answer_b },
    { key: "c", text: q.answer_c },
    { key: "d", text: q.answer_d },
    ...(q.answer_e && q.answer_e.trim() ? [{ key: "e", text: q.answer_e }] : []),
  ];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* شريط الإشعار عند إعادة محاولة الأخطاء فقط */}
      {isRetryWrong && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>وضع تصحيح الأخطاء: يتم اختبارك في الأسئلة الخاطئة فقط ({questions.length} أسئلة)</span>
        </div>
      )}

      {/* الشريط العلوي */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 text-right">
            <h1 className="font-bold text-slate-900 dark:text-white truncate text-base">{quiz.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              السؤال {currentIdx + 1} من {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mode === "timed" && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                  timeLeft <= 10
                    ? "bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onExit} className="btn-ghost p-2" title="الخروج من الاختبار">
              <X className="w-5 h-5 text-slate-500 hover:text-slate-900 dark:hover:text-white" />
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${((currentIdx + (showFeedback ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* بطاقة السؤال والخيارات */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div
          className="card p-6 md:p-8 animate-fadeIn bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl"
          key={currentIdx}
        >
          <div className="mb-6 text-left" dir="ltr">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">{q.question_text}</h2>

            {/* ترجمة السؤال: تظهر فقط عند الاختيار (showFeedback) */}
            {showFeedback && quiz.show_translations && q.question_translation && (
              <div
                className="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-right animate-fadeIn"
                dir="rtl"
              >
                <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed font-medium">
                  {q.question_translation}
                </p>
              </div>
            )}
          </div>

          {/* الخيارات A, B, C, D, E */}
          <div className="space-y-3" dir="ltr">
            {answers.map((ans) => {
              const isSelected = selectedAnswer === ans.key;
              const isCorrectAns = ans.key === q.correct_answer;
              let cls =
                "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-teal-500 dark:hover:border-teal-500 text-slate-800 dark:text-slate-200";

              if (showFeedback) {
                if (isCorrectAns)
                  cls =
                    "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200";
                else if (isSelected)
                  cls =
                    "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
                else
                  cls =
                    "border-slate-200 dark:border-slate-800 opacity-50 text-slate-500 dark:text-slate-500";
              } else if (isSelected) {
                cls = "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200";
              }

              return (
                <button
                  key={ans.key}
                  onClick={() => handleSelectAnswer(ans.key)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cls} ${
                    showFeedback ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      showFeedback && isCorrectAns
                        ? "bg-green-500 text-white"
                        : showFeedback && isSelected
                        ? "bg-red-500 text-white"
                        : isSelected
                        ? "bg-teal-500 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {ans.key.toUpperCase()}
                  </span>
                  <span className="flex-1 font-medium text-sm md:text-base">{ans.text}</span>
                  {showFeedback && isCorrectAns && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  {showFeedback && isSelected && !isCorrectAns && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* التغذية الراجعة والترجمة والشرح */}
          {showFeedback && (
            <div className="mt-6 space-y-3 animate-fadeIn text-right" dir="rtl">
              <div
                className={`p-4 rounded-xl border ${
                  isCorrect
                    ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  <span className="font-bold text-sm">
                    {isCorrect ? "إجابة صحيحة، أحسنت!" : `إجابة خاطئة! الحل الصحيح هو: (${q.correct_answer.toUpperCase()})`}
                  </span>
                </div>
              </div>

              {quiz.show_translations && q.correct_answer_translation && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-300">
                  <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>ترجمة الحل:</strong> {q.correct_answer_translation}
                  </p>
                </div>
              )}

              {quiz.show_explanations && q.explanation && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-sm text-amber-900 dark:text-amber-300">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>الشرح والتوضيح:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* زر المتابعة */}
          {showFeedback && (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2 text-base font-bold shadow-lg"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{currentIdx < questions.length - 1 ? "السؤال التالي" : "إنهاء الاختبار"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}