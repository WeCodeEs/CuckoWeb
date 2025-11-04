import React, { useState } from 'react';
import { Clock, Settings as SettingsIcon, Wrench, Calendar } from 'lucide-react';
import Switch from '../components/ui/switch';
import ConfirmationModal from '../components/ConfirmationModal';

type ConfirmationType = 'isOpen' | 'maintenanceMode' | 'scheduledOrders' | null;

export default function Settings() {
  const [isOpen, setIsOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [scheduledOrdersEnabled, setScheduledOrdersEnabled] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const handleToggleRequest = (type: ConfirmationType, newValue: boolean) => {
    setConfirmationType(type);
    setPendingValue(newValue);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    switch (confirmationType) {
      case 'isOpen':
        setIsOpen(pendingValue);
        break;
      case 'maintenanceMode':
        setMaintenanceMode(pendingValue);
        break;
      case 'scheduledOrders':
        setScheduledOrdersEnabled(pendingValue);
        break;
    }
  };

  const getConfirmationContent = () => {
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
            ? 'Los clientes podrán programar pedidos para fechas futuras.'
            : 'Los clientes no podrán programar pedidos para fechas futuras.',
        };
      default:
        return {
          title: '¿Confirmar cambio?',
          message: '¿Estás seguro de que deseas realizar este cambio?',
        };
    }
  };

  const confirmationContent = getConfirmationContent();

  return (
    <div className="min-h-screen flex justify-center px-4 py-8 bg-gray-50 dark:bg-darkbg">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración de Cafetería</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona los ajustes generales del sistema</p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-lg dark:shadow-dark p-8 border border-gray-100 dark:border-darkbg-lighter transition-all hover:shadow-xl">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-secondary/10 dark:to-secondary/5 rounded-2xl">
                  <SettingsIcon className="w-7 h-7 text-primary dark:text-secondary" />
                </div>
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Estado de la Cafetería
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Controla si la cafetería está abierta o cerrada para recibir pedidos
                  </p>
                  <div>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                        isOpen
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>
              </div>
              <Switch
                checked={isOpen}
                onChange={(newValue) => handleToggleRequest('isOpen', newValue)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-lg dark:shadow-dark p-8 border border-gray-100 dark:border-darkbg-lighter transition-all hover:shadow-xl">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-secondary/10 dark:to-secondary/5 rounded-2xl">
                <Clock className="w-7 h-7 text-primary dark:text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Horario de Operación
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Define el horario de apertura y cierre de la cafetería
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Hora de Apertura
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/30 dark:focus:ring-secondary/30 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white transition-all shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/30 dark:focus:ring-secondary/30 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-lighter rounded-2xl shadow-lg dark:shadow-dark p-8 border border-gray-100 dark:border-darkbg-lighter transition-all hover:shadow-xl">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-secondary/10 dark:to-secondary/5 rounded-2xl">
                <Wrench className="w-7 h-7 text-primary dark:text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Opciones del Sistema
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Configura las funcionalidades del sistema
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-gray-200 dark:border-darkbg">
                <div className="flex-1 space-y-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Modo Mantenimiento
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Activa el modo mantenimiento para realizar actualizaciones sin afectar el servicio
                  </p>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        maintenanceMode
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {maintenanceMode ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onChange={(newValue) => handleToggleRequest('maintenanceMode', newValue)}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pt-2">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary dark:text-secondary" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Pedidos Agendados
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Permite a los clientes programar pedidos para una fecha y hora específica
                  </p>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        scheduledOrdersEnabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {scheduledOrdersEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={scheduledOrdersEnabled}
                  onChange={(newValue) => handleToggleRequest('scheduledOrders', newValue)}
                />
              </div>
            </div>
          </div>
        </div>
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
