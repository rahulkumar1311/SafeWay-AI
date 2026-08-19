import React from 'react';
import { Info } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message
}) => {
  return (
    <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
      <Info className="w-8 h-8 text-slate-500 mx-auto" />
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">{message}</p>
    </div>
  );
};

export default EmptyState;
