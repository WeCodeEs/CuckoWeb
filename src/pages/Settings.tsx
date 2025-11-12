import { useEffect, useState } from 'react';
import { Clock, Settings as SettingsIcon, Wrench, Calendar } from 'lucide-react';
import Switch from '../components/ui/switch';
import ConfirmationModal from '../components/ConfirmationModal';
import Banners from './Banners';
import { useSettingsStore } from '../stores/settingsStore';
import { useToast } from '../components/ui/use-toast';

type ConfirmationType = 'isOpen' | 'maintenanceMode' | 'scheduledOrders' | null;

export default function Settings() {
  const {
    isOpen,
    openingTime,
    closingTime,
    maintenanceMode,
    scheduledOrdersEnabled,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    setLocalOpeningTime,
    setLocalClosingTime,
  } = useSettingsStore();

  const { toast } = useToast();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const [draftOpening, setDraftOpening] = useState(openingTime);
  const [draftClosing, setDraftClosing] = useState(closingTime);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => { setDraftOpening(openingTime); }, [openingTime]);
  useEffect(() => { setDraftClosing(closingTime); }, [closingTime]);

  // Habilita botón solo si hubo cambios
  const isDirtyHours = draftOpening !== openingTime || draftClosing !== closingTime;

  useEffect(() => {
    // Carga inicial de configuraciones
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
      await updateSettings({
        opening_time: draftOpening, // "HH:mm"
        closing_time: draftClosing, // "HH:mm"
      });
      setLocalOpeningTime(draftOpening);
      setLocalClosingTime(draftClosing);
      toast({ title: 'Horario actualizado' });
    } catch (e: any) {
      toast({
        title: 'Error al actualizar',
        description: e?.message ?? 'El horario no se ha actualizado.',
      });
    } finally {
      setSavingHours(false);
    }
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
                  Estado de la Cafetería
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Controla si la cafetería está abierta o cerrada para recibir pedidos
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isOpen
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }`}
                >
                  {isOpen ? 'Abierto' : 'Cerrado'}
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
                  Horario de Operación
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Define el horario de apertura y cierre de la cafetería
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
              {savingHours ? 'Guardando…' : 'Guardar horario'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Apertura
              </label>
              <input
                type="time"
                value={draftOpening}
                onChange={(e) => setDraftOpening(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Cierre
              </label>
              <input
                type="time"
                value={draftClosing}
                onChange={(e) => setDraftClosing(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
              />
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