import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, DollarSign } from 'lucide-react';
import { OptionGroup, Option } from '../../stores/optionGroupStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Switch from '../ui/switch';

interface SelectedGroupState {
  enabled: boolean;
  options: Record<number, { enabled: boolean; priceOverride: number | null }>;
}

interface Props {
  group: OptionGroup;
  groupState: SelectedGroupState | undefined;
  onGroupToggle: (groupId: number) => void;
  onOptionToggle: (groupId: number, optionId: number, option: Option) => void;
  onPriceOverride: (groupId: number, optionId: number, price: number | null) => void;
}

export default function OptionGroupCard({
  group,
  groupState,
  onGroupToggle,
  onOptionToggle,
  onPriceOverride,
}: Props) {
  const isGroupEnabled = groupState?.enabled || false;
  const activeOptions = group.options.filter(o => o.active);
  const enabledOptionsCount = isGroupEnabled
    ? Object.values(groupState?.options || {}).filter(o => o.enabled).length
    : 0;
  const [expanded, setExpanded] = useState(isGroupEnabled);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);

  const handleToggle = () => {
    onGroupToggle(group.id);
    if (!isGroupEnabled) setExpanded(true);
  };

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        isGroupEnabled
          ? 'border-primary/40 dark:border-secondary/40 shadow-sm'
          : 'border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-darkbg-lighter'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors ${
          isGroupEnabled
            ? 'bg-primary/5 dark:bg-secondary/10'
            : 'bg-white dark:bg-darkbg-lighter hover:bg-gray-50 dark:hover:bg-darkbg'
        }`}
        onClick={() => setExpanded(prev => !prev)}
      >
        <div onClick={e => e.stopPropagation()}>
          <Switch checked={isGroupEnabled} onChange={handleToggle} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {group.name}
            </span>
            {isGroupEnabled && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 dark:bg-secondary/15 text-primary dark:text-secondary">
                {enabledOptionsCount}/{activeOptions.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Seleccionar: {group.min_select} - {group.max_select}
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {activeOptions.length} {activeOptions.length === 1 ? 'opcion' : 'opciones'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && isGroupEnabled && activeOptions.length > 0 && (
        <div className="px-4 pb-4 pt-1 bg-white dark:bg-darkbg-lighter border-t border-gray-100 dark:border-darkbg">
          <div className="space-y-2">
            {activeOptions.map(option => {
              const optionState = groupState?.options[option.id];
              const isOptionEnabled = optionState?.enabled || false;
              const isEditing = editingPrice === option.id;
              const hasOverride = optionState?.priceOverride != null;

              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isOptionEnabled
                      ? 'bg-gray-50 dark:bg-darkbg'
                      : 'bg-gray-50/50 dark:bg-darkbg/50 opacity-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOptionToggle(group.id, option.id, option)}
                    className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-all duration-150 ${
                      isOptionEnabled
                        ? 'bg-primary dark:bg-secondary border-primary dark:border-secondary'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {isOptionEnabled && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isOptionEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {option.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOptionEnabled && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setEditingPrice(option.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          hasOverride
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-gray-100 dark:bg-darkbg-darker text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-darkbg hover:bg-gray-200 dark:hover:bg-darkbg'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        {hasOverride
                          ? formatCurrency(optionState!.priceOverride!)
                          : option.additional_price > 0
                            ? `+${formatCurrency(option.additional_price)}`
                            : 'Gratis'}
                      </button>
                    )}

                    {isEditing && isOptionEnabled && (
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            autoFocus
                            value={optionState?.priceOverride ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              onPriceOverride(
                                group.id,
                                option.id,
                                val === '' ? null : parseFloat(val)
                              );
                            }}
                            onBlur={() => setEditingPrice(null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === 'Escape') setEditingPrice(null);
                            }}
                            min="0"
                            step="0.50"
                            placeholder={option.additional_price.toString()}
                            className="w-24 pl-5 pr-2 py-1 text-xs border border-primary/30 dark:border-secondary/30 rounded-md bg-white dark:bg-darkbg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {!isOptionEnabled && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {option.additional_price > 0 ? `+${formatCurrency(option.additional_price)}` : 'Gratis'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expanded && !isGroupEnabled && activeOptions.length > 0 && (
        <div className="px-4 pb-3 pt-1 bg-gray-50/50 dark:bg-darkbg-lighter border-t border-gray-100 dark:border-darkbg">
          <div className="flex flex-wrap gap-1.5 pt-2">
            {activeOptions.map(option => (
              <span
                key={option.id}
                className="inline-flex items-center px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-darkbg rounded-full"
              >
                {option.name}
                {option.additional_price > 0 && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">
                    +{formatCurrency(option.additional_price)}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
