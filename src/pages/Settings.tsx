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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los ajustes del sistema</p>
      </div>

      <div className="space-y-8">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                Estado de la Cafetería
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOpen ? 'La cafetería está recibiendo pedidos' : 'La cafetería está cerrada'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {isOpen ? 'Abierto' : 'Cerrado'}
              </span>
              <Switch
                checked={isOpen}
                onChange={(newValue) => handleToggleRequest('isOpen', newValue)}
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-6">
            Horario de Operación
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Apertura
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary dark:focus:ring-secondary focus:border-transparent bg-white dark:bg-darkbg text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Cierre
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary dark:focus:ring-secondary focus:border-transparent bg-white dark:bg-darkbg text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                Modo Mantenimiento
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Suspende temporalmente el servicio
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${maintenanceMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {maintenanceMode ? 'Activo' : 'Inactivo'}
              </span>
              <Switch
                checked={maintenanceMode}
                onChange={(newValue) => handleToggleRequest('maintenanceMode', newValue)}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                Pedidos Agendados
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permite programar pedidos futuros
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${scheduledOrdersEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {scheduledOrdersEnabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
              <Switch
                checked={scheduledOrdersEnabled}
                onChange={(newValue) => handleToggleRequest('scheduledOrders', newValue)}
              />
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
