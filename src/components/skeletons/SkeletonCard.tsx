import React from 'react';

interface Props {
  className?: string;
}

export default function SkeletonCard({ className = '' }: Props) {
  return (
    <div 
      className={`bg-white dark:bg-darkbg-lighter rounded-xl p-6 shadow-soft dark:shadow-dark animate-pulse ${className}`}
      aria-busy="true"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200/40 dark:bg-darkbg/40 backdrop-blur rounded-lg w-8 h-8" />
            <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24" />
          </div>
          <div className="mt-3 h-6 bg-slate-200/40 dark:bg-darkbg/40 rounded w-32" />
        </div>
        <div className="h-6 bg-slate-200/40 dark:bg-darkbg/40 rounded-full w-16" />
      </div>
    </div>
  );
}