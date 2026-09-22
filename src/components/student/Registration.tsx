import { useState } from "react";
import { GraduationCap, Info, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/api";

function normalizeStudentName(input: string): string {
  let cleaned = input.trim();
  // تحويل الأرقام العربية المشرقية إن وجدت إلى أرقام إنجليزية
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
  // إزالة أي مسافة تفصل الاسم عن الرقمين الأخيرين
  cleaned = cleaned.replace(/\s+(\d{2})$/, "$1");
  return cleaned;
}

export function Registration({ onRegistered }: { onRegistered: (student: Student) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("يرجى كتابة الاسم أولاً.");
      return;
    }

    const standardName = normalizeStudentName(name);

    // التحقق من أن الاسم ينتهي برقمين فقط
    const endsWithTwoDigits = /\d{2}$/.test(standardName);
    const endsWithThreeDigits = /\d{3}$/.test(standardName);

    if (!endsWithTwoDigits || endsWithThreeDigits) {
      setError("يجب أن ينتهي الاسم برقمين فقط (مثال: حيدر حميد98 أو أحمد علي12)");
      return;
    }

    setLoading(true);

    try {
      // 1. البحث عما إذا كان الطالب موجوداً مسبقاً
      const { data: existing, error: searchErr } = await supabase
        .from("students")
        .select("*")
        .or(`display_name.eq."${standardName}",display_name.eq."${name.trim()}"`)
        .maybeSingle();

      if (searchErr) throw searchErr;

      if (existing) {
        // تحديث وقت آخر نشاط للطالب
        await supabase
          .from("students")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", existing.id);

        onRegistered(existing);
        return;
      }

      // 2. إذا لم يكن مسجلاً، يتم إنشاء الحساب تلقائياً
      const { data: newStudent, error: insertErr } = await supabase
        .from("students")
        .insert({ display_name: standardName })
        .select()
        .single();

      if (insertErr) throw insertErr;

      onRegistered(newStudent);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء معالجة الحساب.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-2xl mb-4 border border-slate-800 shadow-xl">
            <GraduationCap className="w-10 h-10 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">منصة الاختبارات</h1>
          <p className="text-slate-400 text-sm">Interactive Learning & Assessment</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 animate-fadeIn">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                اسم الطالب
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: حيدر حميد98"
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow text-center text-lg"
                autoFocus
              />
            </div>

            <div className="flex items-start gap-2.5 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed text-right">
                اكتب اسمك مع رقمين في النهاية (مثل: <strong>حيدر حميد98</strong>). 
                إذا كان لديك حساب سابق ستدخل فوراً، وإذا كانت هذه أول مرة سيتم إنشاء حسابك تلقائياً.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/50">
                <p className="text-sm text-red-300 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold shadow-lg"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>متابعة ودخول</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}