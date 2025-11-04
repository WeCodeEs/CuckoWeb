import React, { useState } from 'react';
import { Clock, Settings as SettingsIcon, Wrench, Calendar, Image, Upload, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Switch from '../components/ui/switch';
import ConfirmationModal from '../components/ConfirmationModal';

type ConfirmationType = 'isOpen' | 'maintenanceMode' | 'scheduledOrders' | 'deleteBanner' | null;

interface Banner {
  id: number;
  imageUrl: string;
  active: boolean;
  order: number;
}

export default function Settings() {
  const [isOpen, setIsOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [scheduledOrdersEnabled, setScheduledOrdersEnabled] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const [banners, setBanners] = useState<Banner[]>([
    { id: 1, imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1200', active: true, order: 1 },
    { id: 2, imageUrl: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=1200', active: true, order: 2 },
  ]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);

  const handleToggleRequest = (type: ConfirmationType, newValue: boolean) => {
    setConfirmationType(type);
    setPendingValue(newValue);
    setShowConfirmation(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBanner = () => {
    if (imagePreview) {
      const newBanner: Banner = {
        id: Date.now(),
        imageUrl: imagePreview,
        active: true,
        order: banners.length + 1,
      };
      setBanners([...banners, newBanner]);
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  const handleDeleteBannerRequest = (bannerId: number) => {
    setBannerToDelete(bannerId);
    setConfirmationType('deleteBanner');
    setShowConfirmation(true);
  };

  const handleToggleBanner = (bannerId: number) => {
    setBanners(banners.map(banner =>
      banner.id === bannerId ? { ...banner, active: !banner.active } : banner
    ));
  };

  const handleMoveBanner = (bannerId: number, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === bannerId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];

    newBanners.forEach((banner, idx) => {
      banner.order = idx + 1;
    });

    setBanners(newBanners);
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
      case 'deleteBanner':
        if (bannerToDelete !== null) {
          setBanners(banners.filter(banner => banner.id !== bannerToDelete));
          setBannerToDelete(null);
        }
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
      case 'deleteBanner':
        return {
          title: '¿Eliminar banner?',
          message: 'Esta acción no se puede deshacer. El banner se eliminará permanentemente.',
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Configuración de Cafetería</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los ajustes generales del sistema</p>
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
          <div className="flex items-start gap-4 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Apertura
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Cierre
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
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
                  Permite a los clientes programar pedidos para una fecha y hora específica
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

        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 dark:bg-secondary/10 rounded-lg">
              <Image className="w-6 h-6 text-primary dark:text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Gestión de Banners
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configura las imágenes que se mostrarán en el banner de la app
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-darkbg rounded-lg p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-darkbg rounded-full">
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Subir nueva imagen de banner
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tamaño recomendado: 1200x400px (formato JPG, PNG o WEBP)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className="px-4 py-2 bg-primary dark:bg-secondary text-white rounded-lg cursor-pointer hover:bg-primary-dark dark:hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  Seleccionar imagen
                </label>
              </div>

              {imagePreview && (
                <div className="mt-6 space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-darkbg">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddBanner}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Agregar banner
                    </button>
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-darkbg text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-darkbg/80 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Banners configurados ({banners.length})
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {banners.filter(b => b.active).length} activos
                </span>
              </div>

              {banners.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 dark:border-darkbg rounded-lg">
                  <Image className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay banners configurados
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Sube tu primera imagen para comenzar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        banner.active
                          ? 'border-green-500 dark:border-green-600'
                          : 'border-gray-300 dark:border-darkbg opacity-60'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={banner.imageUrl}
                          alt={`Banner ${banner.order}`}
                          className="w-full h-32 object-cover"
                        />
                        {!banner.active && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Inactivo</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                          #{banner.order}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-darkbg-lighter">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveBanner(banner.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-darkbg rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover arriba"
                            >
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleMoveBanner(banner.id, 'down')}
                              disabled={index === banners.length - 1}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-darkbg rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover abajo"
                            >
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleBanner(banner.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-darkbg rounded transition-colors"
                              title={banner.active ? 'Desactivar' : 'Activar'}
                            >
                              {banner.active ? (
                                <Eye className="w-4 h-4 text-green-600 dark:text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteBannerRequest(banner.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
