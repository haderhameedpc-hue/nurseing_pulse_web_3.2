import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Layers, Sparkles, HelpCircle } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Quiz, QuestionTemplate } from "@/lib/api";
import { useToast, LoadingSpinner, EmptyState } from "./shared";
import { LINE_ROLES } from "./AdminTemplates";

interface ParsedQuestion {
  question_text: string;
  question_translation: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  correct_answer_translation: string;
  explanation: string;
  errors: string[];
}

export function AdminBulkImport({ token }: { token: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const { toast, showToast } = useToast();
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getQuizzes(token), adminApi.getTemplates(token)])
      .then(([qz, ts]) => {
        setQuizzes(qz || []);
        setTemplates(ts || []);
        if (ts && ts.length > 0) {
          setSelectedTemplateId(ts[0].id); // اختيار أول نموذج تلقائياً
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // دالة تنظيف الرموز السابقة (مثل "1.", "a)", "Answer: " الخ)
  const cleanLineValue = (val: string, role: string): string => {
    let text = val.trim();
    if (role === "question_text") {
      text = text.replace(/^(\d+[\.\)\-:]|Q\d+[:\.\)])\s*/i, "");
    } else if (role.startsWith("answer_")) {
      text = text.replace(/^[a-dأ-د١-٤][\.\)\-:]\s*/i, "");
    } else if (role === "correct_answer") {
      text = text.replace(/^(Answer|Correct|إجابة|الجواب|الحل)[:\s\-\.]*/i, "").trim();
      // تحويل الأحرف أو الأرقام العربية إلى أحرف إنجليزية قياسية
      const letter = text.charAt(0).toLowerCase();
      if (letter === "أ" || letter === "ا" || letter === "1" || letter === "١") return "a";
      if (letter === "ب" || letter === "2" || letter === "٢") return "b";
      if (letter === "ج" || letter === "3" || letter === "٣") return "c";
      if (letter === "د" || letter === "4" || letter === "٤") return "d";
      if (["a", "b", "c", "d"].includes(letter)) return letter;
    } else if (role === "explanation") {
      text = text.replace(/^(Explanation|الشرح|التوضيح)[:\s\-\.]*/i, "");
    } else if (role === "correct_answer_translation") {
      text = text.replace(/^(Translation|ترجمة|ترجمة الحل)[:\s\-\.]*/i, "");
    }
    return text.trim();
  };

  // معالجة وتحليل النص بناءً على النموذج المحدد
  const handleParse = () => {
    if (!rawText.trim()) {
      showToast("يرجى لصق نص الأسئلة أولاً", "error");
      return;
    }

    // تقسيم النص إلى كتل أسئلة مفصولة بأسطر فارغة
    const blocks = rawText
      .trim()
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const chosenTemplate = templates.find((t) => t.id === selectedTemplateId);
    const lineMapping: string[] = (chosenTemplate?.parsing_rules as any)?.line_mapping || [];

    const parsedResults: ParsedQuestion[] = blocks.map((block, blockIndex) => {
      const blockLines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const q: ParsedQuestion = {
        question_text: "",
        question_translation: "",
        answer_a: "",
        answer_b: "",
        answer_c: "",
        answer_d: "",
        correct_answer: "a",
        correct_answer_translation: "",
        explanation: "",
        errors: [],
      };

      // إذا كان هناك نموذج محدد، نمشي سطر بسطر حسب المخطط
      if (chosenTemplate && lineMapping.length > 0) {
        blockLines.forEach((line, lineIdx) => {
          const role = lineMapping[lineIdx];
          if (!role || role === "ignore") return;

          const cleaned = cleanLineValue(line, role);

          if (role === "question_text") q.question_text = cleaned;
          else if (role === "question_translation") q.question_translation = cleaned;
          else if (role === "answer_a") q.answer_a = cleaned;
          else if (role === "answer_b") q.answer_b = cleaned;
          else if (role === "answer_c") q.answer_c = cleaned;
          else if (role === "answer_d") q.answer_d = cleaned;
          else if (role === "correct_answer") {
            const letter = cleanLineValue(line, "correct_answer");
            if (["a", "b", "c", "d"].includes(letter)) {
              q.correct_answer = letter as any;
            } else {
              q.errors.push(`الإجابة الصحيحة غير واضحة (القيمة: "${line}")`);
            }
          } else if (role === "correct_answer_translation") q.correct_answer_translation = cleaned;
          else if (role === "explanation") q.explanation = cleaned;
        });

        if (blockLines.length !== lineMapping.length) {
          q.errors.push(`عدد أسطر هذا السؤال (${blockLines.length}) لا يطابق النموذج المحدد (${lineMapping.length} أسطر)`);
        }
      } else {
        // إذا لم يختر نموذجاً: تحليل تلقائي مرن
        blockLines.forEach((line) => {
          const lower = line.toLowerCase();
          if (/^answer:?\s*([a-dأ-د])/i.test(line)) {
            const m = line.match(/^answer:?\s*([a-dأ-د])/i);
            const letter = m ? m[1].toLowerCase() : "a";
            q.correct_answer = letter === "أ" ? "a" : letter === "ب" ? "b" : letter === "ج" ? "c" : letter === "د" ? "d" : (letter as any);
          } else if (/^[aAأ][\.\)]\s*(.+)/.test(line)) {
            q.answer_a = line.replace(/^[aAأ][\.\)]\s*/, "");
          } else if (/^[bBب][\.\)]\s*(.+)/.test(line)) {
            q.answer_b = line.replace(/^[bBب][\.\)]\s*/, "");
          } else if (/^[cCج][\.\)]\s*(.+)/.test(line)) {
            q.answer_c = line.replace(/^[cCج][\.\)]\s*/, "");
          } else if (/^[dDد][\.\)]\s*(.+)/.test(line)) {
            q.answer_d = line.replace(/^[dDد][\.\)]\s*/, "");
          } else if (lower.startsWith("explanation:") || lower.startsWith("شرح:")) {
            q.explanation = line.replace(/^(explanation|شرح):?\s*/i, "");
          } else if (!q.question_text) {
            q.question_text = line.replace(/^\d+[\.\)]\s*/, "");
          } else if (!q.question_translation) {
            q.question_translation = line;
          }
        });
      }

      // فحص الأخطاء والحقول الإلزامية
      if (!q.question_text) q.errors.push("نص السؤال مفقود");
      if (!q.answer_a) q.errors.push("الخيار A مفقود");
      if (!q.answer_b) q.errors.push("الخيار B مفقود");
      if (!q.answer_c) q.errors.push("الخيار C مفقود");
      if (!q.answer_d) q.errors.push("الخيار D مفقود");

      return q;
    });

    setParsed(parsedResults);
    const validCount = parsedResults.filter((p) => p.errors.length === 0).length;
    showToast(`تم التعرف على ${parsedResults.length} سؤال (${validCount} جاهز للاستيراد)`);
  };

  // استيراد الأسئلة الصالحة دفعة واحدة
  const handleImport = async () => {
    if (!selectedQuiz) {
      showToast("يرجى اختيار الاختبار الهدف أولاً", "error");
      return;
    }

    const validQuestions = parsed.filter((p) => p.errors.length === 0);
    if (validQuestions.length === 0) {
      showToast("لا توجد أسئلة صالحة للاستيراد", "error");
      return;
    }

    setImporting(true);
    try {
      const payload = validQuestions.map((q, idx) => ({
        quiz_id: selectedQuiz,
        question_text: q.question_text,
        question_translation: q.question_translation || "",
        answer_a: q.answer_a,
        answer_b: q.answer_b,
        answer_c: q.answer_c,
        answer_d: q.answer_d,
        correct_answer: q.correct_answer,
        correct_answer_translation: q.correct_answer_translation || "",
        explanation: q.explanation || "",
        sort_order: idx + 1,
        is_enabled: true,
        is_visible: true,
      }));

      await adminApi.bulkImportQuestions(token, payload);
      showToast(`تم استيراد ${validQuestions.length} سؤال بنجاح!`);
      setParsed([]);
      setRawText("");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء الاستيراد", "error");
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const validCount = parsed.filter((p) => p.errors.length === 0).length;
  const invalidCount = parsed.length - validCount;
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 animate-fadeIn text-right">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-teal-400" /> الاستيراد السريع للأسئلة (Bulk Import)
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          اختر الاختبار والنموذج الذي يناسب تنسيق أسئلتك، ثم الصق النص ليقوم النظام بفرز الخيارات والأجوبة آلياً وإضافتها بنقرة زر.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">1. الاختبار المستهدف (Target Quiz)</label>
            <select
              className="input-field"
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
            >
              <option value="">-- اختر الاختبار لتخزين الأسئلة فيه --</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">2. نموذج التنسيق (Question Template)</label>
            <select
              className="input-field"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">التعرف التلقائي الذكي (بدون نموذج)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({(t.parsing_rules as any)?.line_mapping?.length || 0} أسطر)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ملخص هيكل النموذج المختار */}
        {currentTemplate && (
          <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Sparkles className="w-4 h-4" /> النموذج يحدد {((currentTemplate.parsing_rules as any)?.line_mapping || []).length} أسطر لكل سؤال
            </span>
            <span>افصل بين كل سؤال والذي يليه بسطر فارغ واحد</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">3. الصق مجموعة الأسئلة هنا</label>
          <textarea
            className="input-field font-mono text-xs leading-relaxed text-left"
            dir="ltr"
            rows={12}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="الصق كل الأسئلة هنا مع ترك سطر فارغ بين كل سؤال والآخر..."
          />
        </div>

        <button onClick={handleParse} className="btn-secondary flex items-center gap-2 text-sm font-semibold">
          <FileText className="w-4 h-4" /> تحليل ومعاينة الأسئلة
        </button>
      </div>

      {/* نتائج التحليل والمعاينة */}
      {parsed.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-base">معاينة الأسئلة المستخرجة ({parsed.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">تأكد من صحة الحقول قبل الإضافة النهائية</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-green-400 flex items-center gap-1 bg-green-950/60 px-2.5 py-1 rounded-full border border-green-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} سؤال جاهز
              </span>
              {invalidCount > 0 && (
                <span className="text-red-400 flex items-center gap-1 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/60">
                  <AlertCircle className="w-3.5 h-3.5" /> {invalidCount} به ملاحظات
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {parsed.map((q, idx) => {
              const hasErrors = q.errors.length > 0;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-sm transition-colors ${
                    hasErrors ? "border-red-900/60 bg-red-950/20" : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-teal-400 font-mono text-xs block mb-1">السؤال #{idx + 1}</span>
                      <p className="font-semibold text-slate-100">{q.question_text || "(بدون نص)"}</p>
                      {q.question_translation && (
                        <p className="text-xs text-blue-400 mt-1">{q.question_translation}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-300 font-mono text-xs shrink-0">
                      الإجابة: {q.correct_answer.toUpperCase()}
                    </span>
                  </div>

                  {/* الخيارات */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                    <span className={`p-1.5 rounded bg-slate-950 font-mono ${q.correct_answer === "a" ? "text-green-400 font-bold" : "text-slate-300"}`}>
                      A: {q.answer_a || "---"}
                    </span>
                    <span className={`p-1.5 rounded bg-slate-950 font-mono ${q.correct_answer === "b" ? "text-green-400 font-bold" : "text-slate-300"}`}>
                      B: {q.answer_b || "---"}
                    </span>
                    <span className={`p-1.5 rounded bg-slate-950 font-mono ${q.correct_answer === "c" ? "text-green-400 font-bold" : "text-slate-300"}`}>
                      C: {q.answer_c || "---"}
                    </span>
                    <span className={`p-1.5 rounded bg-slate-950 font-mono ${q.correct_answer === "d" ? "text-green-400 font-bold" : "text-slate-300"}`}>
                      D: {q.answer_d || "---"}
                    </span>
                  </div>

                  {/* الشرح وترجمة الحل */}
                  {(q.explanation || q.correct_answer_translation) && (
                    <div className="mt-2 text-xs text-slate-400 space-y-0.5 bg-slate-950/50 p-2 rounded">
                      {q.correct_answer_translation && <p><strong className="text-slate-300">ترجمة الحل:</strong> {q.correct_answer_translation}</p>}
                      {q.explanation && <p><strong className="text-slate-300">الشرح:</strong> {q.explanation}</p>}
                    </div>
                  )}

                  {/* الأخطاء إن وجدت */}
                  {hasErrors && (
                    <div className="mt-3 p-2 bg-red-950/40 rounded border border-red-800/40 text-xs text-red-300 space-y-1">
                      {q.errors.map((err, eIdx) => (
                        <div key={eIdx} className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing || !selectedQuiz || validCount === 0}
              className="btn-primary py-3 px-6 flex items-center gap-2 font-bold text-sm shadow-xl"
            >
              {importing ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>استيراد ({validCount}) سؤال صالح الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}