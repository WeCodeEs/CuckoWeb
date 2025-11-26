import React, { useState, useEffect } from 'react';
import { Image, Upload, Search, Link2 } from 'lucide-react';
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
import { useBannersStore, Banner, BannerAction } from '../stores/bannersStore';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';

export default function Banners() {
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [showReorderNotification, setShowReorderNotification] = useState(false);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  const [bannerAction, setBannerAction] = useState<BannerAction>('NONE');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [products, setProducts] = useState<Array<{ id: number; name: string; active: boolean }>>(
    []
  );
  const [menus, setMenus] = useState<Array<{ id: number; name: string; active: boolean }>>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

    const loadTargets = async () => {
      setLoadingTargets(true);
      setTargetsError(null);
      try {
        const [
          { data: productsData, error: productsError },
          { data: menusData, error: menusError },
        ] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, active')
            .eq('active', true)
            .order('name', { ascending: true }),
          supabase
            .from('menus')
            .select('id, name, active')
            .eq('active', true)
            .order('name', { ascending: true }),
        ]);

        if (productsError) throw productsError;
        if (menusError) throw menusError;

        setProducts((productsData as any[]) ?? []);
        setMenus((menusData as any[]) ?? []);
      } catch (error: any) {
        console.error('Error cargando productos/menús para banners:', error);
        setTargetsError(error.message ?? 'No se pudieron cargar productos y menús');
      } finally {
        setLoadingTargets(false);
      }
    };

    loadTargets();
  }, [fetchBanners]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setFormError(null);

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor selecciona un archivo de imagen válido.');
      e.target.value = '';
      return;
    }

    if (bannerAction === 'REDIRECT_PRODUCT' && !selectedProductId) {
      setFormError('Selecciona el producto al que debe dirigir el banner.');
      e.target.value = '';
      return;
    }

    if (bannerAction === 'REDIRECT_MENU' && !selectedMenuId) {
      setFormError('Selecciona el menú al que debe dirigir el banner.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      await addBanner(file, {
        banner_action: bannerAction,
        product_id: bannerAction === 'REDIRECT_PRODUCT' ? selectedProductId : null,
        menu_id: bannerAction === 'REDIRECT_MENU' ? selectedMenuId : null,
      });

      toast({ title: 'Éxito', description: 'Banner agregado correctamente.' });
      e.target.value = '';

      setBannerAction('NONE');
      setSelectedProductId(null);
      setSelectedMenuId(null);
      setProductSearch('');
      setMenuSearch('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo agregar el banner.',
      });
    } finally {
      setIsUploading(false);
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

              {/* Configuración de acción del banner */}
              <div className="w-full max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary">
                    <Link2 className="w-4 h-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Acción al tocar el banner
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Opcional: define si el banner debe abrir un producto o un menú específico.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="banner-action"
                      className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Tipo de acción
                    </label>
                    <select
                      id="banner-action"
                      value={bannerAction}
                      onChange={(e) => {
                        const value = e.target.value as BannerAction;
                        setBannerAction(value);
                        setSelectedProductId(null);
                        setSelectedMenuId(null);
                        setProductSearch('');
                        setMenuSearch('');
                        setFormError(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg-lighter text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary"
                    >
                      <option value="NONE">Sin acción (solo mostrar imagen)</option>
                      <option value="REDIRECT_PRODUCT">Redirigir a un producto</option>
                      <option value="REDIRECT_MENU">Redirigir a un menú</option>
                    </select>
                  </div>

                  {bannerAction === 'REDIRECT_PRODUCT' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Producto destino
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar productos..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg-lighter text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter">
                        {loadingTargets ? (
                          <div className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            Cargando productos...
                          </div>
                        ) : targetsError ? (
                          <div className="py-3 px-3 text-xs text-red-600 dark:text-red-400">
                            {targetsError}
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            No hay productos activos que coincidan
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100 dark:divide-darkbg">
                            {filteredProducts.map((product) => (
                              <li
                                key={product.id}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between ${
                                  selectedProductId === product.id
                                    ? 'bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary'
                                    : 'hover:bg-gray-50 dark:hover:bg-darkbg-darker text-gray-700 dark:text-gray-200'
                                }`}
                                onClick={() => {
                                  setSelectedProductId(product.id);
                                  setFormError(null);
                                }}
                              >
                                <span>{product.name}</span>
                                {selectedProductId === product.id && (
                                  <span className="text-[10px] uppercase font-semibold">
                                    Seleccionado
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {bannerAction === 'REDIRECT_MENU' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Menú destino
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar menús..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg-lighter text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter">
                        {loadingTargets ? (
                          <div className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            Cargando menús...
                          </div>
                        ) : targetsError ? (
                          <div className="py-3 px-3 text-xs text-red-600 dark:text-red-400">
                            {targetsError}
                          </div>
                        ) : filteredMenus.length === 0 ? (
                          <div className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            No hay menús activos que coincidan
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100 dark:divide-darkbg">
                            {filteredMenus.map((menu) => (
                              <li
                                key={menu.id}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between ${
                                  selectedMenuId === menu.id
                                    ? 'bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary'
                                    : 'hover:bg-gray-50 dark:hover:bg-darkbg-darker text-gray-700 dark:text-gray-200'
                                }`}
                                onClick={() => {
                                  setSelectedMenuId(menu.id);
                                  setFormError(null);
                                }}
                              >
                                <span>{menu.name}</span>
                                {selectedMenuId === menu.id && (
                                  <span className="text-[10px] uppercase font-semibold">
                                    Seleccionado
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2">
                      {formError}
                    </div>
                  )}
                </div>
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
                  isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-dark dark:hover:bg-secondary/90'
                }`}
              >
                {isUploading ? 'Subiendo...' : 'Seleccionar imagen'}
              </label>
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
