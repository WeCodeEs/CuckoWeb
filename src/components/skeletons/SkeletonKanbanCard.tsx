import React from 'react';

interface Props {
  className?: string;
}

export default function SkeletonKanbanCard({ className = '' }: Props) {
  return (
    <div 
      className={`bg-white dark:bg-darkbg-lighter p-4 rounded-lg shadow-sm animate-pulse ${className}`}
      aria-busy="true"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24" />
        <div className="h-5 bg-slate-200/40 dark:bg-darkbg/40 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-full" />
        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-3/4" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-20" />
        <div className="h-8 w-8 bg-slate-200/40 dark:bg-darkbg/40 rounded-full" />
      </div>
    </div>
  );
}