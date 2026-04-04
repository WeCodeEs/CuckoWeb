import { useEffect, useState } from 'react';
import { Plus, Pencil, CircleAlert as AlertCircle, Search, ChevronRight, Package, Layers } from 'lucide-react';
import { useOptionGroupStore, OptionGroup, Option } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatCurrency';
import SkeletonTable from '../../components/skeletons/SkeletonTable';

export default function OptionLibrary() {
  const {
    groups,
    loading,
    error,
    fetchGroups,
    setSelectedGroup,
    setSelectedOption,
    setIsGroupModalOpen,
    setIsOptionModalOpen,
    toggleGroupActive,
    toggleOptionActive,
  } = useOptionGroupStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleEditGroup = (group: OptionGroup) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleEditOption = (option: Option, group: OptionGroup) => {
    setSelectedGroup(group);
    setSelectedOption(option);
    setIsOptionModalOpen(true);
  };

  const handleAddOption = (group: OptionGroup) => {
    setSelectedGroup(group);
    setSelectedOption(null);
    setIsOptionModalOpen(true);
  };

  const handleToggleGroupActive = async (group: OptionGroup) => {
    const newStatus = !group.active;
    try {
      await toggleGroupActive(group.id, newStatus);
      toast({
        title: 'Estado actualizado',
        description: `Grupo ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar el estado',
      });
    }
  };

  const handleToggleOptionActive = async (option: Option) => {
    const newStatus = !option.active;
    try {
      await toggleOptionActive(option.id, newStatus);
      toast({
        title: 'Estado actualizado',
        description: `Opcion ${newStatus ? 'activada' : 'desactivada'} exitosamente`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar el estado',
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.options.some(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleExpand = (groupId: number) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
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
        <SkeletonTable rows={5} columns={5} hasActions />
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden"
            >
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-darkbg/50 transition-colors"
                onClick={() => toggleExpand(group.id)}
              >
                <div className="flex items-center gap-4">
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedGroupId === group.id ? 'rotate-90' : ''
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-secondary/10 rounded-lg">
                      <Layers className="w-5 h-5 text-primary dark:text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.options.length} opciones | Min: {group.min_select} | Max: {group.max_select}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {group.product_count !== undefined && group.product_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                      <Package className="w-3 h-3" />
                      {group.product_count} productos
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleGroupActive(group)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      group.active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {group.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                    title="Editar grupo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedGroupId === group.id && (
                <div className="border-t border-gray-100 dark:border-darkbg">
                  <div className="px-6 py-3 bg-gray-50/50 dark:bg-darkbg/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Opciones del grupo
                    </span>
                    <button
                      onClick={() => handleAddOption(group)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Opcion
                    </button>
                  </div>

                  {group.options.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No hay opciones en este grupo</p>
                      <button
                        onClick={() => handleAddOption(group)}
                        className="mt-2 text-sm text-primary dark:text-secondary hover:underline"
                      >
                        Agregar primera opcion
                      </button>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
                      <thead>
                        <tr className="bg-gray-50/30 dark:bg-darkbg/30">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Precio Adicional
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                        {group.options.map((option) => (
                          <tr
                            key={option.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                          >
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {option.name}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {option.additional_price > 0
                                ? `+${formatCurrency(option.additional_price)}`
                                : 'Sin costo'}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleToggleOptionActive(option)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                  option.active
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                              >
                                {option.active ? 'Activa' : 'Inactiva'}
                              </button>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleEditOption(option, group)}
                                className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-12 text-center">
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
