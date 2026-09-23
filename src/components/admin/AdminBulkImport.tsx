import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Quiz, QuestionTemplate } from "@/lib/api";
import { useToast, LoadingSpinner } from "./shared";

interface ParsedQuestion {
  question_text: string;
  question_translation: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  answer_e?: string;
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
          setSelectedTemplateId(ts[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // دالة استخراج حرف الإجابة الصحيحة
  const extractCorrectLetter = (line: string): "a" | "b" | "c" | "d" | null => {
    const match = line.match(/(?:✅|✔️|☑️|\*)?\s*(?:إجابة|الجواب|الإجابة|الحل|answer|correct)[\s:\-–—\.]*([a-dA-Dأ-د])/i);
    let letter = match ? match[1].toLowerCase() : null;

    if (!letter) {
      const fallback = line.match(/\b([a-dA-Dأ-د])[\)\.]/i);
      if (fallback) letter = fallback[1].toLowerCase();
    }

    if (letter === "أ" || letter === "ا") return "a";
    if (letter === "ب") return "b";
    if (letter === "ج") return "c";
    if (letter === "د") return "d";
    if (["a", "b", "c", "d"].includes(letter || "")) return letter as any;
    return null;
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      showToast("يرجى لصق نص الأسئلة أولاً", "error");
      return;
    }

    // فصل كل سؤال عن الآخر بالأسطر الفارغة
    const blocks = rawText
      .trim()
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const parsedResults: ParsedQuestion[] = blocks.map((block) => {
      const lines = block
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
        answer_e: "",
        correct_answer: "a",
        correct_answer_translation: "",
        explanation: "",
        errors: [],
      };

      let state: "QUESTION" | "OPTIONS" | "AFTER_ANSWER" = "QUESTION";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // 1. فحص سطر الإجابة الصحيحة
        const isAnswerLine =
          line.includes("✅") ||
          line.includes("✔️") ||
          /^(إجابة|الجواب|الإجابة|الحل|answer|correct)/i.test(line);

        if (isAnswerLine) {
          state = "AFTER_ANSWER";
          const detectedLetter = extractCorrectLetter(line);
          if (detectedLetter) {
            q.correct_answer = detectedLetter;
          } else {
            q.errors.push(`لم نتمكن من تحديد حرف الإجابة من: "${line}"`);
          }
          continue;
        }

        // 2. فحص أسطر الخيارات
        const optionMatch = line.match(/^([a-eA-Eأ-ه])[\)\.\-:\s]\s*(.+)$/i);
        if (state !== "AFTER_ANSWER" && optionMatch) {
          state = "OPTIONS";
          let opt = optionMatch[1].toLowerCase();
          if (opt === "أ" || opt === "ا") opt = "a";
          else if (opt === "ب") opt = "b";
          else if (opt === "ج") opt = "c";
          else if (opt === "د") opt = "d";
          else if (opt === "ه" || opt === "هـ") opt = "e";

          const val = optionMatch[2].trim();
          if (opt === "a") q.answer_a = val;
          else if (opt === "b") q.answer_b = val;
          else if (opt === "c") q.answer_c = val;
          else if (opt === "d") q.answer_d = val;
          else if (opt === "e") q.answer_e = val;
          continue;
        }

        // 3. أسطر ما بعد الإجابة (ترجمة الجواب أو الشرح)
        if (state === "AFTER_ANSWER") {
          if (lower.startsWith("explanation:") || lower.startsWith("شرح:") || lower.startsWith("توضيح:")) {
            q.explanation = line.replace(/^(explanation|شرح|توضيح)[\s:\-–—\.]*/i, "").trim();
          } else if (
            lower.startsWith("translation:") ||
            lower.startsWith("ترجمة:") ||
            lower.startsWith("ترجمه:") ||
            lower.startsWith("ترجمه الجواب") ||
            lower.startsWith("ترجمة الجواب") ||
            lower.startsWith("ترجمة الحل")
          ) {
            q.correct_answer_translation = line
              .replace(/^(translation|ترجمة|ترجمه|ترجمه الجواب|ترجمة الجواب|ترجمة الحل)[\s:\-–—\.]*/i, "")
              .trim();
          } else if (!q.correct_answer_translation) {
            q.correct_answer_translation = line;
          } else if (!q.explanation) {
            q.explanation = line;
          } else {
            q.explanation += " " + line;
          }
          continue;
        }

        // 4. أسطر نص السؤال وترجمته
        if (state === "QUESTION") {
          if (!q.question_text) {
            q.question_text = line.replace(/^\s*\d+[\.\)\-:]\s*/, "").trim();
          } else if (!q.question_translation) {
            q.question_translation = line;
          } else {
            q.question_translation += " " + line;
          }
        }
      }

      if (!q.question_text) q.errors.push("نص السؤال مفقود");
      if (!q.answer_a) q.errors.push("الخيار A مفقود");
      if (!q.answer_b) q.errors.push("الخيار B مفقود");
      if (!q.answer_c) q.errors.push("الخيار C مفقود");
      if (!q.answer_d) q.errors.push("الخيار D مفقود");

      return q;
    });

    setParsed(parsedResults);
    const valid = parsedResults.filter((p) => p.errors.length === 0).length;
    showToast(`تم التعرف على ${parsedResults.length} سؤال (${valid} جاهز للاستيراد)`);
  };

  const handleImport = async () => {
    if (!selectedQuiz) {
      showToast("يرجى اختيار الاختبار أولاً", "error");
      return;
    }

    const validQuestions = parsed.filter((p) => p.errors.length === 0);
    if (validQuestions.length === 0) {
      showToast("لا توجد أسئلة صالحة للإضافة", "error");
      return;
    }

    setImporting(true);
    try {
      const payload = validQuestions.map((q, idx) => {
        // إذا وجد خيار خامس E، ندمجه مع الشرح حتى لا ترفضه قاعدة البيانات
        let finalExplanation = q.explanation || "";
        if (q.answer_e && q.answer_e.trim()) {
          const eNote = `[الخيار E: ${q.answer_e.trim()}]`;
          finalExplanation = finalExplanation ? `${finalExplanation} - ${eNote}` : eNote;
        }

        return {
          quiz_id: selectedQuiz,
          question_text: q.question_text,
          question_translation: q.question_translation || "",
          answer_a: q.answer_a,
          answer_b: q.answer_b,
          answer_c: q.answer_c,
          answer_d: q.answer_d,
          correct_answer: q.correct_answer,
          correct_answer_translation: q.correct_answer_translation || "",
          explanation: finalExplanation,
          sort_order: idx + 1,
          is_enabled: true,
          is_visible: true,
        };
      });

      await adminApi.bulkImportQuestions(token, payload);
      showToast(`تم استيراد ${validQuestions.length} سؤال بنجاح دون أي أخطاء!`);
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

  return (
    <div className="space-y-6 animate-fadeIn text-right">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-teal-400" /> الاستيراد السريع للأسئلة (Bulk Import)
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          يتعرف النظام تلقائياً على صيغة أسئلتك (نص السؤال، ترجمته، الخيارات، وعلامة الإجابة الصحيحة مع ترجمتها).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">1. الاختبار المستهدف</label>
            <select
              className="input-field"
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
            >
              <option value="">-- اختر الاختبار المستهدف --</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">2. وضع التحليل</label>
            <div className="input-field flex items-center justify-between text-xs text-teal-300 bg-slate-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" /> التعرف الذكي التلقائي
              </span>
              <span className="text-slate-500 font-mono">متوافق 100%</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">3. الصق قائمة الأسئلة</label>
          <textarea
            className="input-field font-mono text-xs leading-relaxed text-left"
            dir="ltr"
            rows={12}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`1.a question?
ترجمة السؤال
a) to choose
b) to choose
c) to choose
d) to choose
✅ الإجابة: b) answer
ترجمه الجواب`}
          />
          <p className="text-[11px] text-slate-500 mt-1">اترك سطراً فارغاً واحداً بين كل سؤال والذي يليه.</p>
        </div>

        <button onClick={handleParse} className="btn-secondary flex items-center gap-2 text-sm font-semibold">
          <FileText className="w-4 h-4" /> تحليل ومعاينة الأسئلة
        </button>
      </div>

      {parsed.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-base">معاينة الأسئلة المستخرجة ({parsed.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">راجع الأسئلة قبل إضافتها للاختبار</p>
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
                      <p className="font-semibold text-slate-100 text-left" dir="ltr">{q.question_text || "(بدون نص)"}</p>
                      {q.question_translation && (
                        <p className="text-xs text-blue-400 mt-1">{q.question_translation}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-300 font-mono text-xs shrink-0">
                      الإجابة: {q.correct_answer.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs text-left" dir="ltr">
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
                    {q.answer_e && (
                      <span className="p-1.5 rounded bg-slate-950 font-mono text-amber-400/90 sm:col-span-2">
                        E (مدمج مع الشرح): {q.answer_e}
                      </span>
                    )}
                  </div>

                  {(q.correct_answer_translation || q.explanation) && (
                    <div className="mt-2 text-xs text-slate-400 space-y-0.5 bg-slate-950/50 p-2 rounded">
                      {q.correct_answer_translation && <p><strong className="text-slate-300">ترجمة الحل:</strong> {q.correct_answer_translation}</p>}
                      {q.explanation && <p><strong className="text-slate-300">الشرح:</strong> {q.explanation}</p>}
                    </div>
                  )}

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
                  <span>استيراد ({validCount}) سؤال إلى الاختبار الآن</span>
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