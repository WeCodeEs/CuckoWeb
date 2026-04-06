import { useEffect, useState } from 'react';
import { Plus, CircleAlert as AlertCircle, Search, Package, Layers, Pencil, ChevronRight, CircleDot, SquareCheck as CheckSquare } from 'lucide-react';
import { useOptionGroupStore, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';

type FilterType = 'all' | 'required' | 'optional';

export default function OptionLibrary() {
  const {
    groups,
    loading,
    error,
    fetchGroups,
    setSelectedGroup,
    setIsGroupModalOpen,
    toggleGroupActive,
  } = useOptionGroupStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleEditGroup = (group: OptionGroup) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleToggleGroupActive = async (e: React.MouseEvent, group: OptionGroup) => {
    e.stopPropagation();
    const newStatus = !group.active;
    try {
      await toggleGroupActive(group.id, newStatus);
      toast({
        title: 'Estado actualizado',
        description: `Grupo ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al actualizar el estado',
      });
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.options.some(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === 'required') return matchesSearch && group.min_select > 0;
    if (filter === 'optional') return matchesSearch && group.min_select === 0;
    return matchesSearch;
  });

  const getSelectionInfo = (group: OptionGroup) => {
    const { min_select, max_select } = group;
    const isRadio = max_select === 1;

    let label = '';
    if (min_select === 0 && max_select === 1) label = 'Selecciona hasta 1';
    else if (min_select === 1 && max_select === 1) label = 'Selecciona 1';
    else if (min_select === 0 && max_select > 1) label = `Selecciona hasta ${max_select}`;
    else if (min_select > 0 && min_select === max_select) label = `Selecciona ${max_select}`;
    else if (min_select > 0 && max_select > 1) label = `Selecciona ${min_select} a ${max_select}`;
    else label = `${min_select}-${max_select}`;

    return { isRadio, label };
  };

  const isRequired = (group: OptionGroup) => group.min_select > 0;

  const stats = {
    total: groups.length,
    required: groups.filter(g => g.min_select > 0).length,
    optional: groups.filter(g => g.min_select === 0).length,
  };

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Grupos de Opciones</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Personaliza tus productos con opciones adicionales</p>
        </div>
        <button
          onClick={() => {
            setSelectedGroup(null);
            setIsGroupModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'all'
              ? 'border-primary dark:border-secondary bg-primary/5 dark:bg-secondary/5'
              : 'border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </button>
        <button
          onClick={() => setFilter('required')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'required'
              ? 'border-primary dark:border-secondary bg-primary/5 dark:bg-secondary/5'
              : 'border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.required}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Obligatorios</p>
        </button>
        <button
          onClick={() => setFilter('optional')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'optional'
              ? 'border-primary dark:border-secondary bg-primary/5 dark:bg-secondary/5'
              : 'border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.optional}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Opcionales</p>
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar grupos u opciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-darkbg-lighter rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-darkbg rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-darkbg rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-darkbg/50 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const { isRadio, label } = getSelectionInfo(group);
            const isExpanded = expandedGroup === group.id;

            return (
              <div
                key={group.id}
                className={`bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden transition-all ${
                  !group.active ? 'opacity-50' : ''
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-darkbg/30 transition-colors"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${
                      isRequired(group)
                        ? 'bg-amber-100 dark:bg-amber-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      {isRadio ? (
                        <CircleDot className={`w-5 h-5 ${
                          isRequired(group)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      ) : (
                        <CheckSquare className={`w-5 h-5 ${
                          isRequired(group)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {group.name}
                        </h3>
                        {isRequired(group) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                            Requerido
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {label}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {group.options.length} {group.options.length === 1 ? 'opcion' : 'opciones'}
                        </span>
                        {group.product_count !== undefined && group.product_count > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Package className="w-3.5 h-3.5" />
                              {group.product_count} {group.product_count === 1 ? 'producto' : 'productos'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleGroupActive(e, group)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          group.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {group.active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGroup(group);
                        }}
                        className="p-2 text-gray-400 hover:text-primary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-gray-100 dark:border-darkbg pt-4">
                      {group.options.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-darkbg/30 rounded-lg">
                          <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 dark:text-gray-500">Sin opciones configuradas</p>
                          <button
                            onClick={() => handleEditGroup(group)}
                            className="mt-2 text-sm text-primary dark:text-secondary hover:underline"
                          >
                            Agregar opciones
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {group.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                option.active
                                  ? 'bg-gray-50 dark:bg-darkbg/30'
                                  : 'bg-gray-50/50 dark:bg-darkbg/20'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  option.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                                <span className={`text-sm ${
                                  option.active
                                    ? 'text-gray-700 dark:text-gray-300'
                                    : 'text-gray-400 dark:text-gray-500 line-through'
                                }`}>
                                  {option.name}
                                </span>
                              </div>
                              <span className={`text-sm font-medium ${
                                option.additional_price > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {option.additional_price > 0
                                  ? `+${formatCurrency(option.additional_price)}`
                                  : 'Sin costo'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="mt-3 w-full py-2 text-sm font-medium text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                      >
                        Editar grupo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredGroups.length === 0 && !loading && (
            <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-12 text-center">
              <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {searchTerm ? 'Sin resultados' : 'Sin grupos de opciones'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Intenta con otros terminos de busqueda'
                  : 'Crea grupos de opciones para personalizar tus productos'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setIsGroupModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear grupo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
