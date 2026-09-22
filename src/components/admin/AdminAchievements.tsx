import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Award, Trophy } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Achievement, Quiz } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, Toggle, LoadingSpinner, EmptyState } from "./shared";

export function AdminAchievements({ token }: { token: string }) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const [editA, setEditA] = useState<Achievement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteA, setDeleteA] = useState<Achievement | null>(null);

  const load = () => {
    Promise.all([adminApi.getAchievements(token), adminApi.getQuizzes(token)])
      .then(([a, q]) => { setItems(a); setQuizzes(q); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(load, [token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateAchievement(token, id, data);
      else await adminApi.createAchievement(token, data);
      showToast(id ? "Achievement updated" : "Achievement created");
      setEditA(null); setCreateOpen(false); load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDelete = async () => {
    if (!deleteA) return;
    try { await adminApi.deleteAchievement(token, deleteA.id); showToast("Achievement deleted"); setDeleteA(null); load(); }
    catch (err) { showToast((err as Error).message, "error"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Create badges and trophies with automatic evaluation conditions.</p>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Achievement</button>
      </div>

      {items.length === 0 ? <EmptyState message="No achievements yet." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${a.achievement_type === "badge" ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"}`}>
                  {a.achievement_type === "badge" ? <Award className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{a.name}</h3>
                  <p className="text-sm text-slate-500">{a.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${a.achievement_type === "badge" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>{a.achievement_type}</span>
                    <span className="badge bg-slate-100 text-slate-600">{a.condition_type.replace(/_/g, " ")}</span>
                    {!a.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditA(a)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteA(a)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editA || createOpen) && <AchievementModal achievement={editA} quizzes={quizzes} onClose={() => { setEditA(null); setCreateOpen(false); }} onSave={handleSave} />}
      {deleteA && <ConfirmDialog title="Delete Achievement" message={`Delete "${deleteA.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteA(null)} />}
      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}

const conditionTypes = [
  { value: "total_points", label: "Total Points Reached" },
  { value: "total_percentage", label: "Best Percentage Reached" },
  { value: "quiz_100_percent", label: "100% on Any Quiz" },
  { value: "completed_quizzes_count", label: "Completed Quizzes Count" },
  { value: "completed_specific_quiz", label: "Completed Specific Quiz" },
  { value: "completion_time_within", label: "Completion Time Within (seconds)" },
  { value: "timed_mode_count", label: "Timed Mode Attempts Count" },
  { value: "highest_score", label: "Highest Score Reached" },
];

function AchievementModal({ achievement, quizzes, onClose, onSave }: {
  achievement: Achievement | null; quizzes: Quiz[];
  onClose: () => void; onSave: (id: string | null, data: any) => void;
}) {
  const [form, setForm] = useState<any>({
    name: achievement?.name || "",
    description: achievement?.description || "",
    icon_url: achievement?.icon_url || "",
    achievement_type: achievement?.achievement_type || "badge",
    condition_type: achievement?.condition_type || "total_points",
    condition_value: achievement?.condition_value || {},
    is_enabled: achievement?.is_enabled ?? true,
    is_visible: achievement?.is_visible ?? true,
  });
  const [condValue, setCondValue] = useState<string>(
    (achievement?.condition_value as any)?.value?.toString() || (achievement?.condition_value as any)?.quiz_id || ""
  );
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    let cv: any = {};
    if (form.condition_type === "completed_specific_quiz") {
      cv = { quiz_id: condValue };
    } else {
      cv = { value: form.condition_type === "total_points" || form.condition_type === "highest_score" ? parseFloat(condValue) || 0 : parseInt(condValue) || 0 };
    }
    onSave(achievement?.id || null, { ...form, condition_value: cv });
  };

  const needsValue = form.condition_type !== "quiz_100_percent";
  const needsQuiz = form.condition_type === "completed_specific_quiz";

  return (
    <Modal title={achievement ? "Edit Achievement" : "Add Achievement"} onClose={onClose} wide>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input className="input-field" value={form.name} onChange={e => set("name", e.target.value)} autoFocus /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select className="input-field" value={form.achievement_type} onChange={e => set("achievement_type", e.target.value)}>
              <option value="badge">Badge</option><option value="trophy">Trophy</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
            <select className="input-field" value={form.condition_type} onChange={e => set("condition_type", e.target.value)}>
              {conditionTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        {needsQuiz && (
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Select Quiz</label>
            <select className="input-field" value={condValue} onChange={e => setCondValue(e.target.value)}>
              <option value="">— Select —</option>
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
        )}
        {needsValue && !needsQuiz && (
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Value</label><input type="number" className="input-field" value={condValue} onChange={e => setCondValue(e.target.value)} /></div>
        )}
        <div className="flex gap-6"><Toggle checked={form.is_enabled} onChange={v => set("is_enabled", v)} label="Enabled" /><Toggle checked={form.is_visible} onChange={v => set("is_visible", v)} label="Visible" /></div>
        <div className="flex gap-3 justify-end pt-2"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} className="btn-primary">Save</button></div>
      </div>
    </Modal>
  );
}
