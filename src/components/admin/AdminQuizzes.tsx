import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Copy, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Quiz, Stage, Course, Subject, Folder } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, Toggle, LoadingSpinner, EmptyState } from "./shared";

export function AdminQuizzes({ token }: { token: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);

  const load = () => {
    Promise.all([
      adminApi.getQuizzes(token), adminApi.getStages(token), adminApi.getCourses(token),
      adminApi.getSubjects(token), adminApi.getFolders(token)
    ]).then(([q, st, co, su, fo]) => {
      setQuizzes(q); setStages(st); setCourses(co); setSubjects(su); setFolders(fo); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateQuiz(token, id, data);
      else await adminApi.createQuiz(token, data);
      showToast(id ? "Quiz updated" : "Quiz created");
      setEditQuiz(null); setCreateOpen(false);
      load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDelete = async () => {
    if (!deleteQuiz) return;
    try {
      await adminApi.deleteQuiz(token, deleteQuiz.id);
      showToast("Quiz deleted");
      setDeleteQuiz(null);
      load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDuplicate = async (q: Quiz) => {
    try {
      await adminApi.duplicateQuiz(token, q.id);
      showToast("Quiz duplicated");
      load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = quizzes.filter(q => !search || q.name.toLowerCase().includes(search.toLowerCase()));
  const subjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || "—";
  const folderName = (id: string | null) => folders.find(f => f.id === id)?.name || "—";

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <input className="input-field max-w-xs" placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Quiz</button>
      </div>

      {filtered.length === 0 ? <EmptyState message="No quizzes found." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Subject</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Folder</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Max Pts</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Modes</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{q.name}</td>
                  <td className="px-4 py-3 text-slate-500">{subjectName(q.subject_id)}</td>
                  <td className="px-4 py-3 text-slate-500">{folderName(q.folder_id)}</td>
                  <td className="px-4 py-3 text-right">{q.max_points}</td>
                  <td className="px-4 py-3 text-center text-xs">
                    {q.timed_mode_enabled && <span className="badge bg-teal-100 text-teal-700 mr-1">Timed</span>}
                    {q.untimed_mode_enabled && <span className="badge bg-blue-100 text-blue-700">Untimed</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {q.is_enabled ? <span className="badge bg-green-100 text-green-700">Enabled</span> : <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditQuiz(q)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDuplicate(q)} className="btn-ghost p-1.5" title="Duplicate"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteQuiz(q)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editQuiz || createOpen) && (
        <QuizEditModal
          quiz={editQuiz}
          subjects={subjects}
          folders={folders}
          onClose={() => { setEditQuiz(null); setCreateOpen(false); }}
          onSave={handleSave}
        />
      )}

      {deleteQuiz && <ConfirmDialog title="Delete Quiz" message={`Delete "${deleteQuiz.name}" and all its questions?`} onConfirm={handleDelete} onCancel={() => setDeleteQuiz(null)} />}

      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}

function QuizEditModal({ quiz, subjects, folders, onClose, onSave }: {
  quiz: Quiz | null; subjects: Subject[]; folders: Folder[];
  onClose: () => void; onSave: (id: string | null, data: any) => void;
}) {
  const [form, setForm] = useState<any>({
    name: quiz?.name || "",
    description: quiz?.description || "",
    instructions: quiz?.instructions || "",
    subject_id: quiz?.subject_id || (subjects[0]?.id || null),
    folder_id: quiz?.folder_id || null,
    max_points: quiz?.max_points ?? 100,
    timed_mode_enabled: quiz?.timed_mode_enabled ?? true,
    untimed_mode_enabled: quiz?.untimed_mode_enabled ?? true,
    time_limit_seconds: quiz?.time_limit_seconds ?? 60,
    timed_bonus_points: quiz?.timed_bonus_points ?? 0,
    immediate_feedback: quiz?.immediate_feedback ?? true,
    show_explanations: quiz?.show_explanations ?? true,
    show_translations: quiz?.show_translations ?? true,
    review_wrong_answers: quiz?.review_wrong_answers ?? true,
    is_enabled: quiz?.is_enabled ?? true,
    is_visible: quiz?.is_visible ?? true,
    sort_order: quiz?.sort_order ?? 0,
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const handleSave = () => { if (!form.name.trim()) return; onSave(quiz?.id || null, form); };
  const subjectFolders = folders.filter(f => f.subject_id === form.subject_id);

  return (
    <Modal title={quiz ? "Edit Quiz" : "Add Quiz"} onClose={onClose} wide>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Quiz Name</label><input className="input-field" value={form.name} onChange={e => set("name", e.target.value)} autoFocus /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label><textarea className="input-field" rows={2} value={form.instructions} onChange={e => set("instructions", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select className="input-field" value={form.subject_id || ""} onChange={e => set("subject_id", e.target.value || null)}>
              <option value="">— Select —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Folder (optional)</label>
            <select className="input-field" value={form.folder_id || ""} onChange={e => set("folder_id", e.target.value || null)}>
              <option value="">— None —</option>
              {subjectFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Max Points</label><input type="number" className="input-field" value={form.max_points} onChange={e => set("max_points", parseFloat(e.target.value) || 0)} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (sec)</label><input type="number" className="input-field" value={form.time_limit_seconds} onChange={e => set("time_limit_seconds", parseInt(e.target.value) || 0)} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Timed Bonus Pts</label><input type="number" className="input-field" value={form.timed_bonus_points} onChange={e => set("timed_bonus_points", parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Toggle checked={form.timed_mode_enabled} onChange={v => set("timed_mode_enabled", v)} label="Timed Mode" />
          <Toggle checked={form.untimed_mode_enabled} onChange={v => set("untimed_mode_enabled", v)} label="Untimed Mode" />
          <Toggle checked={form.immediate_feedback} onChange={v => set("immediate_feedback", v)} label="Immediate Feedback" />
          <Toggle checked={form.show_explanations} onChange={v => set("show_explanations", v)} label="Show Explanations" />
          <Toggle checked={form.show_translations} onChange={v => set("show_translations", v)} label="Show Translations" />
          <Toggle checked={form.review_wrong_answers} onChange={v => set("review_wrong_answers", v)} label="Review Wrong Answers" />
          <Toggle checked={form.is_enabled} onChange={v => set("is_enabled", v)} label="Enabled" />
          <Toggle checked={form.is_visible} onChange={v => set("is_visible", v)} label="Visible" />
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" className="input-field" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
        <div className="flex gap-3 justify-end pt-2"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} className="btn-primary">Save</button></div>
      </div>
    </Modal>
  );
}
