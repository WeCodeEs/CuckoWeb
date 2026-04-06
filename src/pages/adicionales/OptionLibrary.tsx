import { useEffect, useState } from 'react';
import { Plus, CircleAlert as AlertCircle, Search, Package, Layers, Pencil } from 'lucide-react';
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

  const handleToggleGroupActive = async (group: OptionGroup) => {
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar grupos u opciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
        >
          <option value="all">Todos los grupos</option>
          <option value="required">Solo obligatorios</option>
          <option value="optional">Solo opcionales</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo de Seleccion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Opciones
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                {filteredGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
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
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {group.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isRequired(group)
                          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                      }`}>
                        {getSelectionLabel(group)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {group.options.length === 0 ? (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          Sin opciones
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {group.options.slice(0, 3).map((option) => (
                            <span
                              key={option.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                option.active
                                  ? 'bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300'
                                  : 'bg-gray-50 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 line-through'
                              }`}
                            >
                              {option.name}
                              {option.additional_price > 0 && (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  +{formatCurrency(option.additional_price)}
                                </span>
                              )}
                            </span>
                          ))}
                          {group.options.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 py-0.5">
                              +{group.options.length - 3} mas
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {group.product_count !== undefined && group.product_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Package className="w-3.5 h-3.5" />
                          {group.product_count}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleGroupActive(group)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          group.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={group.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {group.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredGroups.length === 0 && !loading && (
            <div className="text-center py-12">
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
