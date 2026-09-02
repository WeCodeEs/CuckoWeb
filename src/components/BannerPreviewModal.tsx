import { X, ChevronLeft, ChevronRight, Eye, EyeOff, Trash2, Link2 } from 'lucide-react';
import { Banner } from '../stores/bannersStore';
import { transformImage, IMAGE_PRESETS } from '../utils/transformImage';

interface BannerPreviewModalProps {
  banner: Banner;
  banners: Banner[];
  onClose: () => void;
  onToggle: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onEditAction: (banner: Banner) => void;
}

export default function BannerPreviewModal({
  banner,
  banners,
  onClose,
  onToggle,
  onDelete,
  onNavigate,
  onEditAction,
}: BannerPreviewModalProps) {

  const currentIndex = banners.findIndex((b) => b.id === banner.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < banners.length - 1;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-200 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-6xl bg-white dark:bg-darkbg-lighter rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {hasPrev && (
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Banner siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="relative">
            <div className="aspect-[3/1] bg-gray-900 flex items-center justify-center">
              <img
                src={transformImage(banner.image_url, IMAGE_PRESETS.bannerFull)!}
                alt={`Banner ${banner.sort_order}`}
                className="w-full h-full object-contain"
              />
              {!banner.active && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold px-6 py-3 bg-black/50 rounded-xl">
                    Banner Inactivo
                  </span>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="bg-primary dark:bg-secondary text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                Banner #{banner.sort_order}
              </span>
              <span
                className={`text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg ${
                  banner.active
                    ? 'bg-green-100 dark:bg-green-900/90 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-800/90 text-gray-800 dark:text-gray-300'
                }`}
              >
                {banner.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-darkbg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Banner #{banner.sort_order}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentIndex + 1} de {banners.length} banners
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onToggle(banner)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                    banner.active
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                      : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                  }`}
                >
                  {banner.active ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Activar
                    </>
                  )}
                </button>

                <button
                  onClick={() => onEditAction(banner)}
                  className="px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/30"
                >
                  <Link2 className="w-4 h-4" />
                  Editar acción
                </button>

                <button
                  onClick={() => {
                    onDelete(banner);
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
