import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { adminApi } from "@/lib/api";
import { LoadingSpinner, EmptyState } from "./shared";

export function AdminNameChanges({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.getNameChanges(token, search || undefined)
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, search]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fadeIn">
      <input className="input-field max-w-xs" placeholder="Search by old or new name..." value={search} onChange={e => setSearch(e.target.value)} />

      {items.length === 0 ? <EmptyState message="No name changes found." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Student ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Previous Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">New Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date & Time</th>
            </tr></thead>
            <tbody>
              {items.map((nc: any) => (
                <tr key={nc.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{nc.students?.display_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{nc.student_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-500"><span className="line-through">{nc.previous_name}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-700">{nc.new_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(nc.changed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
