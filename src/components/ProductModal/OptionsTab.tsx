import { Search, Plus, RefreshCw, Settings } from 'lucide-react';
import { Input } from '../ui/input';
import { formatCurrency } from '../../utils/formatCurrency';
import type { SelectedGroupState } from './types';
import type { OptionGroup } from '../../stores/optionGroupStore';
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
    filteredGroups,
    setIsGroupModalOpen,
    handleGroupToggle,
    handleOptionToggle,
    handlePriceOverride,
    refreshGroups,
  } = manager;

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

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {loadingOptions ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando opciones...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {optionSearch ? 'No se encontraron grupos' : 'No hay grupos de opciones disponibles'}
            </p>
          </div>
        ) : (
          filteredGroups.map(group => {
            const groupState = selectedGroups[group.id];
            const isGroupEnabled = groupState?.enabled || false;
            const activeOptions = group.options.filter(o => o.active);

            return (
              <div
                key={group.id}
                className={`border rounded-lg transition-all ${
                  isGroupEnabled
                    ? 'border-primary/30 dark:border-secondary/30 bg-primary/5 dark:bg-secondary/5'
                    : 'border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={isGroupEnabled}
                        onChange={() => handleGroupToggle(group.id)}
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
                  </div>

                  {isGroupEnabled && activeOptions.length > 0 && (
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
                                    onChange={() => handleOptionToggle(group.id, option.id, option)}
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
                                        handlePriceOverride(
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
          })
        )}
      </div>
    </div>
  );
}
