import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Quiz, QuestionTemplate } from "@/lib/api";
import { useToast, LoadingSpinner, EmptyState } from "./shared";

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
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const { toast, showToast } = useToast();
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getQuizzes(token), adminApi.getTemplates(token)])
      .then(([qz, ts]) => { setQuizzes(qz); setTemplates(ts); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const parseQuestions = (text: string): ParsedQuestion[] => {
    const blocks = text.trim().split(/\n\s*\n(?=\d+\.|\d+\))/).filter(b => b.trim());
    return blocks.map(block => {
      const errors: string[] = [];
      const lines = block.trim().split("\n").map(l => l.trim());

      let question_text = "";
      let question_translation = "";
      let answer_a = "", answer_b = "", answer_c = "", answer_d = "";
      let correct_answer: "a" | "b" | "c" | "d" = "a";
      let correct_answer_translation = "";
      let explanation = "";
      let foundAnswer = false;
      let foundCorrect = false;

      let lineIdx = 0;
      // First line: question (starts with number. or number))
      if (lines.length > 0) {
        const qMatch = lines[0].match(/^\d+[\.\)]\s*(.+)$/);
        if (qMatch) {
          question_text = qMatch[1].trim();
        } else {
          question_text = lines[0];
        }
        lineIdx = 1;
      }

      // Check if next line is a translation (not an answer option)
      if (lineIdx < lines.length && !/^[a-d]\)/.test(lines[lineIdx]) && !/^Answer:/i.test(lines[lineIdx]) && !/^Explanation:/i.test(lines[lineIdx])) {
        question_translation = lines[lineIdx];
        lineIdx++;
      }

      // Parse answer options
      for (; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const aMatch = line.match(/^[a-d]\)\s*(.+)$/i);
        if (aMatch) {
          const key = aMatch[0][0].toLowerCase();
          const val = aMatch[1].trim();
          if (key === "a") answer_a = val;
          else if (key === "b") answer_b = val;
          else if (key === "c") answer_c = val;
          else if (key === "d") answer_d = val;
          foundAnswer = true;
          continue;
        }
        const ansMatch = line.match(/^Answer:\s*([a-d])/i);
        if (ansMatch) {
          correct_answer = ansMatch[1].toLowerCase() as "a" | "b" | "c" | "d";
          foundCorrect = true;
          continue;
        }
        const transMatch = line.match(/^Answer\s*translation:?\s*(.+)$/i);
        if (transMatch && foundCorrect) {
          correct_answer_translation = transMatch[1].trim();
          continue;
        }
        // Non-answer line after answers and no specific match → could be explanation
        const explMatch = line.match(/^Explanation:?\s*(.+)$/i);
        if (explMatch) {
          explanation = explMatch[1].trim();
          continue;
        }
      }

      if (!question_text) errors.push("Missing question text");
      if (!answer_a && !answer_b && !answer_c && !answer_d) errors.push("Missing answer options");
      if (!foundCorrect) errors.push("Missing correct answer (Answer: x)");

      return { question_text, question_translation, answer_a, answer_b, answer_c, answer_d, correct_answer, correct_answer_translation, explanation, errors };
    });
  };

  const handleParse = () => {
    if (!rawText.trim()) { showToast("Please paste some questions first", "error"); return; }
    const result = parseQuestions(rawText);
    setParsed(result);
    if (result.length > 0) showToast(`Parsed ${result.length} questions`);
    else showToast("No questions found. Check your format.", "error");
  };

  const handleImport = async () => {
    if (!selectedQuiz) { showToast("Please select a target quiz", "error"); return; }
    const valid = parsed.filter(p => p.errors.length === 0);
    if (valid.length === 0) { showToast("No valid questions to import", "error"); return; }
    setImporting(true);
    try {
      const questions = valid.map((p, i) => ({
        quiz_id: selectedQuiz,
        question_text: p.question_text,
        question_translation: p.question_translation,
        answer_a: p.answer_a, answer_b: p.answer_b, answer_c: p.answer_c, answer_d: p.answer_d,
        correct_answer: p.correct_answer,
        correct_answer_translation: p.correct_answer_translation,
        explanation: p.explanation,
        sort_order: i,
        is_enabled: true,
        is_visible: true,
      }));
      await adminApi.bulkImportQuestions(token, questions);
      showToast(`Imported ${valid.length} questions successfully`);
      setParsed([]); setRawText("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setImporting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const validCount = parsed.filter(p => p.errors.length === 0).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-teal-600" /> Bulk Question Import</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Quiz</label>
            <select className="input-field" value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}>
              <option value="">— Select Quiz —</option>
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference Template</label>
            <select className="input-field" disabled={!templates.length}>
              <option>{templates.length ? "Select for reference" : "No templates created yet"}</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Paste Questions</label>
          <textarea
            className="input-field font-mono text-sm"
            rows={12}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={`1. What is the capital of France?

What is the capital of France? (translation)

a) London
b) Paris
c) Berlin
d) Madrid

Answer: b

Paris (translation)

Explanation: Paris is the capital and largest city of France.

2. What is 2 + 2?

a) 3
b) 4
c) 5
d) 6

Answer: b`}
          />
          <p className="text-xs text-slate-400 mt-1">Separate questions with blank lines. Each question starts with a number.</p>
        </div>

        <button onClick={handleParse} className="btn-secondary flex items-center gap-2"><FileText className="w-4 h-4" /> Parse & Preview</button>
      </div>

      {parsed.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Preview ({parsed.length} questions)</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {validCount} valid</span>
              {invalidCount > 0 && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {invalidCount} errors</span>}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parsed.map((q, i) => (
              <div key={i} className={`p-4 rounded-lg border ${q.errors.length ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                <p className="font-medium text-slate-800 text-sm">{i + 1}. {q.question_text || "(empty)"}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>Answer: {q.correct_answer.toUpperCase()}</span>
                  {q.answer_a && <span>A: {q.answer_a.slice(0, 20)}</span>}
                </div>
                {q.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {q.errors.map((e, j) => <div key={j}>• {e}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleImport} disabled={importing || !selectedQuiz || validCount === 0} className="btn-primary mt-4 flex items-center gap-2">
            {importing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
            Import {validCount} Valid Questions
          </button>
        </div>
      )}

      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}
