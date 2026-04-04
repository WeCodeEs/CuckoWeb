import { useEffect, useState } from 'react';
import { Plus, CircleAlert as AlertCircle, Search, Package, Layers, Pencil, CircleDot, ToggleLeft } from 'lucide-react';
import { useOptionGroupStore, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import SkeletonTable from '../../components/skeletons/SkeletonTable';

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
    if (min_select === 0 && max_select === 1) return 'Opcional - hasta 1';
    if (min_select === 1 && max_select === 1) return 'Obligatorio - exactamente 1';
    if (min_select === 0 && max_select > 1) return `Opcional - hasta ${max_select}`;
    if (min_select > 0 && min_select === max_select) return `Obligatorio - exactamente ${max_select}`;
    if (min_select > 0 && max_select > 1) return `Obligatorio - ${min_select} a ${max_select}`;
    return `Min: ${min_select} | Max: ${max_select}`;
  };

  const isRequired = (group: OptionGroup) => group.min_select > 0;

  const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'required', label: 'Obligatorios' },
    { key: 'optional', label: 'Opcionales' },
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Libreria de Opciones</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los grupos de opciones y sus valores</p>
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar grupos u opciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-darkbg rounded-lg p-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-darkbg-lighter text-primary dark:text-secondary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} hasActions />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleEditGroup(group)}
              className={`bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                isRequired(group)
                  ? 'border-l-primary dark:border-l-secondary'
                  : 'border-l-gray-300 dark:border-l-gray-600'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      isRequired(group)
                        ? 'bg-primary/10 dark:bg-secondary/10'
                        : 'bg-gray-100 dark:bg-darkbg'
                    }`}>
                      <Layers className={`w-4 h-4 ${
                        isRequired(group)
                          ? 'text-primary dark:text-secondary'
                          : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{group.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {group.max_select === 1 ? (
                          <CircleDot className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ToggleLeft className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getSelectionLabel(group)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleGroupActive(e, group)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        group.active
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {group.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group);
                      }}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  {group.options.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin opciones configuradas</p>
                  ) : (
                    <>
                      {group.options.slice(0, 4).map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between py-1 px-2.5 rounded-md bg-gray-50 dark:bg-darkbg/50"
                        >
                          <span className={`text-xs ${option.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                            {option.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {option.additional_price > 0
                              ? `+${formatCurrency(option.additional_price)}`
                              : 'Gratis'}
                          </span>
                        </div>
                      ))}
                      {group.options.length > 4 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                          +{group.options.length - 4} mas
                        </p>
                      )}
                    </>
                  )}
                </div>

                {group.product_count !== undefined && group.product_count > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-darkbg">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Package className="w-3 h-3" />
                      {group.product_count} {group.product_count === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="col-span-full bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-12 text-center">
              <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No hay grupos que coincidan con la busqueda' : 'No hay grupos de opciones registrados'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setIsGroupModalOpen(true);
                  }}
                  className="mt-4 text-sm text-primary dark:text-secondary hover:underline"
                >
                  Crear primer grupo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
