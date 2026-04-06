import { useEffect, useState } from 'react';
import { Plus, Pencil, CircleAlert as AlertCircle, Search } from 'lucide-react';
import { useOptionGroupStore, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import OptionGroupModal from '../../components/adicionales/OptionGroupModal';

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

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.options.some(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSelectionText = (group: OptionGroup) => {
    const { min_select, max_select } = group;
    if (min_select === 0 && max_select === 1) return 'Seleccionar hasta 1';
    if (min_select === 1 && max_select === 1) return 'Seleccionar 1';
    if (min_select === 0) return `Seleccionar hasta ${max_select}`;
    if (min_select === max_select) return `Seleccionar ${max_select}`;
    return `Seleccionar ${min_select} a ${max_select}`;
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
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los grupos de opciones del sistema</p>
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

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar grupos u opciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-darkbg-lighter rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-darkbg rounded w-32 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-darkbg/50 rounded w-24 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-darkbg/50 rounded" />
                <div className="h-4 bg-gray-100 dark:bg-darkbg/50 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden transition-all hover:shadow-md ${
                !group.active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <button
                    onClick={(e) => handleToggleGroupActive(e, group)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      group.active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={group.active ? 'Clic para desactivar' : 'Clic para activar'}
                  >
                    {group.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {getSelectionText(group)}
                  {group.min_select > 0 && <span className="text-amber-600 dark:text-amber-400 ml-1">*</span>}
                </p>

                {group.options.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin opciones</p>
                ) : (
                  <div className="space-y-1.5">
                    {group.options.slice(0, 5).map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className={`${
                          option.active
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500 line-through'
                        }`}>
                          {option.name}
                        </span>
                        {option.additional_price > 0 && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            +{formatCurrency(option.additional_price)}
                          </span>
                        )}
                      </div>
                    ))}
                    {group.options.length > 5 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                        +{group.options.length - 5} mas
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-darkbg/50 border-t border-gray-100 dark:border-darkbg flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {group.options.length} {group.options.length === 1 ? 'opcion' : 'opciones'}
                  {group.product_count !== undefined && group.product_count > 0 && (
                    <span className="ml-2">
                      · {group.product_count} {group.product_count === 1 ? 'producto' : 'productos'}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No hay grupos que coincidan con la busqueda' : 'No hay grupos de opciones registrados'}
              </p>
            </div>
          )}
        </div>
      )}

      {isGroupModalOpen && <OptionGroupModal onClose={() => setIsGroupModalOpen(false)} />}
    </div>
  );
}
