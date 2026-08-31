import { X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OptionRow } from './types';

interface SortableOptionRowProps {
  row: OptionRow;
  index: number;
  onUpdate: (tempId: string, field: 'name' | 'additional_price', value: string) => void;
  onRemove: (tempId: string) => void;
}

export default function SortableOptionRow({
  row,
  index,
  onUpdate,
  onRemove,
}: SortableOptionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group ${isDragging ? 'z-50 opacity-80' : ''}`}
    >
      <button
        type="button"
        className="flex-shrink-0 p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={row.name}
          onChange={(e) => onUpdate(row.tempId, 'name', e.target.value)}
          placeholder={`Opcion ${index + 1}`}
          maxLength={100}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
        />
      </div>

      <div className="flex-shrink-0 w-24 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
        <input
          type="number"
          value={row.additional_price}
          onChange={(e) => onUpdate(row.tempId, 'additional_price', e.target.value)}
          placeholder="0"
          min="0"
          step="0.50"
          className="w-full pl-7 pr-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(row.tempId)}
        className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
