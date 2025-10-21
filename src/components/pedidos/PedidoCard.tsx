import React from 'react';
import { Clock, CalendarClock, Printer } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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

const badgeColors = {
  Recibido: 'bg-blue-500 dark:bg-blue-600',
  EnPreparacion: 'bg-orange-500 dark:bg-orange-600',
  Listo: 'bg-green-500 dark:bg-green-600',
  Entregado: 'bg-gray-500 dark:bg-gray-600',
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
        "cursor-pointer active:scale-[0.98]",
        {
          'opacity-50 shadow-xl z-50': isDragging,
          'transform-gpu will-change-transform': enableDrag,
          'touch-manipulation': !enableDrag,
        }
      )}
      onClick={onClick}
    >
      {order.scheduled_delivery_time && (
        <div className="w-[96%] mx-auto">
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-1 rounded-t-lg rounded-b-none",
              "text-white dark:text-white",
              badgeColors[order.status],
              "shadow-primary-light/20"
            )}
          >
            <CalendarClock className="w-4 h-4 text-white dark:text-white" />
            <span className="text-xs sm:text-sm font-medium">
              Agendado para la(s) {format(new Date(order.scheduled_delivery_time as string), "HH:mm")}
            </span>
          </div>
        </div>
      )}

      <div
        className={clsx(
          "p-3 sm:p-4 shadow-sm transition-transform transition-shadow duration-200 border-l-4 transform",
          statusColors[order.status],
          "bg-white dark:bg-darkbg-lighter",
          "rounded-lg",
          {
            'hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-primary/20 hover:z-10': !isDragging,
          }
        )}
      >
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
              {detail.product_variant && detail.product_variant?.variant && (
                <span className="text-gray-500 dark:text-gray-400"> ({detail.product_variant.variant.name})</span>
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