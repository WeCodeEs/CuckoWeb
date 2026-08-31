import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '../../utils/formatCurrency';
import type { SelectedGroupState } from './types';
import type { OptionGroup } from '../../stores/optionGroupStore';

interface SortableGroupRowProps {
  group: OptionGroup;
  groupState: SelectedGroupState;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (groupId: number) => void;
  onOptionToggle: (groupId: number, optionId: number, option: any) => void;
  onPriceOverride: (groupId: number, optionId: number, price: number | null) => void;
  onMove: (groupId: number, direction: 'up' | 'down') => void;
}

export default function SortableGroupRow({
  group,
  groupState,
  isFirst,
  isLast,
  onToggle,
  onOptionToggle,
  onPriceOverride,
  onMove,
}: SortableGroupRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const activeOptions = group.options.filter(o => o.active);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg transition-all border-primary/30 dark:border-secondary/30 bg-primary/5 dark:bg-secondary/5 ${
        isDragging ? 'z-50 opacity-80 shadow-lg' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-shrink-0 p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <input
              type="checkbox"
              id={`group-${group.id}`}
              checked={true}
              onChange={() => onToggle(group.id)}
              className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
            />
            <div>
              <label htmlFor={`group-${group.id}`} className="font-medium text-gray-900 dark:text-white cursor-pointer">
                {group.name}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Min: {group.min_select} | Max: {group.max_select} | {activeOptions.length} opciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(group.id, 'up')}
              disabled={isFirst}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              title="Mover arriba"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(group.id, 'down')}
              disabled={isLast}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              title="Mover abajo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-darkbg space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Opciones habilitadas para este producto
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeOptions.map(option => {
                const optionState = groupState?.options[option.id];
                const isOptionEnabled = optionState?.enabled || false;

                return (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg ${
                      isOptionEnabled
                        ? 'border-primary/20 dark:border-secondary/20 bg-white dark:bg-darkbg'
                        : 'border-gray-100 dark:border-darkbg-darker bg-gray-50 dark:bg-darkbg-darker opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`option-${group.id}-${option.id}`}
                          checked={isOptionEnabled}
                          onChange={() => onOptionToggle(group.id, option.id, option)}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
                        />
                        <label
                          htmlFor={`option-${group.id}-${option.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          {option.name}
                        </label>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Base: {option.additional_price > 0 ? `+${formatCurrency(option.additional_price)}` : 'Sin costo'}
                      </span>
                    </div>

                    {isOptionEnabled && (
                      <div className="mt-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          Precio override (dejar vacio para usar precio base)
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            value={optionState?.priceOverride ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              onPriceOverride(
                                group.id,
                                option.id,
                                val === '' ? null : parseFloat(val)
                              );
                            }}
                            min="0"
                            step="0.50"
                            placeholder={option.additional_price.toString()}
                            className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 dark:border-darkbg rounded bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
