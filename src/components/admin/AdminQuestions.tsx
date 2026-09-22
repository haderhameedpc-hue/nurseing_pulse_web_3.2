import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Copy, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Question, Quiz } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, Toggle, LoadingSpinner, EmptyState } from "./shared";

export function AdminQuestions({ token }: { token: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const { toast, showToast } = useToast();
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteQ, setDeleteQ] = useState<Question | null>(null);

  const load = () => {
    adminApi.getQuizzes(token).then(qz => {
      setQuizzes(qz);
      adminApi.getQuestions(token).then(qs => { setQuestions(qs); setLoading(false); }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  useEffect(() => {
    adminApi.getQuestions(token, quizFilter || undefined, search || undefined).then(setQuestions).catch(() => {});
  }, [search, quizFilter, token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateQuestion(token, id, data);
      else await adminApi.createQuestion(token, data);
      showToast(id ? "Question updated" : "Question created");
      setEditQ(null); setCreateOpen(false);
      load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDelete = async () => {
    if (!deleteQ) return;
    try { await adminApi.deleteQuestion(token, deleteQ.id); showToast("Question deleted"); setDeleteQ(null); load(); }
    catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDuplicate = async (q: Question) => {
    try { await adminApi.duplicateQuestion(token, q.id); showToast("Question duplicated"); load(); }
    catch (err) { showToast((err as Error).message, "error"); }
  };

  if (loading) return <LoadingSpinner />;

  const quizName = (id: string) => quizzes.find(q => q.id === id)?.name || "—";

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input-field max-w-xs" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field max-w-xs" value={quizFilter} onChange={e => setQuizFilter(e.target.value)}>
          <option value="">All Quizzes</option>
          {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2 ml-auto"><Plus className="w-4 h-4" /> Add Question</button>
      </div>

      {questions.length === 0 ? <EmptyState message="No questions found." /> : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge bg-slate-100 text-slate-600">{quizName(q.quiz_id)}</span>
                    <span className="text-xs text-slate-400">Answer: {q.correct_answer.toUpperCase()}</span>
                    {!q.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditQ(q)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDuplicate(q)} className="btn-ghost p-1.5" title="Duplicate"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteQ(q)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editQ || createOpen) && (
        <QuestionEditModal question={editQ} quizzes={quizzes} onClose={() => { setEditQ(null); setCreateOpen(false); }} onSave={handleSave} />
      )}

      {deleteQ && <ConfirmDialog title="Delete Question" message="Are you sure you want to delete this question?" onConfirm={handleDelete} onCancel={() => setDeleteQ(null)} />}

      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}

function QuestionEditModal({ question, quizzes, onClose, onSave }: {
  question: Question | null; quizzes: Quiz[];
  onClose: () => void; onSave: (id: string | null, data: any) => void;
}) {
  const [form, setForm] = useState<any>({
    quiz_id: question?.quiz_id || (quizzes[0]?.id || ""),
    question_text: question?.question_text || "",
    question_translation: question?.question_translation || "",
    answer_a: question?.answer_a || "",
    answer_b: question?.answer_b || "",
    answer_c: question?.answer_c || "",
    answer_d: question?.answer_d || "",
    correct_answer: question?.correct_answer || "a",
    correct_answer_translation: question?.correct_answer_translation || "",
    explanation: question?.explanation || "",
    sort_order: question?.sort_order ?? 0,
    is_enabled: question?.is_enabled ?? true,
    is_visible: question?.is_visible ?? true,
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal title={question ? "Edit Question" : "Add Question"} onClose={onClose} wide>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Quiz</label>
          <select className="input-field" value={form.quiz_id} onChange={e => set("quiz_id", e.target.value)}>
            {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label><textarea className="input-field" rows={2} value={form.question_text} onChange={e => set("question_text", e.target.value)} autoFocus /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Question Translation</label><textarea className="input-field" rows={2} value={form.question_translation} onChange={e => set("question_translation", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Answer A</label><input className="input-field" value={form.answer_a} onChange={e => set("answer_a", e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Answer B</label><input className="input-field" value={form.answer_b} onChange={e => set("answer_b", e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Answer C</label><input className="input-field" value={form.answer_c} onChange={e => set("answer_c", e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Answer D</label><input className="input-field" value={form.answer_d} onChange={e => set("answer_d", e.target.value)} /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer</label>
          <select className="input-field max-w-xs" value={form.correct_answer} onChange={e => set("correct_answer", e.target.value)}>
            <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer Translation</label><input className="input-field" value={form.correct_answer_translation} onChange={e => set("correct_answer_translation", e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label><textarea className="input-field" rows={2} value={form.explanation} onChange={e => set("explanation", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" className="input-field" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
          <Toggle checked={form.is_enabled} onChange={v => set("is_enabled", v)} label="Enabled" />
          <Toggle checked={form.is_visible} onChange={v => set("is_visible", v)} label="Visible" />
        </div>
        <div className="flex gap-3 justify-end pt-2"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={() => onSave(question?.id || null, form)} className="btn-primary">Save</button></div>
      </div>
    </Modal>
  );
}
