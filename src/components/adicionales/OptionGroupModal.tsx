import { useState, useRef, useEffect, useCallback } from 'react';
import { useOptionGroupStore, type OptionInput } from '../../stores/optionGroupStore';
import { useToast } from '../ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { GripVertical, X, Plus, ListChecks, Loader as Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  onClose: () => void;
}

interface OptionRow {
  tempId: string;
  name: string;
  additional_price: string;
}

const normalizeText = (text: string): string => {
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
};

const generateTempId = () => Math.random().toString(36).slice(2, 10);

function SortableOptionRow({
  row,
  index,
  onUpdate,
  onRemove,
  onKeyDown,
  nameRef,
}: {
  row: OptionRow;
  index: number;
  onUpdate: (tempId: string, field: 'name' | 'additional_price', value: string) => void;
  onRemove: (tempId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number, field: 'name' | 'additional_price') => void;
  nameRef: (el: HTMLInputElement | null) => void;
}) {
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
          ref={nameRef}
          type="text"
          value={row.name}
          onChange={(e) => onUpdate(row.tempId, 'name', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index, 'name')}
          placeholder={`Opcion ${index + 1}`}
          maxLength={100}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
        />
      </div>

      <div className="flex-shrink-0 w-28 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
        <input
          type="number"
          value={row.additional_price}
          onChange={(e) => onUpdate(row.tempId, 'additional_price', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index, 'additional_price')}
          placeholder="0.00"
          min="0"
          step="0.50"
          className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(row.tempId)}
        className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function OptionGroupModal({ onClose }: Props) {
  const { selectedGroup, saveGroupWithOptions, groups } = useOptionGroupStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: selectedGroup?.name || '',
    min_select: selectedGroup?.min_select ?? 0,
    max_select: selectedGroup?.max_select ?? 1,
    active: selectedGroup?.active ?? true,
  });

  const [optionRows, setOptionRows] = useState<OptionRow[]>(() => {
    if (selectedGroup?.options && selectedGroup.options.length > 0) {
      return selectedGroup.options.map(opt => ({
        tempId: generateTempId(),
        name: opt.name,
        additional_price: opt.additional_price > 0 ? String(opt.additional_price) : '',
      }));
    }
    return [{ tempId: generateTempId(), name: '', additional_price: '' }];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const focusNameInput = useCallback((index: number) => {
    setTimeout(() => {
      const el = nameInputRefs.current.get(index);
      el?.focus();
    }, 50);
  }, []);

  const addRow = useCallback(() => {
    const newRow: OptionRow = { tempId: generateTempId(), name: '', additional_price: '' };
    setOptionRows(prev => [...prev, newRow]);
  }, []);

  useEffect(() => {
    if (optionRows.length > 0) {
      const lastIndex = optionRows.length - 1;
      const last = optionRows[lastIndex];
      if (last.name === '' && last.additional_price === '') {
        focusNameInput(lastIndex);
      }
    }
  }, [optionRows.length, focusNameInput]);

  const updateRow = (tempId: string, field: 'name' | 'additional_price', value: string) => {
    setOptionRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
    if (errors.options) setErrors(prev => ({ ...prev, options: '' }));
  };

  const removeRow = (tempId: string) => {
    setOptionRows(prev => {
      const filtered = prev.filter(r => r.tempId !== tempId);
      return filtered.length === 0
        ? [{ tempId: generateTempId(), name: '', additional_price: '' }]
        : filtered;
    });
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, index: number, field: 'name' | 'additional_price') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name') {
        const priceInput = e.currentTarget.parentElement?.parentElement?.querySelector<HTMLInputElement>('input[type="number"]');
        priceInput?.focus();
      } else if (field === 'additional_price') {
        if (index === optionRows.length - 1) {
          addRow();
        } else {
          focusNameInput(index + 1);
        }
      }
    }

    if (e.key === 'Tab' && !e.shiftKey && field === 'additional_price' && index === optionRows.length - 1) {
      e.preventDefault();
      addRow();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOptionRows(prev => {
      const oldIndex = prev.findIndex(r => r.tempId === active.id);
      const newIndex = prev.findIndex(r => r.tempId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const normalizedName = normalizeText(formData.name);

    if (!normalizedName) {
      newErrors.name = 'El nombre es requerido';
    } else if (normalizedName.length > 100) {
      newErrors.name = 'El nombre no puede exceder los 100 caracteres';
    } else {
      const isDuplicate = groups.some(group =>
        group.id !== selectedGroup?.id &&
        group.name.toLowerCase() === normalizedName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = 'Ya existe un grupo con este nombre';
      }
    }

    if (formData.min_select < 0) {
      newErrors.min_select = 'No puede ser negativo';
    }
    if (formData.max_select < 1) {
      newErrors.max_select = 'Debe ser al menos 1';
    }
    if (formData.min_select > formData.max_select) {
      newErrors.min_select = 'No puede ser mayor que el maximo';
    }

    const validOptions = optionRows.filter(r => r.name.trim() !== '');
    const optionNames = validOptions.map(r => normalizeText(r.name).toLowerCase());
    const hasDuplicateOptions = new Set(optionNames).size !== optionNames.length;
    if (hasDuplicateOptions) {
      newErrors.options = 'Hay opciones con nombres duplicados';
    }

    for (const row of validOptions) {
      const price = parseFloat(row.additional_price) || 0;
      if (price < 0) {
        newErrors.options = 'Los precios no pueden ser negativos';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const normalizedName = normalizeText(formData.name);

      const validOptions: OptionInput[] = optionRows
        .filter(r => r.name.trim() !== '')
        .map(r => ({
          name: normalizeText(r.name),
          additional_price: parseFloat(r.additional_price) || 0,
        }));

      await saveGroupWithOptions({
        groupId: selectedGroup?.id ?? null,
        name: normalizedName,
        min_select: formData.min_select,
        max_select: formData.max_select,
        active: formData.active,
        options: validOptions,
      });

      toast({
        title: selectedGroup ? 'Grupo actualizado' : 'Grupo creado',
        description: selectedGroup
          ? 'El grupo y sus opciones se han actualizado exitosamente'
          : 'El grupo y sus opciones se han creado exitosamente',
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar el grupo',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectionDescription = () => {
    const { min_select, max_select } = formData;
    if (min_select === 0 && max_select === 1) return 'El cliente puede seleccionar hasta 1 opcion (opcional)';
    if (min_select === 1 && max_select === 1) return 'El cliente debe seleccionar exactamente 1 opcion (requerido)';
    if (min_select === 0 && max_select > 1) return `El cliente puede seleccionar hasta ${max_select} opciones (opcional)`;
    if (min_select > 0 && max_select > 1 && min_select < max_select) return `El cliente debe seleccionar entre ${min_select} y ${max_select} opciones`;
    if (min_select > 0 && min_select === max_select && max_select > 1) return `El cliente debe seleccionar exactamente ${max_select} opciones`;
    return '';
  };

  const validOptionCount = optionRows.filter(r => r.name.trim() !== '').length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedGroup ? 'Editar Grupo de Opciones' : 'Nuevo Grupo de Opciones'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-hidden">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Grupo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                className={errors.name ? 'border-red-500' : ''}
                maxLength={100}
                placeholder="Ej: Salsas, Tamano, Extras"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              {formData.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Se guardara como: "{normalizeText(formData.name)}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_select">Seleccion Minima</Label>
                <Input
                  type="number"
                  id="min_select"
                  value={formData.min_select}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, min_select: parseInt(e.target.value) || 0 }));
                    if (errors.min_select) setErrors(prev => ({ ...prev, min_select: '' }));
                  }}
                  min="0"
                  className={errors.min_select ? 'border-red-500' : ''}
                />
                {errors.min_select && <p className="text-sm text-red-500">{errors.min_select}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">0 = opcional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_select">Seleccion Maxima</Label>
                <Input
                  type="number"
                  id="max_select"
                  value={formData.max_select}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, max_select: parseInt(e.target.value) || 1 }));
                    if (errors.max_select) setErrors(prev => ({ ...prev, max_select: '' }));
                  }}
                  min="1"
                  className={errors.max_select ? 'border-red-500' : ''}
                />
                {errors.max_select && <p className="text-sm text-red-500">{errors.max_select}</p>}
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{getSelectionDescription()}</p>
            </div>

            {selectedGroup && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20 dark:bg-darkbg-lighter"
                />
                <Label htmlFor="active">Grupo Activo</Label>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-darkbg" />

          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary dark:text-secondary" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Contenido del Grupo
                </span>
                {validOptionCount > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({validOptionCount} {validOptionCount === 1 ? 'opcion' : 'opciones'})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>Nombre</span>
                <span>Precio</span>
              </div>
            </div>

            {errors.options && (
              <p className="text-sm text-red-500">{errors.options}</p>
            )}

            <div className="overflow-y-auto max-h-[260px] pr-1 space-y-2 scrollbar-thin">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={optionRows.map(r => r.tempId)}
                  strategy={verticalListSortingStrategy}
                >
                  {optionRows.map((row, index) => (
                    <SortableOptionRow
                      key={row.tempId}
                      row={row}
                      index={index}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                      onKeyDown={handleRowKeyDown}
                      nameRef={(el) => {
                        if (el) nameInputRefs.current.set(index, el);
                        else nameInputRefs.current.delete(index);
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-darkbg hover:border-primary/40 dark:hover:border-secondary/40 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Opcion
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-darkbg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg-darker transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Todo'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
