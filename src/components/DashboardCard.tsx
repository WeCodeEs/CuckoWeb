import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'accent' | 'secondary' | 'primary-light';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isCurrency?: boolean;
}

const colorVariants = {
  primary: {
    background: 'bg-primary dark:bg-darkbg-lighter',
    text: 'text-white dark:text-white',
    icon: 'text-white dark:text-secondary',
    shadow: 'shadow-primary/20 dark:shadow-dark'
  },
  accent: {
    background: 'bg-accent dark:bg-darkbg-lighter',
    text: 'text-white dark:text-white',
    icon: 'text-white dark:text-accent',
    shadow: 'shadow-accent/20 dark:shadow-dark'
  },
  secondary: {
    background: 'bg-secondary dark:bg-darkbg-lighter',
    text: 'text-white dark:text-white',
    icon: 'text-white dark:text-secondary',
    shadow: 'shadow-secondary/20 dark:shadow-dark'
  },
  'primary-light': {
    background: 'bg-primary-light dark:bg-darkbg-lighter',
    text: 'text-white dark:text-white',
    icon: 'text-white dark:text-primary-light',
    shadow: 'shadow-primary-light/20 dark:shadow-dark'
  }
};

export default function DashboardCard({ title, value, icon: Icon, color, trend, isCurrency }: Props) {
  const colorClasses = colorVariants[color];
  const displayValue = isCurrency ? formatCurrency(value as number) : value;

  return (
    <div className={clsx(
      "rounded-xl p-6 shadow-lg transition-transform hover:scale-[1.02]",
      colorClasses.background,
      colorClasses.shadow
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 dark:bg-darkbg backdrop-blur rounded-lg">
              <Icon className={clsx("w-5 h-5", colorClasses.icon)} />
            </div>
            <p className={clsx("text-sm font-medium opacity-90", colorClasses.text)}>
              {title}
            </p>
          </div>
          <p className={clsx(
            "mt-3 text-2xl font-bold tracking-tight",
            colorClasses.text
          )}>
            {displayValue}
          </p>
        </div>
        
        {trend && (
          <div className={clsx(
            "px-2.5 py-1.5 rounded-full text-xs font-medium",
            trend.isPositive 
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}>
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}