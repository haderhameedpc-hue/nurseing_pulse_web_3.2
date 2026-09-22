import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, ArrowLeft, Trophy, Award, Target, TrendingUp } from "lucide-react";
import { studentApi } from "@/lib/api";
import type { Quiz } from "@/lib/api";

interface ModeSelectionProps {
  quiz: Quiz;
  onSelectMode: (mode: "timed" | "untimed") => void;
  onBack: () => void;
}

export function ModeSelection({ quiz, onSelectMode, onBack }: ModeSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="btn-ghost mb-4 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="card p-8 animate-fadeIn">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{quiz.name}</h1>
          {quiz.description && <p className="text-slate-500 mb-4">{quiz.description}</p>}
          {quiz.instructions && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
              <p className="text-sm text-blue-800">{quiz.instructions}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-semibold text-slate-700">Choose a mode:</p>
            {quiz.timed_mode_enabled && (
              <button onClick={() => onSelectMode("timed")} className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 text-teal-700 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Timed Mode</h3>
                    <p className="text-sm text-slate-500">{quiz.time_limit_seconds}s per question{quiz.timed_bonus_points > 0 ? ` · +${quiz.timed_bonus_points} bonus points` : ""}</p>
                  </div>
                </div>
              </button>
            )}
            {quiz.untimed_mode_enabled && (
              <button onClick={() => onSelectMode("untimed")} className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Untimed Mode</h3>
                    <p className="text-sm text-slate-500">No time pressure · Take your time</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfileProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

export function Profile({ studentId, studentName, onBack }: ProfileProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentApi.getMyAttempts(studentId), studentApi.getStudent(studentId)])
      .then(([attData, stData]) => {
        setAttempts(attData);
        setAchievements(stData.achievements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const badges = achievements.filter((a: any) => a.achievements?.achievement_type === "badge");
  const trophies = achievements.filter((a: any) => a.achievements?.achievement_type === "trophy");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="font-semibold text-slate-800">My Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Student info */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-800">{studentName}</h2>
          <p className="text-sm text-slate-500 mt-1">Student ID: {studentId.slice(0, 8)}...</p>
        </div>

        {/* Achievements */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Award className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-amber-700">{badges.length}</p>
              <p className="text-sm text-amber-600">Badges</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
              <Trophy className="w-8 h-8 text-teal-600 mb-2" />
              <p className="text-2xl font-bold text-teal-700">{trophies.length}</p>
              <p className="text-sm text-teal-600">Trophies</p>
            </div>
          </div>
          {achievements.length > 0 && (
            <div className="mt-4 space-y-2">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${a.achievements?.achievement_type === "badge" ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"}`}>
                    {a.achievements?.achievement_type === "badge" ? <Award className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{a.achievements?.name}</p>
                    <p className="text-xs text-slate-500">{a.achievements?.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz History */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Quiz History
          </h3>
          {attempts.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No quiz attempts yet.</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att: any) => (
                <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{att.quizzes?.name || "Quiz"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> {att.correct_answers}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" /> {att.wrong_answers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(att.completion_time_seconds)}
                      </span>
                      <span className={`badge ${att.mode === "timed" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                        {att.mode}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-slate-800">{att.percentage}%</p>
                    <p className="text-xs text-slate-500">{att.score.toFixed(0)} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  studentId: string;
  currentName: string;
  onNameChanged: (newName: string) => void;
  onBack: () => void;
}

export function SettingsPage({ studentId, currentName, onNameChanged, onBack }: SettingsProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newName.trim()) {
      setError("Please enter a new name.");
      return;
    }
    setLoading(true);
    try {
      await studentApi.changeName(studentId, newName);
      setSuccess("Name changed successfully!");
      onNameChanged(newName.trim());
      setNewName("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="font-semibold text-slate-800">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-2">Change Your Name</h2>
          <p className="text-sm text-slate-500 mb-1">Current name: <strong>{currentName}</strong></p>
          <p className="text-xs text-slate-400 mb-6">Your Student ID and all your results, points, badges, and trophies will remain unchanged.</p>

          <form onSubmit={handleChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ahmed Ali34"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">Must end with exactly two digits (e.g. 34, 07, 12).</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save New Name"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
