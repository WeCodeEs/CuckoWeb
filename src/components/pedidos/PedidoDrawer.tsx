import React from 'react';
import { X, Printer, Clock, CheckCircle, Truck, Play, Mail, CalendarClock, AlertCircle, MessageCircle } from 'lucide-react';
import { Order, OrderStatus, OrderNotification, useOrderStore } from '../../stores/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NotificationModal from './NotificationModal';
import { getScheduledOrderAlert } from '../../utils/timeAlerts';


interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
}

const statusOptions: { value: OrderStatus; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'Recibido', label: 'Recibido', icon: Clock },
  { value: 'EnPreparacion', label: 'En Preparación', icon: Play },
  { value: 'Listo', label: 'Listo', icon: CheckCircle },
  { value: 'Entregado', label: 'Entregado', icon: Truck }
];

export default function PedidoDrawer({ order, onClose, onStatusChange }: Props) {
  const { fetchNotificationsByOrder } = useOrderStore();
  const [notifications, setNotifications] = React.useState<OrderNotification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(Date.now());

  // Update time every minute for scheduled order alerts
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await fetchNotificationsByOrder(order.id);
      if (mounted) setNotifications(rows);
    })();
    return () => { mounted = false; };
  }, [order.id, fetchNotificationsByOrder]);

  // Get alert info for scheduled orders
  const alertInfo = order.scheduled_delivery_time
    ? getScheduledOrderAlert(
        order.scheduled_delivery_time,
        order.status,
        order.ready_at,
        order.delivered_at
      )
    : null;

  const handlePrint = () => {
    // Create an iframe for printing the order
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Get the iframe document
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      alert('Error al preparar la impresión');
      return;
    }

    // Create a temporary container with the print ticket
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = `
      <div style="width: 80mm; padding: 8px; font-family: monospace;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 22px; margin: 0 0 4px 0; font-weight: bold;">CuckooEats</h1>
          <p style="font-size: 24px; margin: 4px 0; font-weight: bold;">Pedido #${order.id}</p>
          ${order.scheduled_delivery_time ? `
            <div style="font-size: 18px; margin: 8px 0; font-weight: bold; padding: 6px; border: 2px solid #000; border-radius: 4px;">
              <p style="margin: 0 0 2px 0;">PEDIDO AGENDADO</p>
              <p style="margin: 0; font-size: 16px;">Para la(s) ${format(new Date(order.scheduled_delivery_time), 'HH:mm')}</p>
            </div>
          ` : ''}
        </div>

        <div style="font-size: 13px; margin-bottom: 8px;">
          <p style="margin: 0;">Fecha: ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          <p style="margin: 0;">Cliente: ${order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Cliente'}</p>
          <p style="margin: 0;">Estado: ${order.status}</p>
          ${order.started_at ? `<p style="margin: 0;">Iniciado: ${format(new Date(order.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
          ${order.ready_at ? `<p style="margin: 0;">Listo: ${format(new Date(order.ready_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
          ${order.delivered_at ? `<p style="margin: 0;">Entregado: ${format(new Date(order.delivered_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 8px;">
          ${order.details.map(detail => `
            <div style="font-size: 14px; margin-bottom: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="max-width: 60%; word-wrap: break-word;">${detail.quantity}x ${detail.product.name}</span>
                <span>${formatCurrency(detail.subtotal)}</span>
              </div>
              ${detail.product_variant && detail.product_variant?.variant
                ? `<div style="padding-left: 12px; color: #000; font-size: 14px;">Variante: ${detail.product_variant?.variant.name}</div>`
                : ''}
              ${detail.ingredients && detail.ingredients.length
                ? `<div style="padding-left: 12px; color: #000; font-size: 14px;"> ${detail.ingredients.map(ing => ing.name).join(', ')}</div>`
                : ''}
            </div>
          `).join('')}
        </div>

        <div style="font-size: 16px; text-align: right; font-weight: bold; margin-bottom: 8px;">
          Total: ${formatCurrency(order.total)}
        </div>
      </div>
    `;

    // Write the print content with 80mm paper configuration
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 8px;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${tempContainer.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Print and remove iframe
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={handleBackdropClick}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-darkbg-lighter shadow-2xl flex flex-col z-50 transform transition-transform duration-200 ease-out">
        {/* Header with gradient */}
        <div className="relative px-4 sm:px-6 py-5 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border-b border-gray-200 dark:border-darkbg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pedido #{order.id}
              </h2>
              {order.scheduled_delivery_time && (
                <div className="flex items-center gap-2 mt-1">
                  <CalendarClock className="w-4 h-4 text-primary dark:text-secondary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Programado
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-darkbg/50 rounded-lg transition-colors touch-manipulation"
                aria-label="Enviar notificación"
                title="Enviar notificación"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-darkbg/50 rounded-lg transition-colors touch-manipulation"
                aria-label="Imprimir pedido (80mm)"
                title="Imprimir en papel de 80mm"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-darkbg/50 rounded-lg transition-colors touch-manipulation"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      {showNotificationModal && (
        <NotificationModal
          order={order}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-darkbg">
          <div className="space-y-6">
            {/* Scheduled Order Alert Banner */}
            {order.scheduled_delivery_time && alertInfo && (
              <div className={`p-4 rounded-xl border-2 ${
                alertInfo.level === 'delivered'
                  ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
                  : alertInfo.level === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : alertInfo.level === 'urgent'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                  : alertInfo.level === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              }`}>
                <div className="flex items-start gap-3">
                  {alertInfo.level === 'delivered' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-400 mt-0.5" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      alertInfo.level === 'critical' ? 'text-red-600 dark:text-red-400' :
                      alertInfo.level === 'urgent' ? 'text-orange-600 dark:text-orange-400' :
                      alertInfo.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      alertInfo.level === 'delivered' ? 'text-gray-800 dark:text-gray-200' :
                      alertInfo.level === 'critical' ? 'text-red-800 dark:text-red-200' :
                      alertInfo.level === 'urgent' ? 'text-orange-800 dark:text-orange-200' :
                      alertInfo.level === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      {alertInfo.badgeText}
                    </p>
                    <p className={`text-sm mt-1 ${
                      alertInfo.level === 'delivered' ? 'text-gray-600 dark:text-gray-400' :
                      alertInfo.level === 'critical' ? 'text-red-600 dark:text-red-400' :
                      alertInfo.level === 'urgent' ? 'text-orange-600 dark:text-orange-400' :
                      alertInfo.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      Hora programada: {format(new Date(order.scheduled_delivery_time), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Estado del Pedido */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkbg dark:to-darkbg-darker rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Estado del Pedido
              </label>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white text-base font-medium touch-manipulation shadow-sm transition-all"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Detalles del Pedido */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Productos Ordenados
              </h3>
              <div className="space-y-3">
                {order.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-darkbg-lighter dark:to-darkbg rounded-xl p-4 shadow-sm border border-gray-200 dark:border-darkbg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-semibold">
                          {detail.quantity}x {detail.product?.name || 'Producto'}
                        </p>
                        {detail.product_variant?.variant && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
                            Variante: {detail.product_variant?.variant?.name || 'Estándar'}
                          </p>
                        )}
                        {detail.ingredients && detail.ingredients.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
                            Personalización: {detail.ingredients.map(ing => ing.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatCurrency(detail.unit_price)} c/u
                        </p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-bold text-lg flex-shrink-0">
                        {formatCurrency(detail.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-5 shadow-lg border-2 border-primary/20 dark:border-secondary/20">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-semibold text-lg">Total del Pedido</span>
                <span className="text-primary dark:text-secondary text-2xl font-bold">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {/* Información del Cliente */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Información del Cliente
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkbg dark:to-darkbg-darker rounded-xl p-5 shadow-sm border border-gray-200 dark:border-darkbg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-900 dark:text-white font-semibold text-base">
                    {order.user?.first_name} {order.user?.last_name}
                  </p>
                  {order.user?.phone && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=52${order.user.phone}&text=Hola`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                      aria-label="Contactar por WhatsApp"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  )}
                </div>
                {order.user?.faculty && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary dark:bg-secondary"></span>
                    Facultad de {order.user.faculty}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline del Pedido */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Cronología del Pedido
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="bg-blue-500 dark:bg-blue-600 rounded-full p-2 mt-0.5">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Pedido Recibido</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {format(new Date(order.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {order.started_at && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                    <div className="bg-orange-500 dark:bg-orange-600 rounded-full p-2 mt-0.5">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">Preparación Iniciada</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {format(new Date(order.started_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {order.ready_at && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                    <div className="bg-green-500 dark:bg-green-600 rounded-full p-2 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 dark:text-green-200">Pedido Listo</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {format(new Date(order.ready_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/20 dark:to-gray-800/10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="bg-gray-500 dark:bg-gray-600 rounded-full p-2 mt-0.5">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">Pedido Entregado</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {format(new Date(order.delivered_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de notificaciones */}
            {notifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Historial de notificaciones
                </h3>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="bg-gradient-to-br from-white to-gray-50 dark:from-darkbg-lighter dark:to-darkbg rounded-xl p-4 shadow-sm border border-gray-200 dark:border-darkbg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {n.message}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold flex-shrink-0">
                          {format(new Date(n.created_at), 'HH:mm')}
                        </p>
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(n.created_at), "d 'de' MMMM 'de' yyyy'", { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}