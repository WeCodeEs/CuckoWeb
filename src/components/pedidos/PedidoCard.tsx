import React from 'react';
import { Clock, Printer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Order } from '../../stores/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

interface Props {
  order: Order;
  onClick: () => void;
  onPrint: () => void;
  isDragging?: boolean;
  enableDrag?: boolean;
}

const statusColors = {
  Recibido: 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10',
  EnPreparacion: 'border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/10',
  Listo: 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/10',
  Entregado: 'border-gray-500 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/10',
};

const statusLabels = {
  Recibido: 'Recibido',
  EnPreparacion: 'En Preparación',
  Listo: 'Listo',
  Entregado: 'Entregado',
};

export default function PedidoCard({ order, onClick, onPrint, isDragging = false, enableDrag = true }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
    disabled: !enableDrag,
  });

  const style = enableDrag ? {
    transform: CSS.Translate.toString(transform),
    touchAction: 'manipulation',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  } : {};

  // Determine which timestamp to show based on status
  const getRelevantTimestamp = () => {
    switch (order.status) {
      case 'Recibido':
        return order.created_at;
      case 'EnPreparacion':
        return order.started_at || order.created_at;
      case 'Listo':
        return order.ready_at || order.started_at || order.created_at;
      case 'Entregado':
        return order.delivered_at || order.ready_at || order.started_at || order.created_at;
      default:
        return order.created_at;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(getRelevantTimestamp()), {
    addSuffix: true,
    locale: es
  });

  const handlePrintClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint();
  };

  return (
    <div 
      ref={enableDrag ? setNodeRef : undefined}
      style={style}
      {...(enableDrag ? attributes : {})}
      {...(enableDrag ? listeners : {})}
      className={clsx(
        "bg-white dark:bg-darkbg-lighter rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-l-4 cursor-pointer active:scale-[0.98]",
        statusColors[order.status],
        {
          'opacity-50 shadow-xl z-50': isDragging,
          'transform-gpu will-change-transform': enableDrag,
          'touch-manipulation': !enableDrag,
          'hover:scale-[1.02]': !isDragging,
        }
      )}
      onClick={onClick}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            #{order.id}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintClick}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
              title="Imprimir pedido"
            >
              <Printer className="w-4 h-4" />
            </button>
            <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Customer Name */}
        {order.user && (
          <div className="mb-2 sm:mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {order.user.first_name} {order.user.last_name}
            </p>
          </div>
        )}

        <div className="space-y-1 sm:space-y-2">
          {order.details.slice(0, 3).map((detail) => (
            <p key={detail.id} className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
              <span className="font-medium">{detail.quantity}x</span> {detail.product.name}
              {detail.product?.variant?.name && (
                <span className="text-gray-500 dark:text-gray-400"> ({detail.product.variant.name})</span>
              )}
              {detail.ingredients && detail.ingredients.length > 0 && (
                <span className="text-gray-500 dark:text-gray-400"> ({detail.ingredients.map(ing => ing.name).join(', ')})</span>
              )}
            </p>
          ))}
          {order.details.length > 3 && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
              ...y {order.details.length - 3} más
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2">
          <div className="text-base sm:text-lg font-semibold text-primary dark:text-secondary">
            {formatCurrency(order.total)}
          </div>
        </div>

        {/* Status indicator for mobile */}
        <div className="mt-2 sm:hidden">
          <span className={clsx(
            "inline-block w-full text-center text-xs font-medium py-1 rounded",
            {
              'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20': order.status === 'Recibido',
              'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20': order.status === 'EnPreparacion',
              'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20': order.status === 'Listo',
              'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20': order.status === 'Entregado',
            }
          )}>
            {statusLabels[order.status]}
          </span>
        </div>
      </div>
    </div>
  );
}