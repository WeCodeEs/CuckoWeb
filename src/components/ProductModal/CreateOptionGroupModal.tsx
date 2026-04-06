import { X, Plus, Check, ListChecks } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import SortableOptionRow from './SortableOptionRow';
import type { useOptionGroupManager } from './useOptionGroupManager';

type OptionGroupManager = ReturnType<typeof useOptionGroupManager>;

interface CreateOptionGroupModalProps {
  manager: OptionGroupManager;
}

export default function CreateOptionGroupModal({ manager }: CreateOptionGroupModalProps) {
  const {
    newGroupData,
    setNewGroupData,
    newGroupOptions,
    savingGroup,
    groupFormErrors,
    setGroupFormErrors,
    validNewGroupOptionCount,
    handleCloseGroupModal,
    updateGroupOptionRow,
    removeGroupOptionRow,
    addGroupOptionRow,
    handleGroupDragEnd,
    handleSaveNewGroup,
    getGroupSelectionDescription,
  } = manager;

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <Dialog open onOpenChange={handleCloseGroupModal}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-gray-200 dark:border-darkbg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary dark:text-secondary" />
              Nuevo Grupo de Opciones
            </DialogTitle>
            <button
              onClick={handleCloseGroupModal}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="newGroupName">Nombre del Grupo</Label>
            <Input
              id="newGroupName"
              value={newGroupData.name}
              onChange={(e) => {
                setNewGroupData(prev => ({ ...prev, name: e.target.value }));
                if (groupFormErrors.name) setGroupFormErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Ej: Salsas, Tamano, Extras"
              maxLength={100}
              className={`mt-1.5 ${groupFormErrors.name ? 'border-red-500' : ''}`}
            />
            {groupFormErrors.name && <p className="mt-1 text-sm text-red-500">{groupFormErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newGroupMinSelect">Seleccion Minima</Label>
              <Input
                type="number"
                id="newGroupMinSelect"
                value={newGroupData.min_select}
                onChange={(e) => {
                  setNewGroupData(prev => ({ ...prev, min_select: parseInt(e.target.value) || 0 }));
                  if (groupFormErrors.min_select) setGroupFormErrors(prev => ({ ...prev, min_select: '' }));
                }}
                min="0"
                className={`mt-1.5 ${groupFormErrors.min_select ? 'border-red-500' : ''}`}
              />
              {groupFormErrors.min_select && <p className="mt-1 text-sm text-red-500">{groupFormErrors.min_select}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">0 = opcional</p>
            </div>
            <div>
              <Label htmlFor="newGroupMaxSelect">Seleccion Maxima</Label>
              <Input
                type="number"
                id="newGroupMaxSelect"
                value={newGroupData.max_select}
                onChange={(e) => {
                  setNewGroupData(prev => ({ ...prev, max_select: parseInt(e.target.value) || 1 }));
                  if (groupFormErrors.max_select) setGroupFormErrors(prev => ({ ...prev, max_select: '' }));
                }}
                min="1"
                className={`mt-1.5 ${groupFormErrors.max_select ? 'border-red-500' : ''}`}
              />
              {groupFormErrors.max_select && <p className="mt-1 text-sm text-red-500">{groupFormErrors.max_select}</p>}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">{getGroupSelectionDescription()}</p>
          </div>

          <div className="border-t border-gray-100 dark:border-darkbg pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Opciones</span>
                {validNewGroupOptionCount > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-darkbg px-2 py-0.5 rounded-full">
                    {validNewGroupOptionCount}
                  </span>
                )}
              </div>
            </div>

            {groupFormErrors.options && (
              <p className="mb-3 text-sm text-red-500">{groupFormErrors.options}</p>
            )}

            <div className="space-y-2 mb-3">
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleGroupDragEnd}
              >
                <SortableContext
                  items={newGroupOptions.map(r => r.tempId)}
                  strategy={verticalListSortingStrategy}
                >
                  {newGroupOptions.map((row, index) => (
                    <SortableOptionRow
                      key={row.tempId}
                      row={row}
                      index={index}
                      onUpdate={updateGroupOptionRow}
                      onRemove={removeGroupOptionRow}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <button
              type="button"
              onClick={addGroupOptionRow}
              className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-200 dark:border-darkbg hover:border-primary/40 dark:hover:border-secondary/40 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Opcion
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg-darker flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCloseGroupModal}
            disabled={savingGroup}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveNewGroup}
            disabled={savingGroup}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {savingGroup ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Crear Grupo
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
