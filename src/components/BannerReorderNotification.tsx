import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface BannerReorderNotificationProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export default function BannerReorderNotification({
  show,
  onClose,
  message = 'Orden actualizado',
}: BannerReorderNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-darkbg-lighter rounded-lg shadow-xl border border-gray-200 dark:border-darkbg flex items-center gap-3 px-4 py-3 min-w-[280px]">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
          {message}
        </span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-darkbg rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}
