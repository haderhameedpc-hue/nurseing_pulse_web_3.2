import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800">
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
          checked ? "bg-teal-600" : "bg-slate-700"
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
    </label>
  );
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } overflow-hidden animate-fadeIn`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4 text-right">
        <div className="flex items-start gap-3 flex-row-reverse">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-sm text-slate-300">{message}</p>
        </div>
        <div className="flex justify-start gap-2 pt-2">
          <button onClick={onCancel} className="btn-secondary">
            إلغاء
          </button>
          <button onClick={onConfirm} className="btn-danger">
            تأكيد الحذف
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, showToast };
}