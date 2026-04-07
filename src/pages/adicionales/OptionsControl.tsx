import { useEffect, useState, useMemo } from 'react';
import { Search, CircleAlert as AlertCircle } from 'lucide-react';
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
    return result.sort((a, b) => a.name.localeCompare(b.name));
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

  const activeCount = flatOptions.filter(o => o.active).length;
  const inactiveCount = flatOptions.filter(o => !o.active).length;
  const ratio = flatOptions.length ? Math.round((activeCount / flatOptions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="mb-14">
          <p className="text-xs tracking-[0.25em] uppercase text-[#555] mb-3">Panel de disponibilidad</p>
          <h1 className="text-5xl font-black tracking-tight leading-none text-white">
            Opciones
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden mb-12">
          <div className="bg-[#0a0a0a] px-8 py-6">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">Total</p>
            <p className="text-4xl font-black text-white tabular-nums">{flatOptions.length}</p>
          </div>
          <div className="bg-[#0a0a0a] px-8 py-6">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">Activas</p>
            <p className="text-4xl font-black text-emerald-400 tabular-nums">{activeCount}</p>
          </div>
          <div className="bg-[#0a0a0a] px-8 py-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">Inactivas</p>
                <p className="text-4xl font-black text-[#555] tabular-nums">{inactiveCount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-2">Disponibilidad</p>
                <p className="text-2xl font-black text-white tabular-nums">{ratio}<span className="text-base font-normal text-[#555]">%</span></p>
              </div>
            </div>
            <div className="mt-3 h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${ratio}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
            <input
              type="text"
              placeholder="Buscar opción o grupo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#111] border border-white/5 rounded-xl text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  filter === f
                    ? 'bg-white text-black'
                    : 'text-[#555] hover:text-white'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="py-24 text-center">
            <div className="inline-flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#333] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="py-8 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-24 text-center text-[#333] text-sm">
            {search || filter !== 'all' ? 'Sin resultados.' : 'No hay opciones registradas.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-px">
            {filtered.map((option, i) => (
              <div
                key={option.id}
                className={`group flex items-center gap-6 px-6 py-4 rounded-xl transition-all duration-200 ${
                  option.active
                    ? 'hover:bg-white/[0.03]'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                <span className="text-[#222] text-xs tabular-nums w-5 text-right flex-shrink-0 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors ${
                    option.active ? 'text-white' : 'text-[#444] line-through'
                  }`}>
                    {option.name}
                  </p>
                </div>

                <span className="text-[10px] tracking-widest uppercase text-[#333] font-medium flex-shrink-0 hidden sm:block w-32 truncate text-right">
                  {option.groupName}
                </span>

                <span className={`text-xs tabular-nums flex-shrink-0 w-16 text-right font-mono ${
                  option.active ? 'text-[#555]' : 'text-[#2a2a2a]'
                }`}>
                  {option.additional_price > 0 ? `+${formatCurrency(option.additional_price)}` : '—'}
                </span>

                <button
                  onClick={() => handleToggle(option)}
                  disabled={togglingIds.has(option.id)}
                  className={`flex-shrink-0 w-10 h-6 rounded-full relative transition-all duration-300 focus:outline-none disabled:cursor-not-allowed ${
                    option.active ? 'bg-emerald-500' : 'bg-[#1a1a1a] border border-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-300 ${
                      option.active
                        ? 'left-[calc(100%-1.375rem)] bg-white'
                        : 'left-0.5 bg-[#333]'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-8 text-[#222] text-xs text-right tabular-nums">
            {filtered.length} de {flatOptions.length} opciones
          </p>
        )}
      </div>
    </div>
  );
}
