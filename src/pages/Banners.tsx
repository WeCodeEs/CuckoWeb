import React, { useState, useEffect } from 'react';
import { Image, Upload, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { useBannersStore, Banner } from '../stores/bannersStore'; 
import { useToast } from '../components/ui/use-toast';
export default function Banners() {
  const { toast } = useToast();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    banners,
    loadingBanners,
    error: bannerError,
    fetchBanners,
    addBanner,
    updateBannersOrder,
    toggleBannerStatus,
    deleteBanner,
  } = useBannersStore();

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

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

  const handleAddBanner = async () => {
    if (selectedFile) {
      try {
        await addBanner(selectedFile);
        setImagePreview(null);
        setSelectedFile(null);
        toast({ title: 'Éxito', description: 'Banner agregado correctamente.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo agregar el banner.' });
      }
    }
  };

  const handleDeleteBannerRequest = (banner: Banner) => {
    setBannerToDelete(banner);
    setShowConfirmation(true);
  };

  const handleToggleBanner = async (banner: Banner) => {
    try {
      await toggleBannerStatus(banner);
      toast({ title: 'Éxito', description: `Banner ${banner.active ? 'desactivado' : 'activado'}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  const handleMoveBanner = async (bannerId: number, direction: 'up' | 'down') => {
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

    const reorderedBanners = newBanners.map((banner, idx) => ({
      ...banner,
      order: idx + 1,
    }));

    try {
      await updateBannersOrder(reorderedBanners);
      setCurrentSlide(targetIndex); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo reordenar los banners.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (bannerToDelete !== null) {
      try {
        await deleteBanner(bannerToDelete);
        toast({ title: 'Éxito', description: 'Banner eliminado.' });
        if (currentSlide >= banners.length - 1) {
          setCurrentSlide(Math.max(0, banners.length - 2)); 
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el banner.' });
      }
      setBannerToDelete(null);
    }
    setShowConfirmation(false);
  };

  return (
    <>
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
            
            {loadingBanners && (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-darkbg rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Cargando banners...</p>
              </div>
            )}
            {!loadingBanners && bannerError && (
              <div className="text-center py-12 border border-dashed border-red-300 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                <p className="text-sm text-red-700 dark:text-red-400">Error al cargar banners: {bannerError}</p>
              </div>
            )}
            
            {!loadingBanners && !bannerError && banners.length === 0 ? (
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
              !loadingBanners && banners.length > 0 && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <div className="relative aspect-[3/1] bg-gray-200 dark:bg-darkbg">
                      <img
                        src={banners[currentSlide].image_url}
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
                        onClick={() => handleToggleBanner(banners[currentSlide])}
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
                        onClick={() => handleDeleteBannerRequest(banners[currentSlide])}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-xs font-medium flex items-center gap-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation && confirmationType === 'deleteBanner'}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar banner?"
        message="Esta acción no se puede deshacer. El banner se eliminará permanentemente."
      />
    </>
  );
}