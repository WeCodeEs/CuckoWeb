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
  const [currentSlide, setCurrentSlide] = useState(0);

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
    setCurrentSlide(targetIndex);
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
          const newBanners = banners.filter(banner => banner.id !== bannerToDelete);
          setBanners(newBanners);
          setBannerToDelete(null);
          if (currentSlide >= newBanners.length) {
            setCurrentSlide(Math.max(0, newBanners.length - 1));
          }
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
                  Vista previa del banner
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {banners.length} banner{banners.length !== 1 ? 's' : ''} configurado{banners.length !== 1 ? 's' : ''} ({banners.filter(b => b.active).length} activo{banners.filter(b => b.active).length !== 1 ? 's' : ''})
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
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <div className="relative aspect-[3/1] bg-gray-200 dark:bg-darkbg">
                      <img
                        src={banners[currentSlide].imageUrl}
                        alt={`Banner ${banners[currentSlide].order}`}
                        className="w-full h-full object-cover"
                      />
                      {!banners[currentSlide].active && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">Banner Inactivo</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {banners.map((banner, index) => (
                        <button
                          key={banner.id}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentSlide
                              ? 'bg-primary dark:bg-secondary w-6'
                              : 'bg-gray-400 dark:bg-gray-600'
                          }`}
                          aria-label={`Ver banner ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-darkbg rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Banner #{banners[currentSlide].order}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            banners[currentSlide].active
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {banners[currentSlide].active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveBanner(banners[currentSlide].id, 'up')}
                          disabled={currentSlide === 0}
                          className="px-3 py-1.5 bg-white dark:bg-darkbg-lighter text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          Subir
                        </button>
                        <button
                          onClick={() => handleMoveBanner(banners[currentSlide].id, 'down')}
                          disabled={currentSlide === banners.length - 1}
                          className="px-3 py-1.5 bg-white dark:bg-darkbg-lighter text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          Bajar
                        </button>
                      </div>

                      <div className="flex-1"></div>

                      <button
                        onClick={() => handleToggleBanner(banners[currentSlide].id)}
                        className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
                          banners[currentSlide].active
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        }`}
                        title={banners[currentSlide].active ? 'Desactivar' : 'Activar'}
                      >
                        {banners[currentSlide].active ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Activar
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteBannerRequest(banners[currentSlide].id)}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-xs font-medium flex items-center gap-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
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
