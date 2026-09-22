import { useState, useEffect } from "react";
import { Save, GripVertical } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { LeaderboardSettings } from "@/lib/api";
import { useToast, Toggle, LoadingSpinner } from "./shared";

export function AdminLeaderboard({ token }: { token: string }) {
  const [settings, setSettings] = useState<LeaderboardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    adminApi.getLeaderboardSettings(token).then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const updateColumn = (idx: number, field: "enabled" | "order", value: boolean | number) => {
    if (!settings) return;
    const cols = [...settings.columns_config];
    cols[idx] = { ...cols[idx], [field]: value };
    setSettings({ ...settings, columns_config: cols });
  };

  const moveColumn = (idx: number, dir: "up" | "down") => {
    if (!settings) return;
    const cols = [...settings.columns_config].sort((a, b) => a.order - b.order);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= cols.length) return;
    const tmp = cols[idx].order;
    cols[idx].order = cols[target].order;
    cols[target].order = tmp;
    setSettings({ ...settings, columns_config: cols });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await adminApi.updateLeaderboardSettings(token, {
        is_enabled: settings.is_enabled,
        columns_config: settings.columns_config,
        sort_by: settings.sort_by,
        sort_direction: settings.sort_direction,
      });
      showToast("Leaderboard settings saved");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!settings) return <p className="text-slate-500 text-center py-8">Failed to load settings.</p>;

  const sortedCols = [...settings.columns_config].sort((a, b) => a.order - b.order);
  const sortOptions = [
    { value: "total_points", label: "Total Points" },
    { value: "total_completed_quizzes", label: "Completed Quizzes" },
    { value: "highest_score", label: "Highest Score" },
    { value: "total_attempts", label: "Total Attempts" },
    { value: "display_name", label: "Name (alphabetical)" },
  ];

  return (
    <div className="space-y-4 animate-fadeIn max-w-2xl">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Leaderboard Visibility</h2>
          <Toggle checked={settings.is_enabled} onChange={(v) => setSettings({ ...settings, is_enabled: v })} label="Enabled" />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Columns</h2>
        <div className="space-y-2">
          {sortedCols.map((col, idx) => (
            <div key={col.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex flex-col">
                <button onClick={() => moveColumn(idx, "up")} className="text-slate-400 hover:text-slate-700 text-xs disabled:opacity-30" disabled={idx === 0}>▲</button>
                <button onClick={() => moveColumn(idx, "down")} className="text-slate-400 hover:text-slate-700 text-xs disabled:opacity-30" disabled={idx === sortedCols.length - 1}>▼</button>
              </div>
              <span className="flex-1 font-medium text-slate-700">{col.label}</span>
              <Toggle checked={col.enabled} onChange={(v) => updateColumn(idx, "enabled", v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Sorting</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
            <select className="input-field" value={settings.sort_by} onChange={e => setSettings({ ...settings, sort_by: e.target.value })}>
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
            <select className="input-field" value={settings.sort_direction} onChange={e => setSettings({ ...settings, sort_direction: e.target.value as "asc" | "desc" })}>
              <option value="desc">Descending</option><option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>

      {toast && <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white animate-fadeIn`}>{toast.message}</div>}
    </div>
  );
}
