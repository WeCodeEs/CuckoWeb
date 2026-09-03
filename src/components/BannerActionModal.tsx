import React, { useEffect, useState } from 'react';
import { X, Link2, Search } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { IMAGE_PRESETS } from '../utils/transformImage';
import OptimizedImage from './OptimizedImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Banner, BannerAction, useBannersStore } from '../stores/bannersStore';
import { supabase } from '../lib/supabase';

interface Props {
  banner: Banner;
  onClose: () => void;
}

export default function BannerActionModal({ banner, onClose }: Props) {
  const { toast } = useToast();
  const { fetchBanners } = useBannersStore();

  const [bannerAction, setBannerAction] = useState<BannerAction>(
    (banner.banner_action as BannerAction) || 'NONE'
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    banner.product_id ?? null
  );
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(
    banner.menu_id ?? null
  );
  const [productSearch, setProductSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [products, setProducts] = useState<Array<{ id: number; name: string; active: boolean }>>(
    []
  );
  const [menus, setMenus] = useState<Array<{ id: number; name: string; active: boolean }>>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
        console.error('Error cargando productos/menús para editar acción de banner:', error);
        setTargetsError(error.message ?? 'No se pudieron cargar productos y menús');
      } finally {
        setLoadingTargets(false);
      }
    };

    loadTargets();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const validate = () => {
    if (bannerAction === 'REDIRECT_PRODUCT' && !selectedProductId) {
      setFormError('Selecciona el producto al que debe dirigir el banner.');
      return false;
    }
    if (bannerAction === 'REDIRECT_MENU' && !selectedMenuId) {
      setFormError('Selecciona el menú al que debe dirigir el banner.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      setFormError(null);

      const payload = {
        action: 'UPDATE_ACTION' as const,
        id: banner.id,
        banner_action: bannerAction,
        product_id: bannerAction === 'REDIRECT_PRODUCT' ? selectedProductId : null,
        menu_id: bannerAction === 'REDIRECT_MENU' ? selectedMenuId : null,
      };

      const { data, error } = await supabase.functions.invoke('manage-banners', {
        body: payload,
      });

      if (error) {
        console.error('Error desde manage-banners (UPDATE_ACTION):', error);
        setFormError(error.message || 'No se pudo actualizar la acción del banner.');
        return;
      }

      // Refrescar listado en el store
      await fetchBanners();

      toast({
        title: 'Acción actualizada',
        description: 'La acción del banner se actualizó correctamente.',
      });
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar acción de banner:', err);
      setFormError(err.message || 'No se pudo actualizar la acción del banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="flex flex-col max-h-[80vh]">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-darkbg bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Editar acción del banner
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="w-full rounded-lg border border-gray-200 dark:border-darkbg overflow-hidden bg-gray-50 dark:bg-darkbg">
              <div className="aspect-[3/1] bg-gray-100 dark:bg-darkbg">
                <OptimizedImage
                  src={banner.image_url}
                  transform={IMAGE_PRESETS.bannerCard}
                  alt="Banner actual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="w-full space-y-4">
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
          </form>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg-darker">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-darkbg-lighter border border-gray-300 dark:border-darkbg rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="" // usamos onSubmit del form directamente
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
