import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, ChevronRight, FolderOpen } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Stage, Course, Subject, Folder, Quiz } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, LoadingSpinner, EmptyState } from "./shared";

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
      adminApi.getStages(token),
      adminApi.getCourses(token),
      adminApi.getSubjects(token),
      adminApi.getFolders(token),
      adminApi.getQuizzes(token),
    ])
      .then(([st, co, su, fo, qu]) => {
        setStages(st);
        setCourses(co);
        setSubjects(su);
        setFolders(fo);
        setQuizzes(qu);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(loadAll, [token]);

  const handleSave = async (type: string, id: string | null, data: any) => {
    try {
      if (type === "stage") {
        if (id) await adminApi.updateStage(token, id, data);
        else await adminApi.createStage(token, data);
      } else if (type === "course") {
        if (id) await adminApi.updateCourse(token, id, data);
        else await adminApi.createCourse(token, data);
      } else if (type === "subject") {
        if (id) await adminApi.updateSubject(token, id, data);
        else await adminApi.createSubject(token, data);
      } else if (type === "folder") {
        if (id) await adminApi.updateFolder(token, id, data);
        else await adminApi.createFolder(token, data);
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

  const childCourses = courses.filter((c) => c.stage_id === selStage?.id);
  const childSubjects = subjects.filter((s) => s.course_id === selCourse?.id);
  const childFolders = folders.filter((f) => f.subject_id === selSubject?.id);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div className="card p-3 flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => {
            setSelStage(null);
            setSelCourse(null);
            setSelSubject(null);
          }}
          className="text-teal-600 hover:underline font-medium"
        >
          Stages
        </button>
        {selStage && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => {
                setSelCourse(null);
                setSelSubject(null);
              }}
              className="text-teal-600 hover:underline font-medium"
            >
              {selStage.name}
            </button>
          </>
        )}
        {selCourse && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setSelSubject(null)}
              className="text-teal-600 hover:underline font-medium"
            >
              {selCourse.name}
            </button>
          </>
        )}
        {selSubject && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-700">{selSubject.name}</span>
          </>
        )}
      </div>

      {/* Stage Level */}
      {!selStage && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Stages</h2>
            <button
              onClick={() => setEditItem({ type: "stage", data: null })}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" /> Add Stage
            </button>
          </div>
          {stages.length === 0 ? (
            <EmptyState message="No stages yet. Create your first stage." />
          ) : (
            <div className="space-y-2">
              {stages.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button
                    onClick={() => setSelStage(s)}
                    className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600"
                  >
                    {s.name}
                  </button>
                  <button
                    onClick={() => setEditItem({ type: "stage", data: s })}
                    className="btn-ghost p-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItem({ type: "stage", id: s.id, name: s.name })}
                    className="btn-ghost p-1.5 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
            <button
              onClick={() => setEditItem({ type: "course", data: null })}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
          {childCourses.length === 0 ? (
            <EmptyState message="No courses in this stage yet." />
          ) : (
            <div className="space-y-2">
              {childCourses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button
                    onClick={() => setSelCourse(c)}
                    className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => setEditItem({ type: "course", data: c })}
                    className="btn-ghost p-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItem({ type: "course", id: c.id, name: c.name })}
                    className="btn-ghost p-1.5 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
            <button
              onClick={() => setEditItem({ type: "subject", data: null })}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>
          {childSubjects.length === 0 ? (
            <EmptyState message="No subjects in this course yet." />
          ) : (
            <div className="space-y-2">
              {childSubjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button
                    onClick={() => setSelSubject(s)}
                    className="flex-1 text-left font-medium text-slate-800 hover:text-teal-600"
                  >
                    {s.name}
                  </button>
                  <button
                    onClick={() => setEditItem({ type: "subject", data: s })}
                    className="btn-ghost p-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItem({ type: "subject", id: s.id, name: s.name })}
                    className="btn-ghost p-1.5 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Folders inside Subject */}
      {selSubject && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Folders / Topics in {selSubject.name}</h2>
            <button
              onClick={() => setEditItem({ type: "folder", data: null })}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" /> Add Folder
            </button>
          </div>
          {childFolders.length === 0 ? (
            <p className="text-xs text-slate-400">No additional folders created yet.</p>
          ) : (
            <div className="space-y-2">
              {childFolders.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-teal-600" />
                  <span className="flex-1 font-medium text-slate-700">{f.name}</span>
                  <button
                    onClick={() => setEditItem({ type: "folder", data: f })}
                    className="btn-ghost p-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItem({ type: "folder", id: f.id, name: f.name })}
                    className="btn-ghost p-1.5 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {editItem && (
        <Modal title={`Manage ${editItem.type}`} onClose={() => setEditItem(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                className="input-field"
                defaultValue={editItem.data?.name || ""}
                id="modal_item_name"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditItem(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("modal_item_name") as HTMLInputElement;
                  const name = input?.value.trim();
                  if (!name) return;
                  const payload: any = { name };
                  if (editItem.type === "course") payload.stage_id = selStage?.id;
                  if (editItem.type === "subject") payload.course_id = selCourse?.id;
                  if (editItem.type === "folder") payload.subject_id = selSubject?.id;
                  handleSave(editItem.type, editItem.data?.id || null, payload);
                }}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <ConfirmDialog
          title="Delete Item"
          message={`Are you sure you want to delete "${deleteItem.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white animate-fadeIn`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}