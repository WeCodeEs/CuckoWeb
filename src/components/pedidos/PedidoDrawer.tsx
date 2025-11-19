import React from 'react';
import { X, Printer, Clock, CheckCircle, Truck, Play } from 'lucide-react';
import { Order, OrderStatus } from '../../stores/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
          <h1 style="font-size: 18px; margin: 0 0 4px 0; font-weight: bold;">CuckooEats</h1>
          <p style="font-size: 12px; margin: 0;">Pedido #${order.id}</p>
        </div>
        
        <div style="font-size: 11px; margin-bottom: 8px;">
          <p style="margin: 0;">Fecha: ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          <p style="margin: 0;">Cliente: ${order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Cliente'}</p>
          <p style="margin: 0;">Estado: ${order.status}</p>
          ${order.started_at ? `<p style="margin: 0;">Iniciado: ${format(new Date(order.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
          ${order.ready_at ? `<p style="margin: 0;">Listo: ${format(new Date(order.ready_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
          ${order.delivered_at ? `<p style="margin: 0;">Entregado: ${format(new Date(order.delivered_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 8px;">
          ${order.details.map(detail => `
            <div style="font-size: 11px; margin-bottom: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="max-width: 60%; word-wrap: break-word;">${detail.quantity}x ${detail.product.name}</span>
                <span>${formatCurrency(detail.subtotal)}</span>
              </div>
              ${detail.product.variant ? `<div style="padding-left: 12px; color: #666; font-size: 10px;">${detail.product.variant.name}</div>` : ''}
              ${detail.notes ? `<div style="padding-left: 12px; color: #666; font-size: 10px;">Nota: ${detail.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div style="font-size: 14px; text-align: right; font-weight: bold; margin-bottom: 8px;">
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
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-darkbg-lighter shadow-xl flex flex-col z-50 transform transition-transform duration-200 ease-out">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Pedido #{order.id}
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors touch-manipulation"
              aria-label="Imprimir pedido (80mm)"
              title="Imprimir en papel de 80mm"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors touch-manipulation"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-darkbg">
          <div className="space-y-6">
            {/* Estado del Pedido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado del Pedido
              </label>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white text-base touch-manipulation"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeline del Pedido */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cronología del Pedido
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Pedido Recibido</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {format(new Date(order.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {order.started_at && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <Play className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Preparación Iniciada</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        {format(new Date(order.started_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {order.ready_at && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Pedido Listo</p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {format(new Date(order.ready_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/10 rounded-lg">
                    <Truck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">Pedido Entregado</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(order.delivered_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información del Cliente */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Información del Cliente
              </h3>
              <div className="bg-gray-50 dark:bg-darkbg rounded-lg p-4">
                <p className="text-gray-900 dark:text-white font-medium">
                  {order.user?.first_name} {order.user?.last_name}
                </p>
                {order.user?.faculty_id && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Facultad {order.user.faculty_id}
                  </p>
                )}
              </div>
            </div>

            {/* Detalles del Pedido */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Productos Ordenados
              </h3>
              <div className="space-y-3">
                {order.details.map((detail) => (
                  <div 
                    key={detail.id}
                    className="bg-gray-50 dark:bg-darkbg rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {detail.quantity}x {detail.product?.name || 'Producto'}
                        </p>
                        {detail.product.variant && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Variante: {detail.product.variant?.name || 'Estándar'}
                          </p>
                        )}
                        {/* Check for ingredients and display them */}
                        {detail.ingredients && detail.ingredients.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Personalización: {detail.ingredients.map(ing => ing.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatCurrency(detail.unit_price)} c/u
                        </p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium flex-shrink-0">
                        {formatCurrency(detail.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-darkbg pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total del Pedido</span>
                <span className="text-primary dark:text-secondary text-xl">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}