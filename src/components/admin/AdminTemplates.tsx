import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminApi, QuestionTemplate } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, LoadingSpinner, EmptyState } from "./shared";

export function AdminTemplates({ token }: { token: string }) {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editT, setEditT] = useState<QuestionTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteT, setDeleteT] = useState<QuestionTemplate | null>(null);
  const { toast, showToast } = useToast();

  const load = () => {
    adminApi
      .getTemplates(token)
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateTemplate(token, id, data);
      else await adminApi.createTemplate(token, data);
      showToast(id ? "Template updated" : "Template created");
      setEditT(null);
      setCreateOpen(false);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteT) return;
    try {
      await adminApi.deleteTemplate(token, deleteT.id);
      showToast("Template deleted");
      setDeleteT(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">Manage question templates for bulk parsing.</p>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState message="No question templates created yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-100">{t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setEditT(t)} className="btn-ghost p-1">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteT(t)} className="btn-ghost p-1 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="mt-3 p-3 bg-slate-950 rounded text-xs font-mono text-slate-400 max-h-36 overflow-y-auto">
                {t.template_text || "No format specified."}
              </pre>
            </div>
          ))}
        </div>
      )}

      {(editT || createOpen) && (
        <Modal title={editT ? "Edit Template" : "Add Template"} onClose={() => { setEditT(null); setCreateOpen(false); }}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Template Name</label>
              <input className="input-field" defaultValue={editT?.name || ""} id="tmpl_name" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Format Sample</label>
              <textarea className="input-field font-mono text-xs" rows={6} defaultValue={editT?.template_text || ""} id="tmpl_text" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setEditT(null); setCreateOpen(false); }} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById("tmpl_name") as HTMLInputElement)?.value;
                  const template_text = (document.getElementById("tmpl_text") as HTMLTextAreaElement)?.value;
                  if (!name) return;
                  handleSave(editT?.id || null, { name, template_text });
                }}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteT && (
        <ConfirmDialog
          title="Delete Template"
          message={`Delete "${deleteT.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteT(null)}
        />
      )}
    </div>
  );
}