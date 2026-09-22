import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { LoadingSpinner, EmptyState } from "./shared";

export function AdminActivityLog({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getActivityLog(token).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fadeIn">
      {items.length === 0 ? <EmptyState message="No admin activity logged yet." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Record ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date & Time</th>
            </tr></thead>
            <tbody>
              {items.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{a.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{a.record_id}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
