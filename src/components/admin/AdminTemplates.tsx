import { useState } from "react";
import { Copy, Check, FileText, Sparkles } from "lucide-react";
import { useToast } from "./shared";

const PRESET_TEMPLATES = [
  {
    title: "نموذج 4 خيارات مع ترجمة وشرح (الشائع لديك)",
    sample: `1.What is the primary function of red blood cells?
ما هي الوظيفة الأساسية لخلايا الدم الحمراء؟
a) Fight infections
b) Transport oxygen
c) Form blood clots
d) Produce antibodies
✅ الإجابة: b) Transport oxygen
ترجمه الجواب: نقل الأكسجين
الشرح: خلايا الدم الحمراء تحتوي على الهيموجلوبين المسؤول عن نقل الأكسجين لجميع أنسجة الجسم.`,
  },
  {
    title: "نموذج 5 خيارات (A, B, C, D, E)",
    sample: `2.Which of the following is considered a vital sign?
أي من الآتي يعتبر علامة حيوية؟
a) Blood pressure
b) Body temperature
c) Heart rate
d) Respiratory rate
e) All of the above
✅ الإجابة: e) All of the above
ترجمة الجواب: كل ما سبق صحيح`,
  },
  {
    title: "نموذج أسئلة سريع (بدون ترجمة)",
    sample: `3.Normal adult respiratory rate is:
a) 8 - 10 bpm
b) 12 - 20 bpm
c) 25 - 30 bpm
d) 35 - 40 bpm
✅ الإجابة: b) 12 - 20 bpm`,
  },
];

export function AdminTemplates() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast("تم نسخ صيغة النموذج إلى الحافظة!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-right">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-400" /> دليل صيغ وتنسيق الأسئلة (Question Formats)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          يتعرف نظام الاستيراد تلقائياً على كل الأشكال التالية بدون الحاجة لإنشاء نماذج يدوية. يمكنك نسخ أي صيغة كقالب لكتابة أسئلتك.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PRESET_TEMPLATES.map((tmpl, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" /> {tmpl.title}
              </h3>
              <button
                onClick={() => handleCopy(tmpl.sample, idx)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIdx === idx ? "تم النسخ" : "نسخ المثال"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap text-left" dir="ltr">
              {tmpl.sample}
            </pre>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}