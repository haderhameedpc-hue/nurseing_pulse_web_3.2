import { useState } from "react";
import { GraduationCap, Info, LogIn } from "lucide-react";
import { studentApi } from "@/lib/api";
import type { Student } from "@/lib/api";

export function Registration({ onRegistered }: { onRegistered: (student: Student) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const data = await studentApi.register(name);
        onRegistered(data.student);
      } else {
        const data = await studentApi.login(name);
        onRegistered(data.student);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Platform</h1>
          <p className="text-teal-100 text-sm">Interactive Learning & Assessment</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === "register" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}
            >
              Register
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === "login" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}
            >
              Returning Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {mode === "register" ? "Your Name" : "Enter Your Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Mohammed12"
                className="input-field"
                autoFocus
              />
            </div>

            {mode === "register" && (
              <div className="flex items-start gap-2.5 p-3 bg-teal-50 rounded-lg border border-teal-100">
                <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-teal-800 leading-relaxed">
                  Your name <strong>must end with exactly two digits</strong> (e.g. Ahmed12, Ali45).
                  The two digits are required to distinguish your account from other students
                  with the same or similar name.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "register" ? <GraduationCap className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {mode === "register" ? "Register" : "Login"}
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-teal-200 text-xs mt-6">
          Enter your name with two digits at the end to get started
        </p>
      </div>
    </div>
  );
}
