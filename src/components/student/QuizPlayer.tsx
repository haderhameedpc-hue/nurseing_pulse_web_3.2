import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, CheckCircle2, XCircle, ArrowRight, X, Globe, Lightbulb, Timer } from "lucide-react";
import type { Quiz, Question } from "@/lib/api";
import { studentApi } from "@/lib/api";

interface QuizPlayerProps {
  quiz: Quiz;
  studentId: string;
  mode: "timed" | "untimed";
  onComplete: (result: { attempt_id: string; correct: number; wrong: number; total: number; percentage: number; earned_points: number; timed_bonus: number; total_score: number; max_score: number; is_100: boolean; completion_time: number; answers: Record<string, { answer: string; time_spent: number }> }) => void;
  onExit: () => void;
}

export function QuizPlayer({ quiz, studentId, mode, onComplete, onExit }: QuizPlayerProps) {
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

  useEffect(() => {
    studentApi.getQuiz(quiz.id).then(data => {
      setQuestions(data.questions);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load quiz questions.");
      setLoading(false);
    });
  }, [quiz.id]);

  // Countdown timer for timed mode
  useEffect(() => {
    if (mode !== "timed" || showFeedback || loading || submitting) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time expired — show correct answer, lock interaction
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, showFeedback, mode, loading, submitting]);

  const handleTimeExpired = useCallback(() => {
    setShowFeedback(true);
    // Record no answer for this question
    const q = questions[currentIdx];
    if (q && !answersRef.current[q.id]) {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      answersRef.current[q.id] = { answer: "", time_spent: elapsed };
    }
  }, [currentIdx, questions, questionStartTime]);

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
      // Quiz complete — submit
      await submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const completionTime = Math.floor((Date.now() - quizStartTime) / 1000);
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
      });
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin inline-block mb-3" />
          <p className="text-slate-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 mb-4">{error}</p>
          <button onClick={onExit} className="btn-primary">Back to Home</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-md text-center">
          <p className="text-slate-700 mb-4">This quiz has no questions yet.</p>
          <button onClick={onExit} className="btn-primary">Back to Home</button>
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
  ];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-800 truncate">{quiz.name}</h1>
            <p className="text-xs text-slate-500">Question {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-3">
            {mode === "timed" && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${timeLeft <= 10 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"}`}>
                <Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onExit} className="btn-ghost p-2" title="Exit quiz">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${((currentIdx + (showFeedback ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 md:p-8 animate-fadeIn" key={currentIdx}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">{q.question_text}</h2>
            {quiz.show_translations && q.question_translation && showFeedback && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fadeIn">
                <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">{q.question_translation}</p>
              </div>
            )}
          </div>

          {/* Answers */}
          <div className="space-y-3">
            {answers.map(ans => {
              const isSelected = selectedAnswer === ans.key;
              const isCorrectAns = ans.key === q.correct_answer;
              let cls = "border-slate-200 hover:border-teal-300 hover:bg-teal-50/30";
              if (showFeedback) {
                if (isCorrectAns) cls = "border-green-500 bg-green-50";
                else if (isSelected) cls = "border-red-500 bg-red-50";
                else cls = "border-slate-200 opacity-60";
              } else if (isSelected) {
                cls = "border-teal-500 bg-teal-50";
              }

              return (
                <button
                  key={ans.key}
                  onClick={() => handleSelectAnswer(ans.key)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cls} ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                    showFeedback && isCorrectAns ? "bg-green-500 text-white" :
                    showFeedback && isSelected ? "bg-red-500 text-white" :
                    isSelected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {ans.key.toUpperCase()}
                  </span>
                  <span className="text-slate-800 flex-1">{ans.text}</span>
                  {showFeedback && isCorrectAns && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {showFeedback && isSelected && !isCorrectAns && <XCircle className="w-5 h-5 text-red-600" />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className="mt-6 space-y-3 animate-fadeIn">
              <div className={`p-4 rounded-xl ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                  <span className={`font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                    {isCorrect ? "Correct!" : "Wrong!"}
                  </span>
                  {!isCorrect && (
                    <span className="text-sm text-red-600">
                      The correct answer is {q.correct_answer.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {quiz.show_translations && q.correct_answer_translation && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <strong>Translation:</strong> {q.correct_answer_translation}
                  </p>
                </div>
              )}

              {quiz.show_explanations && q.explanation && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next button */}
          {showFeedback && (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 animate-fadeIn"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? "Next Question" : "Finish Quiz"}
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
