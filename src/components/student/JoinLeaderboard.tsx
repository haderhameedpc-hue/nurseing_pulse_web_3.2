import { useState, useEffect } from "react";
import { Trophy, X, Info, ArrowRight, AlertCircle } from "lucide-react";
import { joinLeaderboard, getGuestPoints, type Profile } from "@/lib/authService";

interface JoinLeaderboardProps {
  onSuccess?: (profile: Profile) => void;
  onClose?: () => void;
}

export function JoinLeaderboard({ onSuccess, onClose }: JoinLeaderboardProps) {
  const [username, setUsername] = useState("");
  const [guestPoints, setGuestPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setGuestPoints(getGuestPoints());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = username.trim();
    if (!trimmed) {
      setError("يرجى كتابة اسم المستخدم أولاً.");
      return;
    }

    setLoading(true);
    try {
      const profile = await joinLeaderboard(trimmed);
      alert(`تم بنجاح! نقاطك الإجمالية الآن: ${profile.points}`);
      setGuestPoints(0);
      setUsername("");
      onSuccess?.(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl mb-4 border border-slate-700">
            <Trophy className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">انضم للوحة الصدارة</h2>
          <p className="text-slate-400 text-sm">
            أدخل اسم المستخدم للدخول أو إنشاء حساب جديد
          </p>
        </div>

        {guestPoints > 0 && (
          <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-teal-950/40 rounded-lg border border-teal-800/50">
            <Trophy className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-200 text-right">
              لديك <strong>{guestPoints}</strong> نقطة غير محفوظة! ستُضاف إلى حسابك عند الانضمام.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="join-username" className="block text-sm font-medium text-slate-300 mb-2">
              اسم المستخدم
            </label>
            <input
              id="join-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: أحمد علي"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow text-center text-lg"
              autoFocus
            />
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed text-right">
              إذا كان الاسم موجوداً سجلناك دخولاً وأضفنا نقاطك غير المحفوظة إلى رصيدك.
              إذا كان جديداً سننشئ حساباً بنقاطك الحالية.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 rounded-lg border border-red-800/50">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 text-right">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>متابعة</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
