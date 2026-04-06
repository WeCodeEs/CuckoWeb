import { useEffect, useState } from 'react';
import {
  Plus,
  CircleAlert as AlertCircle,
  Search,
  Layers,
  Pencil,
  CircleDot,
  SquareCheck as CheckSquare,
  ToggleLeft,
  ToggleRight,
  Package,
  DollarSign,
  Asterisk
} from 'lucide-react';
import { useOptionGroupStore, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import OptionGroupModal from '../../components/adicionales/OptionGroupModal';

type FilterType = 'all' | 'required' | 'optional';

export default function OptionLibrary() {
  const {
    groups,
    loading,
    error,
    fetchGroups,
    setSelectedGroup,
    setIsGroupModalOpen,
    isGroupModalOpen,
    toggleGroupActive,
  } = useOptionGroupStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
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

  const getSelectionLabel = (group: OptionGroup) => {
    const { min_select, max_select } = group;
    if (min_select === 0 && max_select === 1) return 'Hasta 1';
    if (min_select === 1 && max_select === 1) return 'Exactamente 1';
    if (min_select === 0 && max_select > 1) return `Hasta ${max_select}`;
    if (min_select > 0 && min_select === max_select) return `Exactamente ${max_select}`;
    if (min_select > 0 && max_select > 1) return `${min_select} a ${max_select}`;
    return `${min_select}-${max_select}`;
  };

  const isRequired = (group: OptionGroup) => group.min_select > 0;
  const isRadio = (group: OptionGroup) => group.max_select === 1;

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
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-all shadow-lg shadow-primary/20 dark:shadow-secondary/20 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-secondary/30 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden group ${
            filter === 'all'
              ? 'border-primary dark:border-secondary bg-primary/5 dark:bg-secondary/5'
              : 'border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Layers className={`w-4 h-4 ${filter === 'all' ? 'text-primary dark:text-secondary' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </button>

        <button
          onClick={() => setFilter('required')}
          className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden group ${
            filter === 'required'
              ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/10'
              : 'border-gray-200 dark:border-darkbg hover:border-amber-200 dark:hover:border-amber-900 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Asterisk className={`w-4 h-4 ${filter === 'required' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Obligatorios</span>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.required}</p>
          </div>
        </button>

        <button
          onClick={() => setFilter('optional')}
          className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden group ${
            filter === 'optional'
              ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/10'
              : 'border-gray-200 dark:border-darkbg hover:border-teal-200 dark:hover:border-teal-900 bg-white dark:bg-darkbg-lighter'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className={`w-4 h-4 ${filter === 'optional' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Opcionales</span>
            </div>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{stats.optional}</p>
          </div>
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar grupos u opciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white transition-all"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-darkbg-lighter rounded-2xl p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-darkbg rounded-xl" />
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-darkbg rounded w-28 mb-2" />
                    <div className="h-3 bg-gray-100 dark:bg-darkbg/50 rounded w-20" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-100 dark:bg-darkbg/50 rounded-lg" />
                <div className="h-8 bg-gray-100 dark:bg-darkbg/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`group bg-white dark:bg-darkbg-lighter rounded-2xl shadow-soft dark:shadow-dark overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-xl hover:-translate-y-1 ${
                !group.active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl transition-colors ${
                      isRequired(group)
                        ? 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10'
                        : 'bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-900/10'
                    }`}>
                      {isRadio(group) ? (
                        <CircleDot className={`w-6 h-6 ${
                          isRequired(group)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-teal-600 dark:text-teal-400'
                        }`} />
                      ) : (
                        <CheckSquare className={`w-6 h-6 ${
                          isRequired(group)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-teal-600 dark:text-teal-400'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isRequired(group)
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                        }`}>
                          {isRequired(group) ? 'Requerido' : 'Opcional'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {getSelectionLabel(group)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {group.options.length === 0 ? (
                  <div className="py-6 text-center bg-gray-50 dark:bg-darkbg/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-darkbg">
                    <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin opciones</p>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="mt-2 text-xs font-medium text-primary dark:text-secondary hover:underline"
                    >
                      Agregar opciones
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {group.options.slice(0, 4).map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                          option.active
                            ? 'bg-gray-50 dark:bg-darkbg/40 hover:bg-gray-100 dark:hover:bg-darkbg/60'
                            : 'bg-gray-50/50 dark:bg-darkbg/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            option.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className={`text-sm truncate ${
                            option.active
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-400 dark:text-gray-500 line-through'
                          }`}>
                            {option.name}
                          </span>
                        </div>
                        {option.additional_price > 0 && (
                          <span className="flex items-center gap-0.5 text-sm font-medium text-green-600 dark:text-green-400 flex-shrink-0 ml-2">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(option.additional_price).replace('$', '')}
                          </span>
                        )}
                      </div>
                    ))}
                    {group.options.length > 4 && (
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="w-full py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary transition-colors"
                      >
                        +{group.options.length - 4} opciones mas
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-darkbg/50 border-t border-gray-100 dark:border-darkbg flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {group.options.length} {group.options.length === 1 ? 'opcion' : 'opciones'}
                  </span>
                  {group.product_count !== undefined && group.product_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {group.product_count} {group.product_count === 1 ? 'producto' : 'productos'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleToggleGroupActive(e, group)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      group.active
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-darkbg'
                    }`}
                    title={group.active ? 'Desactivar grupo' : 'Activar grupo'}
                  >
                    {group.active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary hover:bg-primary/10 dark:hover:bg-secondary/10 rounded-lg transition-colors"
                    title="Editar grupo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="col-span-full">
              <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-soft dark:shadow-dark p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-darkbg flex items-center justify-center">
                  <Layers className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {searchTerm ? 'Sin resultados' : 'Sin grupos de opciones'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchTerm
                    ? 'No se encontraron grupos que coincidan con tu busqueda'
                    : 'Los grupos de opciones te permiten personalizar productos con extras, tamanos, salsas y mas'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setSelectedGroup(null);
                      setIsGroupModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
                  >
                    <Plus className="w-4 h-4" />
                    Crear primer grupo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isGroupModalOpen && <OptionGroupModal onClose={() => setIsGroupModalOpen(false)} />}
    </div>
  );
}
