import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
        let borderClass = 'border-blue-500/30 bg-slate-900/90 text-blue-200';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/30 bg-slate-900/90 text-emerald-200';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30 bg-slate-900/90 text-rose-200';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/30 bg-slate-900/90 text-amber-200';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border glass-card shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${borderClass}`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
