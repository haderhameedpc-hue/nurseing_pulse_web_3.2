import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { QuestionTemplate } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, Toggle, LoadingSpinner, EmptyState } from "./shared";

export function AdminTemplates({ token }: { token: string }) {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const [editT, setEditT] = useState<QuestionTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteT, setDeleteT] = useState<QuestionTemplate | null>(null);

  const load = () => {
    adminApi.getTemplates(token).then(d => { setTemplates(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, [token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateTemplate(token, id, data);
      else await adminApi.createTemplate(token, data);
      showToast(id ? "Template updated" : "Template created");
      setEditT(null); setCreateOpen(false); load();
    } catch (err) { showToast((err as Error).message, "error"); }
  };

  const handleDelete = async () => {
    if (!deleteT) return;
    try { await adminApi.deleteTemplate(token, deleteT.id); showToast("Template deleted"); setDeleteT(null); load(); }
    catch (err) { showToast((err as Error).message, "error"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Templates define reusable question formats for bulk import.</p>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Template</button>
      </div>

      {templates.length === 0 ? <EmptyState message="No templates yet." /> : (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{t.name}</h3>
                  {t.template_text && <pre className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{t.template_text}</pre>}
                  <div className="flex items-center gap-2 mt-2">
                    {!t.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditT(t)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteT(t)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editT || createOpen) && <TemplateModal template={editT} onClose={() => { setEditT(null); setCreateOpen(false); }} onSave={handleSave} />}
      {deleteT && <ConfirmDialog title="Delete Template" message={`Delete "${deleteT.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteT(null)} />}
      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}

function TemplateModal({ template, onClose, onSave }: { template: QuestionTemplate | null; onClose: () => void; onSave: (id: string | null, data: any) => void }) {
  const [name, setName] = useState(template?.name || "");
  const [templateText, setTemplateText] = useState(template?.template_text || "");

  return (
    <Modal title={template ? "Edit Template" : "Add Template"} onClose={onClose} wide>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Template Format (example)</label>
          <textarea className="input-field font-mono text-sm" rows={10} value={templateText} onChange={e => setTemplateText(e.target.value)} placeholder={`1. Question text here

Question translation

a) Answer A
b) Answer B
c) Answer C
d) Answer D

Answer: b

Answer translation

Explanation here`} />
          <p className="text-xs text-slate-400 mt-1">Define the format that questions should follow when using this template for bulk import.</p>
        </div>
        <div className="flex gap-3 justify-end"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={() => onSave(template?.id || null, { name, template_text: templateText, parsing_rules: {}, is_enabled: true })} className="btn-primary">Save</button></div>
      </div>
    </Modal>
  );
}
