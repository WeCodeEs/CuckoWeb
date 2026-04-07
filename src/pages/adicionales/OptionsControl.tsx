import { useEffect, useState, useMemo } from 'react';
import { Search, ToggleLeft, ToggleRight, CircleAlert as AlertCircle } from 'lucide-react';
import { useOptionGroupStore, type Option, type OptionGroup } from '../../stores/optionGroupStore';
import { useToast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../utils/formatCurrency';

interface FlatOption extends Option {
  groupName: string;
  groupActive: boolean;
}

export default function OptionsControl() {
  const { groups, loading, error, fetchGroups, toggleOptionActive } = useOptionGroupStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const flatOptions = useMemo<FlatOption[]>(() => {
    const result: FlatOption[] = [];
    groups.forEach((group: OptionGroup) => {
      group.options.forEach((option: Option) => {
        result.push({
          ...option,
          groupName: group.name,
          groupActive: group.active,
        });
      });
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flatOptions;
    return flatOptions.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.groupName.toLowerCase().includes(q)
    );
  }, [flatOptions, search]);

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
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la opción.',
        variant: 'destructive',
      });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(option.id);
        return next;
      });
    }
  };

  const activeCount = flatOptions.filter(o => o.active).length;
  const inactiveCount = flatOptions.filter(o => !o.active).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control de Opciones</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Activa o desactiva opciones individuales sin perder su relación con el grupo.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-darkbg-dark rounded-xl border border-gray-200 dark:border-darkbg p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{flatOptions.length}</p>
        </div>
        <div className="bg-white dark:bg-darkbg-dark rounded-xl border border-gray-200 dark:border-darkbg p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-darkbg-dark rounded-xl border border-gray-200 dark:border-darkbg p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactivas</p>
          <p className="mt-1 text-2xl font-bold text-gray-400 dark:text-gray-500">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-darkbg-dark rounded-xl border border-gray-200 dark:border-darkbg overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-darkbg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por opción o grupo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Cargando opciones...
          </div>
        )}

        {error && !loading && (
          <div className="p-6 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
            {search ? 'No se encontraron opciones con ese criterio.' : 'No hay opciones registradas.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkbg">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                  Opción
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                  Grupo
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                  Precio adicional
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
              {filtered.map(option => (
                <tr
                  key={option.id}
                  className={`transition-colors ${
                    option.active
                      ? 'hover:bg-gray-50 dark:hover:bg-darkbg/50'
                      : 'bg-gray-50/60 dark:bg-darkbg/30 hover:bg-gray-100/60 dark:hover:bg-darkbg/50'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-medium ${option.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                      {option.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      option.groupActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-darkbg dark:text-gray-500'
                    }`}>
                      {option.groupName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm ${option.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                      {option.additional_price > 0 ? `+${formatCurrency(option.additional_price)}` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggle(option)}
                        disabled={togglingIds.has(option.id)}
                        title={option.active ? 'Desactivar opción' : 'Activar opción'}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          option.active
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            : 'border-gray-200 dark:border-darkbg bg-gray-100 dark:bg-darkbg text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-darkbg/80'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {option.active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Activa
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inactiva
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
