import { useEffect, useState, useMemo } from 'react';
import { Clock, Settings as SettingsIcon, Wrench, Calendar } from 'lucide-react';
import Switch from '../components/ui/switch';
import ConfirmationModal from '../components/ConfirmationModal';
import Banners from './Banners';
import { useSettingsStore, StoreSchedule } from '../stores/settingsStore';
import { useToast } from '../components/ui/use-toast';

type ConfirmationType = 'isOpen' | 'maintenanceMode' | 'scheduledOrders' | null;

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

const DEFAULT_SCHEDULE = {
  is_open: true,
  open_time: '08:00',
  close_time: '18:00',
};

export default function Settings() {
  const {
    isOpen,
    maintenanceMode,
    scheduledOrdersEnabled,
    schedules,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    updateSchedules,
  } = useSettingsStore();

  const { toast } = useToast();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const [draftSchedules, setDraftSchedules] = useState<Record<number, StoreSchedule>>({});
  const [savingHours, setSavingHours] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);

  // Initialize draft schedules from store
  useEffect(() => {
    const draft: Record<number, StoreSchedule> = {};
    DAYS_OF_WEEK.forEach((d) => {
      const existing = schedules.find((s) => s.day_of_week === d.id);
      if (existing) {
        draft[d.id] = { ...existing };
      } else {
        draft[d.id] = { day_of_week: d.id, ...DEFAULT_SCHEDULE };
      }
    });
    setDraftSchedules(draft);
  }, [schedules]);

  const isDirtyHours = useMemo(() => {
    if (schedules.length === 0 && Object.keys(draftSchedules).length > 0) return true;
    for (const d of DAYS_OF_WEEK) {
      const draft = draftSchedules[d.id];
      const orig = schedules.find((s) => s.day_of_week === d.id);
      if (!orig) return true;
      
      const cleanTime = (t: string) => t.substring(0, 5); // handle HH:MM:SS from DB
      
      if (
        draft.is_open !== orig.is_open ||
        cleanTime(draft.open_time) !== cleanTime(orig.open_time) ||
        cleanTime(draft.close_time) !== cleanTime(orig.close_time)
      ) {
        return true;
      }
    }
    return false;
  }, [schedules, draftSchedules]);

  useEffect(() => {
    fetchSettings().catch(() => {});
  }, [fetchSettings]);

  const handleToggleRequest = (type: ConfirmationType, newValue: boolean) => {
    setConfirmationType(type);
    setPendingValue(newValue);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      switch (confirmationType) {
        case 'isOpen':
          await updateSettings({ is_open: pendingValue });
          break;
        case 'maintenanceMode':
          await updateSettings({ is_in_maintenance: pendingValue });
          break;
        case 'scheduledOrders':
          await updateSettings({ allow_scheduled_orders: pendingValue });
          break;
      }
      toast({ title: 'Actualizado', description: 'Cambio aplicado correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo aplicar el cambio.' });
    } finally {
      setShowConfirmation(false);
    }
  };

  const onSaveHours = async () => {
    try {
      setSavingHours(true);
      const newSchedules = Object.values(draftSchedules);
      await updateSchedules(newSchedules);
      toast({ title: 'Horarios actualizados', description: 'Los horarios semanales han sido guardados.' });
    } catch (e: any) {
      toast({
        title: 'Error al actualizar',
        description: e?.message ?? 'Los horarios no se han actualizado.',
      });
    } finally {
      setSavingHours(false);
    }
  };

  const handleScheduleChange = (dayId: number, field: keyof StoreSchedule, value: any) => {
    setDraftSchedules(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  const confirmationContent = (() => {
    switch (confirmationType) {
      case 'isOpen':
        return {
          title: pendingValue ? '¿Abrir la cafetería?' : '¿Cerrar la cafetería?',
          message: pendingValue
            ? 'La cafetería comenzará a recibir pedidos nuevamente.'
            : 'La cafetería dejará de recibir pedidos temporalmente.',
        };
      case 'maintenanceMode':
        return {
          title: pendingValue ? '¿Activar modo mantenimiento?' : '¿Desactivar modo mantenimiento?',
          message: pendingValue
            ? 'El sistema entrará en modo mantenimiento. Algunas funcionalidades podrían verse afectadas.'
            : 'El sistema volverá a su funcionamiento normal.',
        };
      case 'scheduledOrders':
        return {
          title: pendingValue ? '¿Habilitar pedidos agendados?' : '¿Deshabilitar pedidos agendados?',
          message: pendingValue
            ? 'Los clientes podrán programar pedidos para horarios futuros.'
            : 'Los clientes no podrán programar pedidos para horarios futuros.',
        };
      default:
        return {
          title: '¿Confirmar cambio?',
          message: '¿Estás seguro de que deseas realizar este cambio?',
        };
    }
  })();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Configuración de Cafetería</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los ajustes generales del sistema</p>
        {isLoading && (
          <p className="text-sm text-gray-500 mt-2">Cargando configuración…</p>
        )}
        {error && (
          <p className="text-sm text-red-600 mt-2">Error: {error}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 dark:bg-secondary/10 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-primary dark:text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Estado de la Cafetería (Cierre Emergencia)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Control manual para anular el horario y cerrar la tienda temporalmente
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isOpen
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }`}
                >
                  {isOpen ? 'Abierto' : 'Cerrado Temporalmente'}
                </span>
              </div>
            </div>
            <Switch
              checked={isOpen}
              onChange={(newValue) => handleToggleRequest('isOpen', newValue)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 dark:bg-secondary/10 rounded-lg">
                <Clock className="w-6 h-6 text-primary dark:text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Horarios de Operación
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Define los días y horarios en los que la tienda opera de forma automática
                </p>
              </div>
            </div>

            <button
              onClick={onSaveHours}
              disabled={!isDirtyHours || savingHours}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition 
                ${(!isDirtyHours || savingHours)
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                  : 'bg-primary text-white dark:bg-secondary hover:opacity-90'}`}
              aria-disabled={!isDirtyHours || savingHours}
            >
              {savingHours ? 'Guardando…' : 'Guardar horarios'}
            </button>
          </div>

          <div className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-darkbg-lighter">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto hide-scrollbar">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = activeDayTab === day.id;
                const draft = draftSchedules[day.id];
                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayTab(day.id)}
                    className={`flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors border-b-2 
                      ${isActive 
                        ? 'border-primary text-primary dark:border-secondary dark:text-secondary bg-primary/5 dark:bg-secondary/10' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-darkbg'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span>{day.name.substring(0, 3)}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${draft?.is_open ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 min-h-[120px] flex items-center">
              {(() => {
                const draft = draftSchedules[activeDayTab];
                if (!draft) return null;
                const cleanTime = (t: string) => t.substring(0, 5);
                const activeDayName = DAYS_OF_WEEK.find(d => d.id === activeDayTab)?.name;

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={draft.is_open}
                        onChange={(val) => handleScheduleChange(activeDayTab, 'is_open', val)}
                      />
                      <div>
                        <p className={`font-semibold text-base ${draft.is_open ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                          {activeDayName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {draft.is_open ? 'Abierto en este horario' : 'Cerrado todo el día'}
                        </p>
                      </div>
                    </div>
                    
                    {draft.is_open && (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">Apertura</label>
                          <input
                            type="time"
                            value={cleanTime(draft.open_time)}
                            onChange={(e) => handleScheduleChange(activeDayTab, 'open_time', e.target.value)}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">Cierre</label>
                          <input
                            type="time"
                            value={cleanTime(draft.close_time)}
                            onChange={(e) => handleScheduleChange(activeDayTab, 'close_time', e.target.value)}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 dark:bg-secondary/10 rounded-lg">
              <Wrench className="w-6 h-6 text-primary dark:text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Opciones del Sistema
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configura las funcionalidades del sistema
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-darkbg last:border-0">
              <div className="flex-1 pr-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Modo Mantenimiento
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Activa el modo mantenimiento para realizar actualizaciones sin afectar el servicio
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    maintenanceMode
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                  }`}
                >
                  {maintenanceMode ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <Switch
                checked={maintenanceMode}
                onChange={(newValue) => handleToggleRequest('maintenanceMode', newValue)}
              />
            </div>
            <div className="flex items-start justify-between py-3">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Pedidos Agendados
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Permite a los clientes programar pedidos para una hora específica en el día actual.
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    scheduledOrdersEnabled
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                  }`}
                >
                  {scheduledOrdersEnabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
              <Switch
                checked={scheduledOrdersEnabled}
                onChange={(newValue) => handleToggleRequest('scheduledOrders', newValue)}
              />
            </div>
          </div>
        </div>
        
        <Banners />

      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title={confirmationContent.title}
        message={confirmationContent.message}
      />
    </div>
  );
}
