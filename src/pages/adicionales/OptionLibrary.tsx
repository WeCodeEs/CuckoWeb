import { useEffect, useState } from 'react';
import { Plus, CircleAlert as AlertCircle, Search, Package, Layers, Pencil, CircleDot, ToggleLeft, SquareCheck as CheckSquare, Square, ChevronRight } from 'lucide-react';
import { useOptionGroupStore, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import SkeletonCard from '../../components/skeletons/SkeletonCard';

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

  const getSelectionLabel = (group: OptionGroup) => {
    const { min_select, max_select } = group;
    if (min_select === 0 && max_select === 1) return 'Opcional';
    if (min_select === 1 && max_select === 1) return 'Obligatorio';
    if (min_select === 0 && max_select > 1) return `Hasta ${max_select}`;
    if (min_select > 0 && min_select === max_select) return `Exactamente ${max_select}`;
    if (min_select > 0 && max_select > 1) return `${min_select} a ${max_select}`;
    return `${min_select}-${max_select}`;
  };

  const isRequired = (group: OptionGroup) => group.min_select > 0;

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: groups.length },
    { key: 'required', label: 'Obligatorios', count: groups.filter(g => g.min_select > 0).length },
    { key: 'optional', label: 'Opcionales', count: groups.filter(g => g.min_select === 0).length },
  ];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grupos de Opciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} configurados
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedGroup(null);
            setIsGroupModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-all shadow-lg shadow-primary/25 dark:shadow-secondary/25 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-secondary/30 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
        </button>
      </div>

      <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-soft dark:shadow-dark p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre de grupo u opcion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-darkbg rounded-xl">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === tab.key
                    ? 'bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                  filter === tab.key
                    ? 'bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleEditGroup(group)}
              className={`group bg-white dark:bg-darkbg-lighter rounded-2xl shadow-soft dark:shadow-dark overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border ${
                !group.active
                  ? 'border-gray-200 dark:border-gray-700 opacity-60'
                  : isRequired(group)
                    ? 'border-primary/20 dark:border-secondary/20'
                    : 'border-gray-100 dark:border-darkbg'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                      isRequired(group)
                        ? 'bg-primary/10 dark:bg-secondary/10 group-hover:bg-primary/15 dark:group-hover:bg-secondary/15'
                        : 'bg-gray-100 dark:bg-darkbg group-hover:bg-gray-200 dark:group-hover:bg-darkbg/80'
                    }`}>
                      {group.max_select === 1 ? (
                        <CircleDot className={`w-5 h-5 ${
                          isRequired(group)
                            ? 'text-primary dark:text-secondary'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      ) : (
                        <CheckSquare className={`w-5 h-5 ${
                          isRequired(group)
                            ? 'text-primary dark:text-secondary'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isRequired(group)
                            ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        }`}>
                          {isRequired(group) ? 'Requerido' : 'Opcional'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {getSelectionLabel(group)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleGroupActive(e, group)}
                      className={`p-2 rounded-lg transition-colors ${
                        group.active
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={group.active ? 'Desactivar' : 'Activar'}
                    >
                      {group.active ? (
                        <ToggleLeft className="w-5 h-5 rotate-180" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {group.options.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <Square className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">Sin opciones</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Haz clic para agregar</p>
                    </div>
                  ) : (
                    <>
                      {group.options.slice(0, 3).map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                            option.active
                              ? 'bg-gray-50 dark:bg-darkbg/50 group-hover:bg-gray-100 dark:group-hover:bg-darkbg/70'
                              : 'bg-gray-50/50 dark:bg-darkbg/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              option.active
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                            <span className={`text-sm truncate ${
                              option.active
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-500 line-through'
                            }`}>
                              {option.name}
                            </span>
                          </div>
                          <span className={`text-sm font-medium flex-shrink-0 ml-2 ${
                            option.additional_price > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {option.additional_price > 0
                              ? `+${formatCurrency(option.additional_price)}`
                              : 'Gratis'}
                          </span>
                        </div>
                      ))}
                      {group.options.length > 3 && (
                        <button className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors">
                          Ver {group.options.length - 3} opciones mas
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {(group.product_count !== undefined && group.product_count > 0) && (
                <div className="px-5 py-3 bg-gray-50 dark:bg-darkbg/50 border-t border-gray-100 dark:border-darkbg">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    Vinculado a {group.product_count} {group.product_count === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="col-span-full">
              <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-soft dark:shadow-dark p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-darkbg rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'Sin resultados' : 'Sin grupos de opciones'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {searchTerm
                    ? `No encontramos grupos que coincidan con "${searchTerm}"`
                    : 'Crea tu primer grupo de opciones para personalizar tus productos'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setSelectedGroup(null);
                      setIsGroupModalOpen(true);
                    }}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-all shadow-lg shadow-primary/25 dark:shadow-secondary/25"
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
    </div>
  );
}
