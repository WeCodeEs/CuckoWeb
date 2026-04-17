import React, { useEffect, useMemo, useState } from 'react';
import { CircleAlert as AlertCircle, Search, CircleEllipsis, CalendarDays } from 'lucide-react';
import { useOrderStore, Order } from '../stores/orderStore';
import PedidoDrawer from '../components/pedidos/PedidoDrawer';
import DateRangePicker from '../components/DateRangePicker';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import clsx from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatCurrency';

type OrderTypeFilter = 'Todos' | 'Agendados' | 'Inmediatos';

export default function OrderHistory() {
  const {
    orders,
    loading,
    error,
    isDrawerOpen,
    selectedOrder,
    setSelectedOrder,
    setIsDrawerOpen,
    fetchOrders,
    updateOrderStatus,
  } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>('Todos');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0,0,0,0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23,59,59,999);
    return d;
  });

  useEffect(() => {
    fetchOrders({
      startDate,
      endDate,
      typeFilter,
    }).catch((e) => {
      console.error('Error fetching order history:', e);
    });
  }, [fetchOrders, startDate, endDate, typeFilter]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const fullName = `${order.user?.first_name ?? ''} ${order.user?.last_name ?? ''}`.trim().toLowerCase();
      return fullName.includes(term);
    });
  }, [orders, searchTerm]);

  const statusBadge = (status: Order['status']) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Recibido':
        return clsx(base, 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300');
      case 'EnPreparacion':
        return clsx(base, 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300');
      case 'Listo':
        return clsx(base, 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300');
      case 'Entregado':
      default:
        return clsx(base, 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300');
    }
  };

  const tipoBadge = (o: Order) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const isAgendado = !!o.scheduled_delivery_time;
    if (isAgendado) {
      return clsx(base, 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light');
    }
    return clsx(base, 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary-light');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchOrders({ startDate, endDate, typeFilter })}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Historial de Pedidos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Consulta pedidos por rango de fechas, cliente y tipo</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={({ startDate: s, endDate: e }) => {
              const sFixed = new Date(s); sFixed.setHours(0,0,0,0);
              const eFixed = new Date(e); eFixed.setHours(23,59,59,999);
              setStartDate(sFixed);
              setEndDate(eFixed);
            }}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre del cliente…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as OrderTypeFilter)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
        >
          <option value="Todos">Todos los pedidos</option>
          <option value="Agendados">Pedidos Agendados</option>
          <option value="Inmediatos">Pedidos Inmediatos</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={6} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    NÚM PEDIDO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    A NOMBRE DE
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    FECHA DE CREACIÓN
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    HORA AGENDADA
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TOTAL
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                {filteredOrders.map((order) => {
                  const fullName = `${order.user?.first_name ?? ''} ${order.user?.last_name ?? ''}`.trim() || '-';
                  const fecha = format(new Date(order.created_at), "d 'de' MMMM, yyyy' a las 'HH:mm", { locale: es });
                  const creado = format(new Date(order.created_at), "HH:mm", { locale: es });
                  const agendado = order.scheduled_delivery_time ? format(new Date(order.scheduled_delivery_time), "HH:mm", { locale: es }) : null;
                  const preparando = order.started_at ? format(new Date(order.started_at), "HH:mm", { locale: es }) : null;
                  const listo = order.ready_at ? format(new Date(order.ready_at), "HH:mm", { locale: es }) : null;
                  const entregado = order.delivered_at ? format(new Date(order.delivered_at), "HH:mm", { locale: es }) : null;
                  const tipo = order.scheduled_delivery_time ? 'Agendado' : 'Inmediato';
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          #{order.id}
                          {order.is_takeaway ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                              Para Llevar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300">
                              Comer Aquí
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={tipoBadge(order)}>
                          {tipo === 'Inmediato' ? tipo : `Para las ${agendado}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={statusBadge(order.status)}>
                          {order.status === 'Recibido'
                            ? `Recibido a las ${creado}`
                            : order.status === 'EnPreparacion'
                            ? `En preparación a las ${preparando}`
                            : order.status === 'Listo'
                            ? `Listo a las ${listo}`
                            : `Entregado a las ${entregado}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-primary dark:text-secondary">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDrawerOpen(true);
                            }}
                            className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <CircleEllipsis className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay pedidos que coincidan con los filtros</p>
            </div>
          )}
        </div>
      )}

      {isDrawerOpen && selectedOrder && (
        <PedidoDrawer
          order={selectedOrder}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedOrder(null);
          }}
          onStatusChange={(status) => updateOrderStatus(selectedOrder.id, status)}
        />
      )}
    </div>
  );
}