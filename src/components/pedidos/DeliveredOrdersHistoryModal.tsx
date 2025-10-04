import React from 'react';
import { X } from 'lucide-react';
import { Order } from '../../stores/orderStore';

interface DeliveredOrdersHistoryModalProps {
  orders: Order[];
  deliveredDateFilter: string;
  onDateFilterChange: (value: string) => void;
  onClearFilter: () => void;
  onClose: () => void;
}

export default function DeliveredOrdersHistoryModal({
  orders,
  deliveredDateFilter,
  onDateFilterChange,
  onClearFilter,
  onClose,
}: DeliveredOrdersHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl w-full max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg">
          <div>
            <h2 className="text-lg font-bold text-primary-dark dark:text-white">
              Historial de pedidos entregados
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Consulta los pedidos marcados como entregados y filtra por fecha de entrega.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors"
            aria-label="Cerrar historial"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="delivered-date-filter" className="text-sm text-gray-700 dark:text-gray-200">
                Fecha de entrega
              </label>
              <input
                id="delivered-date-filter"
                type="date"
                value={deliveredDateFilter}
                onChange={(event) => onDateFilterChange(event.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary"
              />
              {deliveredDateFilter && (
                <button
                  onClick={onClearFilter}
                  className="text-sm text-primary dark:text-secondary hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg-darker transition-colors"
            >
              Cerrar
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-darkbg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50 dark:bg-darkbg">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-darkbg divide-y divide-gray-200 dark:divide-darkbg">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-darkbg-darker transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Cliente'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        S/. {order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {order.delivered_at ? new Date(order.delivered_at).toLocaleString('es-PE') : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                      {deliveredDateFilter
                        ? 'No se encontraron pedidos entregados para la fecha seleccionada.'
                        : 'Aún no hay pedidos entregados registrados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
