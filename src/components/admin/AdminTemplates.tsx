import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Wand2, FileCode, CheckCircle2, HelpCircle } from "lucide-react";
import { adminApi, QuestionTemplate } from "@/lib/api";
import { Modal, ConfirmDialog, useToast, LoadingSpinner, EmptyState } from "./shared";

// تعريف أنواع الحقول المتاحة لكل سطر
export const LINE_ROLES: { value: string; label: string; color: string }[] = [
  { value: "question_text", label: "نص السؤال (Question Text)", color: "text-teal-400 bg-teal-950/60" },
  { value: "question_translation", label: "ترجمة السؤال (Translation)", color: "text-blue-400 bg-blue-950/60" },
  { value: "answer_a", label: "الخيار A (Option A)", color: "text-amber-400 bg-amber-950/60" },
  { value: "answer_b", label: "الخيار B (Option B)", color: "text-amber-400 bg-amber-950/60" },
  { value: "answer_c", label: "الخيار C (Option C)", color: "text-amber-400 bg-amber-950/60" },
  { value: "answer_d", label: "الخيار D (Option D)", color: "text-amber-400 bg-amber-950/60" },
  { value: "correct_answer", label: "رمز الإجابة الصحيحة (A/B/C/D)", color: "text-green-400 bg-green-950/60" },
  { value: "correct_answer_translation", label: "ترجمة الحل الصحيح", color: "text-cyan-400 bg-cyan-950/60" },
  { value: "explanation", label: "الشرح والتوضيح (Explanation)", color: "text-purple-400 bg-purple-950/60" },
  { value: "ignore", label: "تجاهل هذا السطر (Ignore)", color: "text-slate-400 bg-slate-800" },
];

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
        setTemplates(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (id: string | null, data: any) => {
    try {
      if (id) await adminApi.updateTemplate(token, id, data);
      else await adminApi.createTemplate(token, data);
      showToast(id ? "تم تحديث النموذج بنجاح" : "تم إنشاء النموذج بنجاح");
      setEditT(null);
      setCreateOpen(false);
      load();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteT) return;
    try {
      await adminApi.deleteTemplate(token, deleteT.id);
      showToast("تم حذف النموذج");
      setDeleteT(null);
      load();
    } catch (err: any) {
      showToast(err.message || "فشل حذف النموذج", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-teal-400" /> نماذج الأسئلة (Question Templates)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            قم بتعريف ترتيب الأسطر لسؤال تجريبي، وسيقوم النظام بتطبيقه تلقائياً عند استيراد كميات كبيرة من الأسئلة.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus className="w-4 h-4" /> إنشاء نموذج جديد
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState message="لم يتم إنشاء أي نماذج حتى الآن. أنشئ نموذجك الأول لتبسيط استيراد الأسئلة." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const rules = (t.parsing_rules as any) || {};
            const lineMapping: string[] = rules.line_mapping || [];
            return (
              <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{t.name}</h3>
                    <p className="text-xs text-teal-400 mt-0.5">يتكون من {lineMapping.length} أسطر لكل سؤال</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditT(t)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                      title="تعديل النموذج"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteT(t)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      title="حذف النموذج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* استعراض الأدوار المحددة لكل سطر */}
                <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">ترتيب الأسطر في هذا النموذج:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lineMapping.map((role, idx) => {
                      const item = LINE_ROLES.find((r) => r.value === role);
                      return (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border border-slate-700/50 font-mono ${item?.color || "text-slate-300"}`}>
                          سطر {idx + 1}: {item?.label.split("(")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {t.template_text && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-300 select-none">عرض نص السؤال النموذجي</summary>
                    <pre className="mt-2 p-2.5 bg-slate-900 rounded font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {t.template_text}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(editT || createOpen) && (
        <TemplateBuilderModal
          template={editT}
          onClose={() => {
            setEditT(null);
            setCreateOpen(false);
          }}
          onSave={handleSave}
        />
      )}

      {deleteT && (
        <ConfirmDialog
          title="حذف النموذج"
          message={`هل أنت متأكد من حذف النموذج "${deleteT.name}"؟`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteT(null)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function TemplateBuilderModal({
  template,
  onClose,
  onSave,
}: {
  template: QuestionTemplate | null;
  onClose: () => void;
  onSave: (id: string | null, data: any) => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [sampleText, setSampleText] = useState(
    template?.template_text ||
      `1. What is the normal resting heart rate for an adult?
ما هو معدل ضربات القلب الطبيعي أثناء الراحة للبالغين؟
a) 40 - 60 bpm
b) 60 - 100 bpm
c) 100 - 120 bpm
d) 120 - 140 bpm
Answer: b
الإجابة: 60 - 100 نبضة بالدقيقة
Explanation: Normal resting heart rate for adults ranges from 60 to 100 beats per minute.`
  );

  const [lines, setLines] = useState<string[]>([]);
  const [lineMapping, setLineMapping] = useState<string[]>(
    ((template?.parsing_rules as any)?.line_mapping as string[]) || []
  );

  // تقسيم النص إلى أسطر
  useEffect(() => {
    const rawLines = sampleText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    setLines(rawLines);

    // إذا لم يكن هناك خريطة محفوظة سابقة، نقوم بالاكتشاف التلقائي الأولي
    if (lineMapping.length === 0 || lineMapping.length !== rawLines.length) {
      autoGuessMapping(rawLines);
    }
  }, [sampleText]);

  // دالة الذكاء الاصطناعي لاكتشاف معنى كل سطر تلقائياً
  const autoGuessMapping = (inputLines: string[]) => {
    const guessed: string[] = [];
    let optionCount = 0;

    inputLines.forEach((line, idx) => {
      const lower = line.toLowerCase();

      // سطر السؤال الأول
      if (idx === 0) {
        guessed.push("question_text");
        return;
      }

      // ترجمة السؤال (إذا كانت بعد السؤال وقبل الخيارات)
      if (idx === 1 && !/^[a-d\d][\.\)]/i.test(line) && !lower.startsWith("answer")) {
        guessed.push("question_translation");
        return;
      }

      // الخيارات
      if (/^[aAأ١][\.\)\-\s]/i.test(line) || (optionCount === 0 && (lower.startsWith("a)") || lower.startsWith("a.")))) {
        guessed.push("answer_a");
        optionCount++;
        return;
      }
      if (/^[bBب٢][\.\)\-\s]/i.test(line) || (optionCount === 1 && (lower.startsWith("b)") || lower.startsWith("b.")))) {
        guessed.push("answer_b");
        optionCount++;
        return;
      }
      if (/^[cCج٣][\.\)\-\s]/i.test(line) || (optionCount === 2 && (lower.startsWith("c)") || lower.startsWith("c.")))) {
        guessed.push("answer_c");
        optionCount++;
        return;
      }
      if (/^[dDد٤][\.\)\-\s]/i.test(line) || (optionCount === 3 && (lower.startsWith("d)") || lower.startsWith("d.")))) {
        guessed.push("answer_d");
        optionCount++;
        return;
      }

      // الإجابة الصحيحة
      if (lower.startsWith("ans") || lower.startsWith("correct") || lower.startsWith("إجابة") || lower.startsWith("الجواب")) {
        guessed.push("correct_answer");
        return;
      }

      // ترجمة الإجابة الصحيحة
      if (lower.includes("translation") || lower.startsWith("ترجمة") || lower.includes("حل")) {
        guessed.push("correct_answer_translation");
        return;
      }

      // الشرح والتوضيح
      if (lower.startsWith("exp") || lower.startsWith("شرح") || lower.startsWith("توضيح")) {
        guessed.push("explanation");
        return;
      }

      // الحالة الافتراضية
      if (optionCount < 4) {
        guessed.push("question_text");
      } else {
        guessed.push("explanation");
      }
    });

    setLineMapping(guessed);
  };

  const handleRoleChange = (index: number, newRole: string) => {
    const updated = [...lineMapping];
    updated[index] = newRole;
    setLineMapping(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(template?.id || null, {
      name: name.trim(),
      template_text: sampleText,
      parsing_rules: {
        line_mapping: lineMapping,
        total_lines: lines.length,
      },
      is_enabled: true,
    });
  };

  return (
    <Modal title={template ? "تعديل النموذج" : "إنشاء نموذج أسئلة جديد"} onClose={onClose} wide>
      <form onSubmit={handleFormSubmit} className="space-y-5 text-right">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1">اسم النموذج</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: نموذج أسئلة مع ترجمة وشرح (9 أسطر)"
            required
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">الصق هنا سؤالاً واحداً فقط كمثال لاختبار ترتيب الأسطر:</span>
            <button
              type="button"
              onClick={() => autoGuessMapping(lines)}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              <Wand2 className="w-3.5 h-3.5" /> إعادة الاكتشاف التلقائي للأدوار
            </button>
          </div>
          <textarea
            className="input-field font-mono text-xs leading-relaxed"
            rows={6}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="الصق نموذج السؤال هنا..."
          />
        </div>

        {/* جدول تحديد معنى كل سطر */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> حدد معنى كل سطر من أسطر السؤال:
            </h4>
            <span className="text-xs text-slate-400 font-mono">إجمالي: {lines.length} أسطر</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-xs font-mono font-bold text-teal-400 w-16 shrink-0">سطر {idx + 1}:</span>
                <p className="text-xs text-slate-300 font-mono truncate flex-1" title={line}>
                  {line}
                </p>
                <select
                  value={lineMapping[idx] || "ignore"}
                  onChange={(e) => handleRoleChange(idx, e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-500 shrink-0"
                >
                  {LINE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            حفظ النموذج
          </button>
        </div>
      </form>
    </Modal>
  );
}