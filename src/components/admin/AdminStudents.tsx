import { useState, useEffect } from "react";
import { Search, Eye, ArrowLeft, Trash2, Edit2, Plus, Award, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner, EmptyState, Modal, ConfirmDialog, useToast } from "./shared";

export function AdminStudents({
  token,
  onViewStudent,
}: {
  token: string;
  onViewStudent: (id: string) => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<any | null>(null);

  const fetchStudents = async () => {
    try {
      let q = supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (search.trim()) {
        q = q.ilike("display_name", `%${search.trim()}%`);
      }

      const { data, error } = await q;
      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token, search]);

  const handleUpdateStudent = async (updatedData: any) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          display_name: updatedData.display_name,
          total_points: Number(updatedData.total_points) || 0,
          total_completed_quizzes: Number(updatedData.total_completed_quizzes) || 0,
        })
        .eq("id", editStudent.id);

      if (error) throw error;

      showToast("تم تحديث بيانات الطالب بنجاح");
      setEditStudent(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "فشل التحديث", "error");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", deleteStudent.id);

      if (error) throw error;

      showToast("تم حذف الطالب بنجاح");
      setDeleteStudent(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m}m ${seconds % 60}s`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="البحث باسم الطالب أو المعرف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          لم يتم العثور على أي طلاب.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">اسم الطالب</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">معرف الطالب</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">النقاط</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">الاختبارات المكتملة</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">الوقت المستغرق</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-medium text-slate-200">{st.display_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{st.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-400">{st.total_points}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{st.total_completed_quizzes}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{formatTime(st.total_time_spent_seconds || 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewStudent(st.id)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400 transition-colors"
                        title="عرض الملف والجوائز"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditStudent(st)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                        title="تعديل النقاط والاسم"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteStudent(st)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة تعديل بيانات الطالب */}
      {editStudent && (
        <Modal title="تعديل بيانات الطالب والنقاط" onClose={() => setEditStudent(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              handleUpdateStudent({
                display_name: form.display_name.value,
                total_points: form.total_points.value,
                total_completed_quizzes: form.total_completed_quizzes.value,
              });
            }}
            className="space-y-4 text-right"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">اسم الطالب</label>
              <input
                name="display_name"
                defaultValue={editStudent.display_name}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">إجمالي النقاط (Points)</label>
              <input
                type="number"
                step="any"
                name="total_points"
                defaultValue={editStudent.total_points}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">الاختبارات المكتملة</label>
              <input
                type="number"
                name="total_completed_quizzes"
                defaultValue={editStudent.total_completed_quizzes}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                حفظ التعديلات
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* نافذة تأكيد حذف الطالب */}
      {deleteStudent && (
        <ConfirmDialog
          title="حذف الطالب نهائياً"
          message={`هل أنت متأكد من رغبتك في حذف حساب "${deleteStudent.display_name}"؟ سيتم حذف جميع محاولاته ونقاطه ولا يمكن استرجاعها.`}
          onConfirm={handleDeleteStudent}
          onCancel={() => setDeleteStudent(null)}
        />
      )}

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

export function AdminStudentDetail({
  token,
  studentId,
  onBack,
}: {
  token: string;
  studentId: string;
  onBack: () => void;
}) {
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [nameChanges, setNameChanges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAchOpen, setAddAchOpen] = useState(false);
  const [selectedAchId, setSelectedAchId] = useState("");
  const { toast, showToast } = useToast();

  const loadDetail = async () => {
    try {
      const [stRes, attRes, ncRes, saRes, allAchRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", studentId).single(),
        supabase.from("quiz_attempts").select("*, quizzes(name)").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("name_change_history").select("*").eq("student_id", studentId).order("changed_at", { ascending: false }),
        supabase.from("student_achievements").select("id, achievement_id, awarded_at, achievements(*)").eq("student_id", studentId),
        supabase.from("achievements").select("*").eq("is_enabled", true),
      ]);

      if (stRes.data) setStudent(stRes.data);
      if (attRes.data) setAttempts(attRes.data || []);
      if (ncRes.data) setNameChanges(ncRes.data || []);
      if (saRes.data) setAchievements(saRes.data || []);
      if (allAchRes.data) setAvailableAchievements(allAchRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [studentId]);

  // إضافة جائزة أو وسام للطالب يدوياً
  const handleAwardAchievement = async () => {
    if (!selectedAchId) return;
    try {
      const { error } = await supabase.from("student_achievements").insert({
        student_id: studentId,
        achievement_id: selectedAchId,
      });

      if (error) throw error;

      showToast("تم منح الجائزة للطالب");
      setAddAchOpen(false);
      setSelectedAchId("");
      loadDetail();
    } catch (err: any) {
      showToast(err.message || "هذا الوسام ممنوح مسبقاً لهذا الطالب", "error");
    }
  };

  // سحب / حذف جائزة أو وسام من الطالب
  const handleRemoveAchievement = async (studentAchId: string) => {
    try {
      const { error } = await supabase
        .from("student_achievements")
        .delete()
        .eq("id", studentAchId);

      if (error) throw error;

      showToast("تم سحب الوسام من الطالب");
      loadDetail();
    } catch (err: any) {
      showToast(err.message || "فشل سحب الوسام", "error");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!student) return <EmptyState message="Student details not found." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /> العودة لقائمة الطلاب
      </button>

      {/* بطاقة معلومات الطالب */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">{student.display_name}</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">ID: {student.id}</p>
            <p className="text-xs text-slate-400 mt-1">تاريخ التسجيل: {new Date(student.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-400">{student.total_points}</span>
            <span className="block text-xs text-slate-500">إجمالي النقاط</span>
          </div>
        </div>
      </div>

      {/* قسم إدارة الجوائز والأوسمة */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> الجوائز والأوسمة الممنوحة ({achievements.length})
          </h3>
          <button
            onClick={() => setAddAchOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> منح وسام جديد
          </button>
        </div>

        {achievements.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">لا يمتلك الطالب أي أوسمة أو جوائز حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((sa) => (
              <div key={sa.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${sa.achievements?.achievement_type === "badge" ? "bg-amber-950/60 text-amber-400" : "bg-teal-950/60 text-teal-400"}`}>
                    {sa.achievements?.achievement_type === "badge" ? <Award className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 text-sm">{sa.achievements?.name}</p>
                    <p className="text-xs text-slate-500">{sa.achievements?.achievement_type === "badge" ? "وسام (Badge)" : "كأس (Trophy)"}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAchievement(sa.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5"
                  title="سحب هذه الجائزة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* سجل تغيير الأسماء */}
      {nameChanges.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-200 mb-3 text-sm">سجل تغيير الاسم</h3>
          <div className="space-y-2">
            {nameChanges.map((nc) => (
              <div key={nc.id} className="text-sm border-b border-slate-800/60 pb-2 flex justify-between">
                <span>
                  <span className="line-through text-slate-500">{nc.previous_name}</span> &rarr;{" "}
                  <strong className="text-teal-400">{nc.new_name}</strong>
                </span>
                <span className="text-xs text-slate-500">{new Date(nc.changed_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* محاولات الاختبارات */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-slate-200 mb-4 text-sm">محاولات الاختبارات</h3>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد أي محاولات سابقة.</p>
        ) : (
          <div className="space-y-2">
            {attempts.map((att) => (
              <div key={att.id} className="p-3 bg-slate-900 rounded-lg flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-200">{att.quizzes?.name || "Quiz"}</p>
                  <span className="text-xs text-slate-500">{new Date(att.created_at).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-200">{att.percentage}%</span>
                  <span className="block text-xs text-slate-400">{att.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة منح وسام يدوي */}
      {addAchOpen && (
        <Modal title="منح وسام أو جائزة للطالب" onClose={() => setAddAchOpen(false)}>
          <div className="space-y-4 text-right">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">اختر الوسام / الجائزة</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500"
                value={selectedAchId}
                onChange={(e) => setSelectedAchId(e.target.value)}
              >
                <option value="">-- اختر من القائمة --</option>
                {availableAchievements.map((ach) => (
                  <option key={ach.id} value={ach.id}>
                    {ach.name} ({ach.achievement_type})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setAddAchOpen(false)} className="btn-secondary">
                إلغاء
              </button>
              <button onClick={handleAwardAchievement} disabled={!selectedAchId} className="btn-primary">
                منح الجائزة
              </button>
            </div>
          </div>
        </Modal>
      )}

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