import React from 'react';

interface Props {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
  className?: string;
}

export default function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  hasActions = true,
  className = ''
}: Props) {
  return (
    <div 
      className={`bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden ${className}`}
      aria-busy="true"
    >
      <div className="overflow-x-auto animate-pulse">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-darkbg/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th 
                  key={i}
                  className="px-6 py-4 text-left"
                >
                  <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24" />
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 text-right">
                  <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-16 ml-auto" />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td 
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-full" 
                      style={{ 
                        width: `${Math.floor(Math.random() * 40 + 60)}%`
                      }} 
                    />
                  </td>
                ))}
                {hasActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-8 h-8 bg-slate-200/40 dark:bg-darkbg/40 rounded-lg" />
                      <div className="w-8 h-8 bg-slate-200/40 dark:bg-darkbg/40 rounded-lg" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}