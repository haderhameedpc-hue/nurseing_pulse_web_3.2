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
  const [reviewData, setReviewData] = useState<null | {
    answers: Array<{
      id: string;
      student_answer: string | null;
      correct_answer: string;
      is_correct: boolean;
      questions: {
        question_text: string;
        question_translation: string;
        answer_a: string;
        answer_b: string;
        answer_c: string;
        answer_d: string;
        correct_answer_translation: string;
        explanation: string;
      };
    }>;
  }>(null);

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
    const wrongAnswers = reviewData.answers.filter(a => !a.is_correct);
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-semibold text-slate-800">Review Wrong Answers</h1>
            <button onClick={() => setShowReview(false)} className="btn-ghost">Back to Results</button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {wrongAnswers.map((a, i) => {
            const q = a.questions;
            const answers = [
              { key: "a", text: q.answer_a },
              { key: "b", text: q.answer_b },
              { key: "c", text: q.answer_c },
              { key: "d", text: q.answer_d },
            ];
            return (
              <div key={a.id} className="card p-6 animate-fadeIn">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-red-100 text-red-700">Question {i + 1}</span>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-4">{q.question_text}</h3>

                {quiz.show_translations && q.question_translation && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">{q.question_translation}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {answers.map(ans => {
                    const isCorrect = ans.key === a.correct_answer;
                    const isStudentWrong = ans.key === a.student_answer;
                    let cls = "border-slate-200 opacity-60";
                    if (isCorrect) cls = "border-green-500 bg-green-50";
                    else if (isStudentWrong) cls = "border-red-500 bg-red-50";
                    return (
                      <div key={ans.key} className={`p-3 rounded-lg border-2 flex items-center gap-3 ${cls}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                          isCorrect ? "bg-green-500 text-white" : isStudentWrong ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {ans.key.toUpperCase()}
                        </span>
                        <span className="text-slate-700 flex-1">{ans.text}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {isStudentWrong && <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                    );
                  })}
                </div>

                {quiz.show_translations && q.correct_answer_translation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800"><strong>Translation:</strong> {q.correct_answer_translation}</p>
                  </div>
                )}
                {quiz.show_explanations && q.explanation && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-sm text-amber-800"><strong>Explanation:</strong> {q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-3">
            <button onClick={onHome} className="btn-secondary flex items-center gap-2">
              <Home className="w-5 h-5" /> Home
            </button>
            <button onClick={onRetry} className="btn-primary flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const grade = result.percentage >= 90 ? "Excellent" : result.percentage >= 75 ? "Good" : result.percentage >= 50 ? "Fair" : "Keep Practicing";
  const gradeColor = result.percentage >= 90 ? "text-green-600" : result.percentage >= 75 ? "text-teal-600" : result.percentage >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="card p-8 text-center animate-fadeIn">
          {/* Score Circle */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r="64" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle
                cx="72" cy="72" r="64" fill="none" stroke="#0d9488" strokeWidth="12"
                strokeDasharray={`${(result.percentage / 100) * 402} 402`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${gradeColor}`}>{result.percentage}%</span>
              <span className="text-xs text-slate-500 mt-1">Score</span>
            </div>
            {result.is_100 && (
              <div className="absolute -top-2 -right-2">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>

          <h2 className={`text-2xl font-bold ${gradeColor} mb-2`}>{grade}</h2>
          <p className="text-slate-500 mb-6">{quiz.name}</p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{result.correct}</p>
              <p className="text-xs text-green-600">Correct</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{result.wrong}</p>
              <p className="text-xs text-red-500">Wrong</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{result.total_score.toFixed(1)}</p>
              <p className="text-xs text-amber-600">Points Earned</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{formatTime(result.completion_time)}</p>
              <p className="text-xs text-blue-600">Time</p>
            </div>
          </div>

          {result.timed_bonus > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-teal-50 rounded-lg">
              <Award className="w-5 h-5 text-teal-600" />
              <p className="text-sm text-teal-700">Timed mode bonus: +{result.timed_bonus} points</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {canReview && (
              <button onClick={handleReview} className="btn-secondary w-full flex items-center justify-center gap-2">
                Review Wrong Answers
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div className="flex gap-3">
              <button onClick={onHome} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Home className="w-5 h-5" /> Home
              </button>
              <button onClick={onRetry} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
