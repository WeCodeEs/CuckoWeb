import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Banner } from '../stores/bannersStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BannerCardProps {
  banner: Banner;
  onToggle: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onPreview: (banner: Banner) => void;
}

export default function BannerCard({ banner, onToggle, onDelete, onPreview }: BannerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: banner.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-darkbg-lighter rounded-xl border-2 ${
        isDragging
          ? 'border-primary dark:border-secondary shadow-2xl opacity-70 scale-105 z-50'
          : 'border-gray-200 dark:border-darkbg shadow-sm'
      } overflow-hidden transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600`}
    >
      <div className="relative aspect-[3/1] bg-gray-100 dark:bg-darkbg">
        <img
          {...attributes}
          {...listeners}
          src={banner.image_url}
          alt={`Banner ${banner.sort_order}`}
          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
          onClick={() => onPreview(banner)}
        />
        {!banner.active && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-sm font-semibold px-3 py-1.5 bg-black/40 rounded-lg">
              Inactivo
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="bg-primary dark:bg-secondary text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
            #{banner.sort_order}
          </span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-md shadow-lg ${
              banner.active
                ? 'bg-green-100 dark:bg-green-900/90 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-800/90 text-gray-800 dark:text-gray-300'
            }`}
          >
            {banner.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <button
          onClick={() => onPreview(banner)}
          className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
          title="Vista previa"
        >
          <Eye className="w-3.5 h-3.5" />
          Previsualizar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(banner)}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1.5 ${
              banner.active
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
            title={banner.active ? 'Desactivar' : 'Activar'}
          >
            {banner.active ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desactivar</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Activar</span>
              </>
            )}
          </button>

          <button
            onClick={() => onDelete(banner)}
            className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
