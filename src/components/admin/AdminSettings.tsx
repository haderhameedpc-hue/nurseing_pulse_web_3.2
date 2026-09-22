import { Settings as SettingsIcon, Info } from "lucide-react";

export function AdminSettings({ token }: { token: string }) {
  return (
    <div className="animate-fadeIn max-w-2xl space-y-4">
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-teal-600" /> System Settings</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 text-sm mb-1">Admin Session</h3>
            <p className="text-xs text-slate-500">Your admin session lasts 24 hours. You can logout from the sidebar at any time.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 text-sm mb-1">Admin Password</h3>
            <p className="text-xs text-slate-500">The admin password is configured server-side and is not exposed in frontend code.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 text-sm mb-1">Scoring</h3>
            <p className="text-xs text-slate-500">All scoring is calculated server-side to prevent manipulation. Points are proportional to the percentage of correct answers multiplied by the quiz's max points.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 text-sm">Content Management</h3>
              <p className="text-xs text-blue-600 mt-1">All quiz structure, questions, achievements, leaderboard, and visibility settings are managed from their respective sections in the sidebar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
