import { useState, useEffect } from "react";
import { Eye, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { adminApi } from "@/lib/api";
import { LoadingSpinner, EmptyState } from "./shared";

export function AdminAttempts({ token, onViewAttempt }: { token: string; onViewAttempt: (id: string) => void }) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState("");
  const [quizFilter, setQuizFilter] = useState("");

  useEffect(() => {
    adminApi.getAttempts(token, studentFilter || undefined, quizFilter || undefined)
      .then(d => { setAttempts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, studentFilter, quizFilter]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-wrap gap-3">
        <input className="input-field max-w-xs" placeholder="Filter by Student ID..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)} />
        <input className="input-field max-w-xs" placeholder="Filter by Quiz ID..." value={quizFilter} onChange={e => setQuizFilter(e.target.value)} />
      </div>

      {attempts.length === 0 ? <EmptyState message="No quiz attempts found." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Quiz</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Score</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">%</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Correct</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Wrong</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Mode</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">View</th>
            </tr></thead>
            <tbody>
              {attempts.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{a.students?.display_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.quizzes?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{a.score.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right font-medium">{a.percentage}%</td>
                  <td className="px-4 py-3 text-right text-green-600">{a.correct_answers}</td>
                  <td className="px-4 py-3 text-right text-red-500">{a.wrong_answers}</td>
                  <td className="px-4 py-3 text-right">{formatTime(a.completion_time_seconds)}</td>
                  <td className="px-4 py-3 text-center"><span className={`badge ${a.mode === "timed" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>{a.mode}</span></td>
                  <td className="px-4 py-3 text-center"><button onClick={() => onViewAttempt(a.id)} className="btn-ghost p-1.5"><Eye className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminAttemptDetail({ token, attemptId, onBack }: { token: string; attemptId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAttemptDetail(token, attemptId).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token, attemptId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState message="Attempt not found." />;

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="space-y-4 animate-fadeIn">
      <button onClick={onBack} className="btn-ghost flex items-center gap-2"><ArrowLeft className="w-5 h-5" /> Back to Attempts</button>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-800">{data.quizzes?.name || "Quiz"}</h2>
        <p className="text-sm text-slate-500">Student: {data.students?.display_name}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Score</p><p className="font-bold text-slate-800">{data.score.toFixed(0)}/{data.max_score.toFixed(0)}</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Percentage</p><p className="font-bold text-slate-800">{data.percentage}%</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Correct</p><p className="font-bold text-green-600">{data.correct_answers}</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Wrong</p><p className="font-bold text-red-500">{data.wrong_answers}</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Time</p><p className="font-bold text-slate-800">{formatTime(data.completion_time_seconds)}</p></div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Question Details</h3>
        <div className="space-y-3">
          {data.answers?.map((a: any, i: number) => {
            const q = a.questions;
            const answers = [
              { key: "a", text: q?.answer_a || "" },
              { key: "b", text: q?.answer_b || "" },
              { key: "c", text: q?.answer_c || "" },
              { key: "d", text: q?.answer_d || "" },
            ];
            return (
              <div key={a.id} className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800 mb-2">{i + 1}. {q?.question_text}</p>
                <div className="space-y-1">
                  {answers.map(ans => {
                    const isCorrect = ans.key === a.correct_answer;
                    const isStudent = ans.key === a.student_answer;
                    let cls = "text-slate-500";
                    if (isCorrect) cls = "text-green-700 font-medium";
                    else if (isStudent && !isCorrect) cls = "text-red-600 font-medium";
                    return (
                      <div key={ans.key} className={`flex items-center gap-2 text-sm ${cls}`}>
                        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold">{ans.key.toUpperCase()}</span>
                        <span>{ans.text}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {isStudent && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">Time: {a.time_spent_seconds}s</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
