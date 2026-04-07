import { useEffect, useState, useMemo } from 'react';
import { Search, CircleAlert as AlertCircle } from 'lucide-react';
import { useOptionGroupStore, type Option, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import SkeletonTable from '../../components/skeletons/SkeletonTable';

interface FlatOption extends Option {
  groupName: string;
  groupActive: boolean;
}

export default function OptionsControl() {
  const { groups, loading, error, fetchGroups, toggleOptionActive } = useOptionGroupStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const flatOptions = useMemo<FlatOption[]>(() => {
    const result: FlatOption[] = [];
    groups.forEach((group: OptionGroup) => {
      group.options.forEach((option: Option) => {
        result.push({ ...option, groupName: group.name, groupActive: group.active });
      });
    });
    return result.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flatOptions.filter(o => {
      const matchSearch = !q || o.name.toLowerCase().includes(q) || o.groupName.toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ||
        (filter === 'active' && o.active) ||
        (filter === 'inactive' && !o.active);
      return matchSearch && matchFilter;
    });
  }, [flatOptions, search, filter]);

  const stats = useMemo(() => ({
    total: flatOptions.length,
    active: flatOptions.filter(o => o.active).length,
    inactive: flatOptions.filter(o => !o.active).length,
    groups: groups.length,
  }), [flatOptions, groups]);

  const handleToggle = async (option: FlatOption) => {
    if (togglingIds.has(option.id)) return;
    setTogglingIds(prev => new Set(prev).add(option.id));
    try {
      await toggleOptionActive(option.id, !option.active);
      toast({
        title: !option.active ? 'Opción activada' : 'Opción desactivada',
        description: `"${option.name}" ahora está ${!option.active ? 'activa' : 'inactiva'}.`,
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado.', variant: 'destructive' });
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(option.id); return n; });
    }
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
      <div>
        <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Control de Opciones</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Activa o desactiva opciones individuales del sistema</p>
      </div>

      {!loading && flatOptions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">opciones</p>
          </div>
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Activas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">disponibles</p>
          </div>
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Inactivas</p>
            <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{stats.inactive}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">desactivadas</p>
          </div>
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Grupos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.groups}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">grupos registrados</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por opción o grupo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={4} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Opción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Adicional
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                {filtered.map((option) => (
                  <tr
                    key={option.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {option.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {option.groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                      {option.additional_price > 0 ? `+${formatCurrency(option.additional_price)}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggle(option)}
                        disabled={togglingIds.has(option.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          option.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={option.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {option.active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {search || filter !== 'all' ? 'No hay opciones que coincidan con la búsqueda' : 'No hay opciones registradas'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
