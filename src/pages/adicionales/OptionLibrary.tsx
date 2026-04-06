import { useEffect, useState } from 'react';
import { Plus, Pencil, CircleAlert as AlertCircle, Search, ChevronRight, GripVertical, X, Check, ListChecks } from 'lucide-react';
import { useOptionGroupStore, type OptionGroup, type OptionInput } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
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

interface OptionRow {
  tempId: string;
  originalId?: number;
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
}: {
  row: OptionRow;
  index: number;
  onUpdate: (tempId: string, field: 'name' | 'additional_price', value: string) => void;
  onRemove: (tempId: string) => void;
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

export default function OptionLibrary() {
  const {
    groups,
    loading,
    error,
    fetchGroups,
    toggleGroupActive,
    saveGroupWithOptions,
  } = useOptionGroupStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<OptionGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    min_select: 0,
    max_select: 1,
    active: true,
  });

  const [optionRows, setOptionRows] = useState<OptionRow[]>([
    { tempId: generateTempId(), name: '', additional_price: '' }
  ]);

  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroup) {
      setFormData({
        name: selectedGroup.name,
        min_select: selectedGroup.min_select,
        max_select: selectedGroup.max_select,
        active: selectedGroup.active,
      });
      setOptionRows(
        selectedGroup.options.length > 0
          ? selectedGroup.options.map(opt => ({
              tempId: generateTempId(),
              originalId: opt.id,
              name: opt.name,
              additional_price: opt.additional_price > 0 ? String(opt.additional_price) : '',
            }))
          : [{ tempId: generateTempId(), name: '', additional_price: '' }]
      );
      setIsCreating(false);
    } else if (isCreating) {
      setFormData({ name: '', min_select: 0, max_select: 1, active: true });
      setOptionRows([{ tempId: generateTempId(), name: '', additional_price: '' }]);
    }
    setFormErrors({});
  }, [selectedGroup, isCreating]);

  const handleToggleGroupActive = async (e: React.MouseEvent, group: OptionGroup) => {
    e.stopPropagation();
    const newStatus = !group.active;
    try {
      await toggleGroupActive(group.id, newStatus);
      if (selectedGroup?.id === group.id) {
        setSelectedGroup({ ...selectedGroup, active: newStatus });
      }
      toast({
        title: 'Estado actualizado',
        description: `Grupo ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.options.some(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSelectionText = (group: OptionGroup) => {
    const { min_select, max_select } = group;
    if (min_select === 0 && max_select === 1) return 'Opcional (hasta 1)';
    if (min_select === 1 && max_select === 1) return 'Requerido (1)';
    if (min_select === 0) return `Opcional (hasta ${max_select})`;
    if (min_select === max_select) return `Requerido (${max_select})`;
    return `${min_select} a ${max_select}`;
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

  const updateRow = (tempId: string, field: 'name' | 'additional_price', value: string) => {
    setOptionRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
    if (formErrors.options) setFormErrors(prev => ({ ...prev, options: '' }));
  };

  const removeRow = (tempId: string) => {
    setOptionRows(prev => {
      const filtered = prev.filter(r => r.tempId !== tempId);
      return filtered.length === 0
        ? [{ tempId: generateTempId(), name: '', additional_price: '' }]
        : filtered;
    });
  };

  const addRow = () => {
    setOptionRows(prev => [...prev, { tempId: generateTempId(), name: '', additional_price: '' }]);
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

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const normalizedName = normalizeText(formData.name);

      const validOptions: OptionInput[] = optionRows
        .filter(r => r.name.trim() !== '')
        .map(r => ({
          ...(r.originalId ? { id: r.originalId } : {}),
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

      setSelectedGroup(null);
      setIsCreating(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar el grupo';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedGroup(null);
    setIsCreating(false);
    setFormErrors({});
  };

  const handleCreateNew = () => {
    setSelectedGroup(null);
    setIsCreating(true);
  };

  const validOptionCount = optionRows.filter(r => r.name.trim() !== '').length;
  const showPanel = selectedGroup !== null || isCreating;

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar las opciones</p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchGroups()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Grupos de Opciones</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los grupos de opciones del sistema</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className={`flex flex-col bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden transition-all ${showPanel ? 'w-80 flex-shrink-0' : 'flex-1'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-darkbg">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-100 dark:bg-darkbg rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm ? 'No hay grupos que coincidan' : 'No hay grupos registrados'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroup(group); setIsCreating(false); }}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                      selectedGroup?.id === group.id
                        ? 'bg-primary/10 dark:bg-secondary/10 border-l-4 border-primary dark:border-secondary'
                        : 'hover:bg-gray-50 dark:hover:bg-darkbg/50'
                    } ${!group.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {group.name}
                          </h3>
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${group.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {group.options.length} {group.options.length === 1 ? 'opcion' : 'opciones'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {getSelectionText(group)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedGroup?.id === group.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {!showPanel && (
          <div className="flex-1 bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden flex items-center justify-center">
            <div className="text-center px-8 py-12 max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                <ListChecks className="w-8 h-8 text-primary dark:text-secondary" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Grupos de Opciones
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Selecciona un grupo de la lista para editarlo o crea uno nuevo
              </p>

              {groups.length > 0 && (
                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                  <div className="text-center">
                    <span className="block text-2xl font-semibold text-gray-900 dark:text-white">
                      {groups.filter(g => g.active).length}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      {groups.filter(g => g.active).length === 1 ? 'grupo activo' : 'grupos activos'}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-darkbg" />
                  <div className="text-center">
                    <span className="block text-2xl font-semibold text-gray-900 dark:text-white">
                      {groups.reduce((sum, g) => sum + g.options.length, 0)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      opciones totales
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
              >
                <Plus className="w-4 h-4" />
                Crear Nuevo Grupo
              </button>
            </div>
          </div>
        )}

        {showPanel && (
          <div className="flex-1 bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-darkbg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-primary dark:text-secondary" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {isCreating ? 'Nuevo Grupo' : 'Editar Grupo'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isCreating ? 'Crea un nuevo grupo de opciones' : `Editando: ${selectedGroup?.name}`}
                  </p>
                </div>
              </div>
              {selectedGroup && (
                <button
                  onClick={(e) => handleToggleGroupActive(e, selectedGroup)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedGroup.active
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {selectedGroup.active ? 'Activo' : 'Inactivo'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre del Grupo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ej: Salsas, Tamano, Extras"
                  maxLength={100}
                  className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-darkbg'} bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white`}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Seleccion Minima
                  </label>
                  <input
                    type="number"
                    value={formData.min_select}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, min_select: parseInt(e.target.value) || 0 }));
                      if (formErrors.min_select) setFormErrors(prev => ({ ...prev, min_select: '' }));
                    }}
                    min="0"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.min_select ? 'border-red-500' : 'border-gray-200 dark:border-darkbg'} bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white`}
                  />
                  {formErrors.min_select && <p className="mt-1 text-sm text-red-500">{formErrors.min_select}</p>}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">0 = opcional</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Seleccion Maxima
                  </label>
                  <input
                    type="number"
                    value={formData.max_select}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, max_select: parseInt(e.target.value) || 1 }));
                      if (formErrors.max_select) setFormErrors(prev => ({ ...prev, max_select: '' }));
                    }}
                    min="1"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.max_select ? 'border-red-500' : 'border-gray-200 dark:border-darkbg'} bg-white dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white`}
                  />
                  {formErrors.max_select && <p className="mt-1 text-sm text-red-500">{formErrors.max_select}</p>}
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{getSelectionDescription()}</p>
              </div>

              <div className="border-t border-gray-100 dark:border-darkbg pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary dark:text-secondary" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Opciones</span>
                    {validOptionCount > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-darkbg px-2 py-0.5 rounded-full">
                        {validOptionCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                    <span>Nombre</span>
                    <span>Precio</span>
                  </div>
                </div>

                {formErrors.options && (
                  <p className="mb-3 text-sm text-red-500">{formErrors.options}</p>
                )}

                <div className="space-y-2 mb-3">
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
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-darkbg flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
