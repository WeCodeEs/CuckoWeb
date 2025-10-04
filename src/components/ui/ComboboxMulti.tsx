import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  value: string | number;
  label: string;
  badge?: string;
}

interface Props {
  options: Option[];
  value: Option[];
  onChange: (value: Option[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export default function ComboboxMulti({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  loading = false,
  emptyMessage = 'No hay opciones disponibles'
}: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: Option) => {
    const isSelected = value.some(v => v.value === option.value);
    if (isSelected) {
      onChange(value.filter(v => v.value !== option.value));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemove = (optionValue: string | number) => {
    onChange(value.filter(v => v.value !== optionValue));
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 rounded-lg border border-gray-300 dark:border-darkbg focus-within:ring-2 focus-within:ring-primary/20 dark:focus-within:ring-secondary/20 focus-within:border-primary dark:focus-within:border-secondary bg-white dark:bg-darkbg min-h-[42px]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen(true)}
      >
        {value.length > 0 ? (
          value.map(option => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-darkbg-lighter rounded"
            >
              {option.label}
              {option.badge && (
                <span className="text-xs text-primary dark:text-secondary">
                  {option.badge}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(option.value);
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-darkbg rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-500 dark:text-gray-400 text-sm py-1">
            {placeholder}
          </span>
        )}
      </div>

      {open && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-darkbg-lighter rounded-lg border border-gray-200 dark:border-darkbg shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-2 text-center">
                <div className="w-5 h-5 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : options.length === 0 ? (
              <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              options.map(option => {
                const isSelected = value.some(v => v.value === option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-darkbg transition-colors",
                      isSelected && "bg-primary/5 dark:bg-secondary/5"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {option.label}
                      {option.badge && (
                        <span className="text-xs text-primary dark:text-secondary font-medium">
                          {option.badge}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary dark:text-secondary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}