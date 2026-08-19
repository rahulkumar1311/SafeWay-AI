import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Backend Service Unavailable',
  message,
  onRetry
}) => {
  return (
    <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-rose-500/40 bg-rose-950/20">
      <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
