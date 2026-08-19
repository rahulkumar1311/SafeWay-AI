import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data from SafeWay AI backend...'
}) => {
  return (
    <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
      <p className="text-xs text-slate-300 font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
