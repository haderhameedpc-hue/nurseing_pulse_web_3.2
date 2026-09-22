import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto animate-fadeIn`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button onClick={onConfirm} className="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast };
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field max-w-xs"
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-teal-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );
}
