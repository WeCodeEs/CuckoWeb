import { Search, Plus, RefreshCw, Settings } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Input } from '../ui/input';
import SortableGroupRow from './SortableGroupRow';
import type { useOptionGroupManager } from './useOptionGroupManager';

type OptionGroupManager = ReturnType<typeof useOptionGroupManager>;

interface OptionsTabProps {
  manager: OptionGroupManager;
}

export default function OptionsTab({ manager }: OptionsTabProps) {
  const {
    selectedGroups,
    loadingOptions,
    optionSearch,
    setOptionSearch,
    enabledGroups,
    availableGroups,
    setIsGroupModalOpen,
    handleGroupToggle,
    handleOptionToggle,
    handlePriceOverride,
    handleGroupSortDragEnd,
    handleMoveGroup,
    refreshGroups,
  } = manager;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hasNoResults = enabledGroups.length === 0 && availableGroups.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grupos de Opciones</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona los grupos de opciones disponibles para este producto</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshGroups}
            disabled={loadingOptions}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
            title="Recargar opciones"
          >
            <RefreshCw className={`w-5 h-5 ${loadingOptions ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Grupo
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar grupos u opciones..."
          value={optionSearch}
          onChange={(e) => setOptionSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto">
        {loadingOptions ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando opciones...</p>
          </div>
        ) : hasNoResults ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {optionSearch ? 'No se encontraron grupos' : 'No hay grupos de opciones disponibles'}
            </p>
          </div>
        ) : (
          <>
            {enabledGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Grupos asignados
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    (arrastra o usa flechas para reordenar)
                  </span>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleGroupSortDragEnd}
                >
                  <SortableContext
                    items={enabledGroups.map(g => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {enabledGroups.map((group, index) => (
                        <SortableGroupRow
                          key={group.id}
                          group={group}
                          groupState={selectedGroups[group.id]}
                          isFirst={index === 0}
                          isLast={index === enabledGroups.length - 1}
                          onToggle={handleGroupToggle}
                          onOptionToggle={handleOptionToggle}
                          onPriceOverride={handlePriceOverride}
                          onMove={handleMoveGroup}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {availableGroups.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Grupos disponibles
                </h4>
                <div className="space-y-3">
                  {availableGroups.map(group => (
                    <div
                      key={group.id}
                      className="border rounded-lg transition-all border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`group-${group.id}`}
                              checked={false}
                              onChange={() => handleGroupToggle(group.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
                            />
                            <div>
                              <label htmlFor={`group-${group.id}`} className="font-medium text-gray-900 dark:text-white cursor-pointer">
                                {group.name}
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Min: {group.min_select} | Max: {group.max_select} | {group.options.filter(o => o.active).length} opciones
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
