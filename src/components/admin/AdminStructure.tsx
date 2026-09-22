import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, ChevronRight, FolderOpen, ArrowLeft } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Stage, Course, Subject, Folder, Quiz } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, Toggle, LoadingSpinner, EmptyState } from "./shared";

export function AdminStructure({ token }: { token: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  const [selStage, setSelStage] = useState<Stage | null>(null);
  const [selCourse, setSelCourse] = useState<Course | null>(null);
  const [selSubject, setSelSubject] = useState<Subject | null>(null);

  const [editItem, setEditItem] = useState<{ type: string; data: any } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null);

  const loadAll = () => {
    Promise.all([
      adminApi.getStages(token), adminApi.getCourses(token), adminApi.getSubjects(token),
      adminApi.getFolders(token), adminApi.getQuizzes(token)
    ]).then(([st, co, su, fo, qu]) => {
      setStages(st); setCourses(co); setSubjects(su); setFolders(fo); setQuizzes(qu); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadAll, [token]);

  const handleSave = async (type: string, id: string | null, data: any) => {
    try {
      if (type === "stage") {
        if (id) await adminApi.updateStage(token, id, data); else await adminApi.createStage(token, data);
      } else if (type === "course") {
        if (id) await adminApi.updateCourse(token, id, data); else await adminApi.createCourse(token, data);
      } else if (type === "subject") {
        if (id) await adminApi.updateSubject(token, id, data); else await adminApi.createSubject(token, data);
      } else if (type === "folder") {
        if (id) await adminApi.updateFolder(token, id, data); else await adminApi.createFolder(token, data);
      }
      showToast(id ? "Updated successfully" : "Created successfully");
      setEditItem(null);
      loadAll();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === "stage") await adminApi.deleteStage(token, deleteItem.id);
      else if (deleteItem.type === "course") await adminApi.deleteCourse(token, deleteItem.id);
      else if (deleteItem.type === "subject") await adminApi.deleteSubject(token, deleteItem.id);
      else if (deleteItem.type === "folder") await adminApi.deleteFolder(token, deleteItem.id);
      showToast("Deleted successfully");
      setDeleteItem(null);
      loadAll();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  const childCourses = courses.filter(c => c.stage_id === selStage?.id);
  const childSubjects = subjects.filter(s => s.course_id === selCourse?.id);
  const childFolders = folders.filter(f => f.subject_id === selSubject?.id);
  const subjectQuizzes = quizzes.filter(q => q.subject_id === selSubject?.id && !q.folder_id);
  const folderQuizzes = (fid: string) => quizzes.filter(q => q.folder_id === fid);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="card p-3 flex items-center gap-2 text-sm flex-wrap">
        <button onClick={() => { setSelStage(null); setSelCourse(null); setSelSubject(null); }} className="text-teal-600 hover:underline font-medium">Stages</button>
        {selStage && <><ChevronRight className="w-4 h-4 text-slate-400" /><button onClick={() => { setSelCourse(null); setSelSubject(null); }} className="text-teal-600 hover:underline font-medium">{selStage.name}</button></>}
        {selCourse && <><ChevronRight className="w-4 h-4 text-slate-400" /><button onClick={() => setSelSubject(null)} className="text-teal-600 hover:underline font-medium">{selCourse.name}</button></>}
        {selSubject && <><ChevronRight className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-700">{selSubject.name}</span></>}
      </div>

      {/* Stage Level */}
      {!selStage && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Stages</h2>
            <button onClick={() => setEditItem({ type: "stage", data: null })} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Stage</button>
          </div>
          {stages.length === 0 ? <EmptyState message="No stages yet. Create your first stage." /> : (
            <div className="space-y-2">
              {stages.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button onClick={() => setSelStage(s)} className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600">{s.name}</button>
                  <span className="badge bg-slate-200 text-slate-600">{childCourses.length} courses</span>
                  {!s.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  {!s.is_visible && <span className="badge bg-amber-100 text-amber-700">Hidden</span>}
                  <button onClick={() => setEditItem({ type: "stage", data: s })} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteItem({ type: "stage", id: s.id, name: s.name })} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Course Level */}
      {selStage && !selCourse && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Courses in {selStage.name}</h2>
            <button onClick={() => setEditItem({ type: "course", data: null })} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Course</button>
          </div>
          {childCourses.length === 0 ? <EmptyState message="No courses yet." /> : (
            <div className="space-y-2">
              {childCourses.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button onClick={() => setSelCourse(c)} className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600">{c.name}</button>
                  {!c.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  {!c.is_visible && <span className="badge bg-amber-100 text-amber-700">Hidden</span>}
                  <button onClick={() => setEditItem({ type: "course", data: c })} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteItem({ type: "course", id: c.id, name: c.name })} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subject Level */}
      {selCourse && !selSubject && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Subjects in {selCourse.name}</h2>
            <button onClick={() => setEditItem({ type: "subject", data: null })} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Subject</button>
          </div>
          {childSubjects.length === 0 ? <EmptyState message="No subjects yet." /> : (
            <div className="space-y-2">
              {childSubjects.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button onClick={() => setSelSubject(s)} className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600">{s.name}</button>
                  {!s.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  {!s.is_visible && <span className="badge bg-amber-100 text-amber-700">Hidden</span>}
                  <button onClick={() => setEditItem({ type: "subject", data: s })} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteItem({ type: "subject", id: s.id, name: s.name })} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subject detail: folders + quizzes */}
      {selSubject && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Folders in {selSubject.name}</h2>
              <button onClick={() => setEditItem({ type: "folder", data: null })} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="w-4 h-4" /> Add Folder</button>
            </div>
            {childFolders.length === 0 ? <EmptyState message="No folders yet." /> : (
              <div className="space-y-2">
                {childFolders.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span className="flex-1 font-medium text-slate-800">{f.name}</span>
                    <span className="badge bg-slate-200 text-slate-600">{folderQuizzes(f.id).length} quizzes</span>
                    {!f.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                    <button onClick={() => setEditItem({ type: "folder", data: f })} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteItem({ type: "folder", id: f.id, name: f.name })} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-3">Direct Quizzes in {selSubject.name}</h2>
            {subjectQuizzes.length === 0 ? <EmptyState message="No quizzes directly in this subject." /> : (
              <div className="space-y-2">
                {subjectQuizzes.map(q => (
                  <div key={q.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="flex-1 font-medium text-slate-800">{q.name}</span>
                    <span className="badge bg-slate-200 text-slate-600">{q.max_points} pts</span>
                    {!q.is_enabled && <span className="badge bg-red-100 text-red-600">Disabled</span>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3">Manage quiz details and questions from the Quizzes and Questions sections.</p>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editItem && (
        <StructureEditModal
          type={editItem.type}
          data={editItem.data}
          parentId={selStage?.id || selCourse?.id || selSubject?.id || null}
          parentType={selSubject ? "subject" : selCourse ? "course" : selStage ? "stage" : null}
          onClose={() => setEditItem(null)}
          onSave={(id, data) => handleSave(editItem.type, id, data)}
        />
      )}

      {/* Delete Confirm */}
      {deleteItem && (
        <ConfirmDialog
          title={`Delete ${deleteItem.type}`}
          message={`Are you sure you want to delete "${deleteItem.name}"? This will also delete all nested content.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}

function StructureEditModal({ type, data, parentId, parentType, onClose, onSave }: {
  type: string; data: any; parentId: string | null; parentType: string | null;
  onClose: () => void; onSave: (id: string | null, data: any) => void;
}) {
  const [name, setName] = useState(data?.name || "");
  const [description, setDescription] = useState(data?.description || "");
  const [iconUrl, setIconUrl] = useState(data?.icon_url || "");
  const [sortOrder, setSortOrder] = useState(data?.sort_order ?? 0);
  const [isEnabled, setIsEnabled] = useState(data?.is_enabled ?? true);
  const [isVisible, setIsVisible] = useState(data?.is_visible ?? true);

  const handleSave = () => {
    if (!name.trim()) return;
    const payload: any = { name, description, icon_url: iconUrl, sort_order: sortOrder, is_enabled: isEnabled, is_visible: isVisible };
    if (!data) {
      if (parentType === "stage") payload.stage_id = parentId;
      else if (parentType === "course") payload.course_id = parentId;
      else if (parentType === "subject") payload.subject_id = parentId;
    }
    onSave(data?.id || null, payload);
  };

  return (
    <Modal title={`${data ? "Edit" : "Add"} ${type.charAt(0).toUpperCase() + type.slice(1)}`} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea className="input-field" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Icon URL (optional)</label><input className="input-field" value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" className="input-field" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} /></div>
        <div className="flex gap-6"><Toggle checked={isEnabled} onChange={setIsEnabled} label="Enabled" /><Toggle checked={isVisible} onChange={setIsVisible} label="Visible" /></div>
        <div className="flex gap-3 justify-end pt-2"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} className="btn-primary">Save</button></div>
      </div>
    </Modal>
  );
}
