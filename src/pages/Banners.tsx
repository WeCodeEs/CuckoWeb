import React, { useState, useEffect } from 'react';
import { Image, Plus } from 'lucide-react';
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
import BannerModal from '../components/BannerModal';

export default function Banners() {
  const { toast } = useToast();

  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [showReorderNotification, setShowReorderNotification] = useState(false);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const {
    banners,
    loadingBanners,
    error: bannerError,
    fetchBanners,
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

  const activeCount = banners.filter((b) => b.active).length;

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
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Banners Configurados
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {banners.length} banner{banners.length !== 1 ? 's' : ''} total
                  {banners.length !== 1 ? 'es' : ''} ({activeCount}{' '}
                  activo{activeCount !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Banner
              </button>
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
                  Crea tu primer banner para comenzar
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

      {isBannerModalOpen && (
        <BannerModal onClose={() => setIsBannerModalOpen(false)} />
      )}
    </>
  );
}
