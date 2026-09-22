import { useState } from "react";
import { Shield, ArrowLeft, Lock } from "lucide-react";
import { adminApi } from "@/lib/api";

export function AdminLogin({ onLogin, onBack }: { onLogin: (token: string) => void; onBack: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminApi.login(password);
      onLogin(data.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </button>

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600/20 rounded-2xl mb-4 border border-teal-500/30">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-slate-400 text-sm mt-1">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow"
                  placeholder="Admin password"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 rounded-lg border border-red-700/50">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
