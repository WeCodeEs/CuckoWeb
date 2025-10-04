import React, { useEffect } from 'react';
import { useOrderStore, OrderStatus } from '../stores/orderStore';
import { supabase } from '../lib/supabase';
import PedidoCard from '../components/pedidos/PedidoCard';
import PedidoDrawer from '../components/pedidos/PedidoDrawer';
import PrintPreviewModal from '../components/pedidos/PrintPreviewModal';
import DeliveredOrdersHistoryModal from '../components/pedidos/DeliveredOrdersHistoryModal';
import SkeletonKanbanCard from '../components/skeletons/SkeletonKanbanCard';
import { Printer, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { useToast } from '../components/ui/use-toast';
import { generateMultipleTestOrders } from '../utils/testOrderGenerator';

// Function to delete all orders
const deleteAllOrders = async () => {
  try {
    // Delete all orders - CASCADE will handle order_details automatically
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', 0); // Delete all orders
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting orders:', error);
    throw error;
  }
};

const columns: { status: OrderStatus; title: string }[] = [
  { status: 'Recibido', title: 'Recibidos' },
  { status: 'EnPreparacion', title: 'En Preparación' },
  { status: 'Listo', title: 'Listos' },
  { status: 'Entregado', title: 'Entregados' },
];

function DroppableColumn({ 
  status, 
  title, 
  children,
  enableDrop = true
}: { 
  status: OrderStatus; 
  title: string; 
  children: React.ReactNode;
  enableDrop?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: !enableDrop,
  });

  return (
    <div
      ref={enableDrop ? setNodeRef : undefined}
      aria-label={`${title} column`}
      className={`flex-1 min-w-[280px] md:min-w-[300px] md:max-w-[400px] flex flex-col bg-gray-100 dark:bg-darkbg-darker rounded-xl p-3 md:p-4 transition-all duration-200 ${
        isOver && enableDrop ? 'ring-2 ring-primary dark:ring-secondary ring-inset bg-gray-200 dark:bg-darkbg' : ''
      }`}
    >
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs bg-gray-200 dark:bg-darkbg px-2 py-1 rounded-full">
          {React.Children.count(children)}
        </span>
      </h2>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 md:space-y-4 min-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-darkbg">
        {children}
      </div>
    </div>
  );
}

export default function Orders() {
  const {
    orders,
    loading,
    error,
    selectedOrder,
    isDrawerOpen,
    fetchOrders,
    updateOrderStatus,
    setSelectedOrder,
    setIsDrawerOpen,
    subscribeToOrders,
    unsubscribeFromOrders,
  } = useOrderStore();

  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [deliveredDateFilter, setDeliveredDateFilter] = React.useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const { toast } = useToast();

  const deliveredOrders = React.useMemo(() => {
    const delivered = orders.filter((order) => order.status === 'Entregado' && order.delivered_at);

    if (!deliveredDateFilter) {
      return delivered;
    }

    return delivered.filter((order) => {
      const deliveredDate = new Date(order.delivered_at as string);
      if (Number.isNaN(deliveredDate.getTime())) {
        return false;
      }

      const formattedDate = deliveredDate.toISOString().split('T')[0];
      return formattedDate === deliveredDateFilter;
    });
  }, [orders, deliveredDateFilter]);

  // Enhanced device detection
  useEffect(() => {
    const detectDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsTouchDevice(hasTouch || isMobileUA);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  // Configure sensors with enhanced touch support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
        delay: 100,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    })
  );

  useEffect(() => {
    const initializeOrders = async () => {
      try {
        await fetchOrders();
        subscribeToOrders();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (error) {
            console.log('Notification permission request failed:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize orders:', error);
      }
    };

    initializeOrders();

    return () => {
      unsubscribeFromOrders();
    };
  }, [fetchOrders, subscribeToOrders, unsubscribeFromOrders]);

  const handleOrderClick = (order: any) => {
    if (!activeId) {
      setSelectedOrder(order);
      setIsDrawerOpen(true);
    }
  };

  const handlePrintOrder = (order: any) => {
    // Create an iframe for printing the order
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Get the iframe document
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al preparar la impresión',
      });
      return;
    }

    // Create the print content
    const printContent = `
      <div style="width: 80mm; padding: 8px; font-family: monospace;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 18px; margin: 0 0 4px 0; font-weight: bold;">CuckooEats</h1>
          <p style="font-size: 12px; margin: 0;">Pedido #${order.id}</p>
        </div>
        
        <div style="font-size: 11px; margin-bottom: 8px;">
          <p style="margin: 0;">Fecha: ${new Date(order.created_at).toLocaleString('es-PE')}</p>
          <p style="margin: 0;">Cliente: ${order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Cliente'}</p>
          <p style="margin: 0;">Estado: ${order.status}</p>
          ${order.started_at ? `<p style="margin: 0;">Iniciado: ${new Date(order.started_at).toLocaleString('es-PE')}</p>` : ''}
          ${order.ready_at ? `<p style="margin: 0;">Listo: ${new Date(order.ready_at).toLocaleString('es-PE')}</p>` : ''}
          ${order.delivered_at ? `<p style="margin: 0;">Entregado: ${new Date(order.delivered_at).toLocaleString('es-PE')}</p>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 8px;">
          ${order.details.map(detail => `
            <div style="font-size: 11px; margin-bottom: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="max-width: 60%; word-wrap: break-word;">${detail.quantity}x ${detail.product.name}</span>
                <span>$${detail.subtotal.toFixed(2)}</span>
              </div>
              ${detail.product.variant ? `<div style="padding-left: 12px; color: #666; font-size: 10px;">${detail.product.variant.name}</div>` : ''}
              ${detail.notes ? `<div style="padding-left: 12px; color: #666; font-size: 10px;">Nota: ${detail.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div style="font-size: 14px; text-align: right; font-weight: bold; margin-bottom: 8px;">
          Total: $${order.total.toFixed(2)}
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
          ${printContent}
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

    toast({
      title: 'Imprimiendo',
      description: `Pedido #${order.id} enviado a impresora`,
      className: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const orderId = Number(active.id);
    const newStatus = over.id as OrderStatus;
    const order = orders.find(o => o.id === orderId);

    if (!order || order.status === newStatus) {
      setActiveId(null);
      return;
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Estado actualizado',
        description: `Pedido #${orderId} movido a ${columns.find(c => c.status === newStatus)?.title}`,
        className: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar el estado del pedido',
      });
    }

    setActiveId(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center w-full">
          <p className="text-lg font-medium text-red-800 dark:text-red-400">
            Error al cargar los pedidos
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-darkbg transition-colors duration-200">
      <div className="h-full flex flex-col p-3 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-dark dark:text-white">
              Pedidos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Gestiona los pedidos del sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await generateMultipleTestOrders(1);
                  toast({
                    title: 'Pedidos de prueba creados',
                    description: 'Se han creado 1 pedidos de prueba con datos reales',
                  });
                } catch (error: any) {
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Error al crear pedidos de prueba',
                  });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-secondary bg-white dark:bg-darkbg-lighter rounded-xl hover:bg-primary/5 dark:hover:bg-darkbg transition-colors border border-primary/20 dark:border-secondary/20"
            >
              <Plus className="w-4 h-4" />
              Crear Pedidos de Prueba
            </button>
            <button
              onClick={async () => {
                if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los pedidos? Esta acción no se puede deshacer.')) {
                  try {
                    await deleteAllOrders();
                    await fetchOrders();
                    toast({
                      title: 'Pedidos eliminados',
                      description: 'Todos los pedidos han sido eliminados exitosamente',
                      className: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
                    
                    });
                  } catch (error: any) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: error.message || 'Error al eliminar los pedidos',
                    });
                  }
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Todos
            </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-secondary bg-white dark:bg-darkbg-lighter rounded-xl hover:bg-primary/5 dark:hover:bg-darkbg transition-colors border border-primary/20 dark:border-secondary/20"
            >
              <Printer className="w-4 h-4" />
              Prueba de Impresión
            </button>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
            >
              Ver historial
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-6 min-h-0 overflow-x-auto">
            {columns.map(({ status, title }) => (
              <DroppableColumn 
                key={status} 
                status={status} 
                title={title}
                enableDrop={true}
              >
                {loading ? (
                  <>
                    <SkeletonKanbanCard />
                    <SkeletonKanbanCard />
                    <SkeletonKanbanCard />
                  </>
                ) : (
                  orders
                    .filter((order) => order.status === status)
                    .map((order) => (
                      <PedidoCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                        onPrint={() => handlePrintOrder(order)}
                        isDragging={activeId === order.id}
                        enableDrag={true}
                      />
                    ))
                )}
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <PedidoCard
                order={orders.find(o => o.id === activeId)!}
                onClick={() => {}}
                onPrint={() => {}}
                isDragging
                enableDrag={false}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="mt-6 bg-white dark:bg-darkbg-lighter rounded-xl shadow-sm border border-gray-200 dark:border-darkbg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de pedidos entregados</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Consulta los pedidos marcados como entregados y filtra por fecha de entrega.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="delivered-date-filter" className="text-sm text-gray-700 dark:text-gray-200">
              Fecha de entrega
            </label>
            <input
              id="delivered-date-filter"
              type="date"
              value={deliveredDateFilter}
              onChange={(event) => setDeliveredDateFilter(event.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary"
            />
            {deliveredDateFilter && (
              <button
                onClick={() => setDeliveredDateFilter('')}
                className="text-sm text-primary dark:text-secondary hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {deliveredOrders.length > 0 ? (
                deliveredOrders.map((order) => (
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

      {showPrintPreview && (
        <PrintPreviewModal onClose={() => setShowPrintPreview(false)} />
      )}

      {isHistoryModalOpen && (
        <DeliveredOrdersHistoryModal
          orders={deliveredOrders}
          deliveredDateFilter={deliveredDateFilter}
          onDateFilterChange={setDeliveredDateFilter}
          onClearFilter={() => setDeliveredDateFilter('')}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
}