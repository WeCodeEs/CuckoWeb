import React, { useState, useEffect } from 'react';
import { Image, Upload } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import ConfirmationModal from '../components/ConfirmationModal';
import BannerCard from '../components/BannerCard';
import BannerPreviewModal from '../components/BannerPreviewModal';
import BannerReorderNotification from '../components/BannerReorderNotification';
import { useBannersStore, Banner } from '../stores/bannersStore';
import { useToast } from '../components/ui/use-toast';

export default function Banners() {
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [showReorderNotification, setShowReorderNotification] = useState(false);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      try {
        await addBanner(file);
        toast({ title: 'Éxito', description: 'Banner agregado correctamente.' });
        e.target.value = '';
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo agregar el banner.',
        });
      } finally {
        setIsUploading(false);
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
      toast({
        title: 'Éxito',
        description: `Banner ${banner.active ? 'desactivado' : 'activado'}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (bannerToDelete !== null) {
      try {
        await deleteBanner(bannerToDelete);
        toast({ title: 'Éxito', description: 'Banner eliminado.' });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar el banner.',
        });
      }
      setBannerToDelete(null);
    }
    setShowConfirmation(false);
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((banner) => banner.id === active.id);
      const newIndex = banners.findIndex((banner) => banner.id === over.id);

      const reorderedBanners = arrayMove(banners, oldIndex, newIndex);
      const updatedBanners = reorderedBanners.map((banner, idx) => ({
        ...banner,
        sort_order: idx + 1,
      }));

      try {
        await updateBannersOrder(updatedBanners);
        setShowReorderNotification(true);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo reordenar los banners.',
        });
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handlePreview = (banner: Banner) => {
    setPreviewBanner(banner);
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (!previewBanner) return;

    const currentIndex = banners.findIndex((b) => b.id === previewBanner.id);
    let newIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < banners.length - 1) {
      newIndex = currentIndex + 1;
    }

    setPreviewBanner(banners[newIndex]);
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
                disabled={isUploading}
              />
              <label
                htmlFor="banner-upload"
                className={`px-4 py-2 bg-primary dark:bg-secondary text-white rounded-lg transition-colors text-sm font-medium ${
                  isUploading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-primary-dark dark:hover:bg-secondary/80'
                }`}
              >
                {isUploading ? 'Subiendo...' : 'Seleccionar imagen'}
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Banners Configurados
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {banners.length} banner{banners.length !== 1 ? 's' : ''} total
                {banners.length !== 1 ? 'es' : ''} ({banners.filter((b) => b.active).length}{' '}
                activo{banners.filter((b) => b.active).length !== 1 ? 's' : ''})
              </span>
            </div>

            {loadingBanners && (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-darkbg rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cargando banners...
                </p>
              </div>
            )}

            {!loadingBanners && bannerError && (
              <div className="text-center py-12 border border-dashed border-red-300 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Error al cargar banners: {bannerError}
                </p>
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
              !loadingBanners &&
              banners.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext
                    items={banners.map((b) => b.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {banners.map((banner) => (
                        <BannerCard
                          key={banner.id}
                          banner={banner}
                          onToggle={handleToggleBanner}
                          onDelete={handleDeleteBannerRequest}
                          onPreview={handlePreview}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {(() => {
                      const activeBanner = activeDragId
                        ? banners.find((b) => b.id === activeDragId)
                        : null;
                      return activeBanner ? (
                        <div className="opacity-80">
                          <BannerCard
                            banner={activeBanner}
                            onToggle={() => {}}
                            onDelete={() => {}}
                            onPreview={() => {}}
                          />
                        </div>
                      ) : null;
                    })()}
                  </DragOverlay>
                </DndContext>
              )
            )}

            {!loadingBanners && banners.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Tip:</strong> Arrastra los banners para reorganizarlos. El orden se
                  guardará automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar banner?"
        message="Esta acción no se puede deshacer. El banner se eliminará permanentemente."
      />

      {previewBanner && (
        <BannerPreviewModal
          banner={previewBanner}
          banners={banners}
          onClose={() => setPreviewBanner(null)}
          onToggle={handleToggleBanner}
          onDelete={handleDeleteBannerRequest}
          onNavigate={handleNavigatePreview}
        />
      )}

      <BannerReorderNotification
        show={showReorderNotification}
        onClose={() => setShowReorderNotification(false)}
      />
    </>
  );
}
