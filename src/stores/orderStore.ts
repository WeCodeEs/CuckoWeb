import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type OrderStatus = 'Recibido' | 'EnPreparacion' | 'Listo' | 'Entregado';
export type NotificationType = 'NotificacionGeneral' | 'NotificacionPersonal' | 'PedidoRecibido' | 'PedidoEnPreparacion' | 'PedidoListo' | 'PedidoEntregado';

function sortOrders(orders: Order[]): Order[] {
  return orders.sort((a, b) => {
    if (a.status === 'Recibido' && b.status === 'Recibido') {
      const aHasScheduled = !!a.scheduled_delivery_time;
      const bHasScheduled = !!b.scheduled_delivery_time;

      if (!aHasScheduled && bHasScheduled) return -1;
      if (aHasScheduled && !bHasScheduled) return 1;

      if (!aHasScheduled && !bHasScheduled) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return new Date(a.scheduled_delivery_time!).getTime() - new Date(b.scheduled_delivery_time!).getTime();
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export interface OrderItemOption {
  id: number;
  option_id: number | null;
  price_at_moment: number;
  quantity: number;
  option_name: string;
  option_group_name: string;
  option: {
    name: string;
    option_group: {
      name: string;
    };
  } | null;
}

export interface OrderDetail {
  id: number;
  product_id: number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  product_image_url: string | null;
  product: {
    name: string;
  } | null;
  options?: OrderItemOption[];
}

export type PaymentStatus = 'pending_payment' | 'paid' | 'payment_failed' | 'canceled';

export interface Order {
  id: number;
  user_uuid: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
  started_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  updated_at: string;
  scheduled_delivery_time?: string | null;
  details: OrderDetail[];
  user?: {
    uuid: string;
    first_name: string;
    last_name: string;
    faculty?: string;
    phone?: string;
  };
}

export interface OrderNotification {
  id: number;
  order_id: number | null;
  user_uuid: string | null;
  title: string;
  message: string;
  type: NotificationType;
  created_at: string;
}

export type OrderTypeFilter = 'Todos' | 'Agendados' | 'Inmediatos';

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  selectedOrder: Order | null;
  isDrawerOpen: boolean;
  fetchOrders: (opts: { startDate: Date; endDate: Date; typeFilter: OrderTypeFilter }) => Promise<void>;
  fetchOrdersToday: (opts?: { silent?: boolean }) => Promise<void>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  sendPersonalNotification: (order: Order, title: string, body: string) => Promise<void>;
  fetchNotificationsByOrder: (orderId: number) => Promise<OrderNotification[]>;
  setSelectedOrder: (order: Order | null) => void;
  setIsDrawerOpen: (isOpen: boolean) => void;
  subscribeToOrders: () => void;
  unsubscribeFromOrders: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => {
  let subscription: any = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedSilentFetch = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      get().fetchOrdersToday({ silent: true });
    }, 1500);
  };

  const subscribeToOrders = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }

    subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            try {
              const { new: newRow, old: oldRow } = payload;
              if (newRow.status === 'Recibido' && oldRow.status !== 'Recibido') {
                if ('Audio' in window) {
                  const audio = new Audio('/assets/new-order.mp3');
                  audio.volume = 0.7;
                  await audio.play().catch(e => console.log('Audio play failed:', e));
                }

                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Nuevo Pedido', {
                    body: `Pedido #${payload.new.id} recibido`,
                    icon: '/vite.svg',
                    tag: 'new-order',
                    requireInteraction: false,
                    silent: false
                  });
                }
              }
            } catch (error) {
              console.error('Error handling new order notification:', error);
            }
          }
          debouncedSilentFetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscrito exitosamente a las órdenes de hoy.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error al suscribirse a las órdenes.');
        }
      });
  };

  const unsubscribeFromOrders = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  };

  const transformOrderData = (data: any[]): Order[] => {
    return data.map((order: any) => {
      if (order.details) {
        order.details = order.details.map((detail: any) => {
          const productName = detail.product_name || detail.product?.name || 'Producto eliminado';
          const productImageUrl = detail.product_image_url ?? null;
          if (detail.options) {
            detail.options = detail.options.map((opt: any) => ({
              id: opt.id,
              option_id: opt.option_id,
              option_name: opt.option_name || opt.option?.name || 'Opcion eliminada',
              option_group_name: opt.option_group_name || opt.option?.option_group?.name || '',
              price_at_moment: opt.price_at_moment,
              quantity: opt.quantity,
              option: opt.option ? {
                name: opt.option.name,
                option_group: {
                  name: opt.option.option_group?.name || ''
                }
              } : null
            }));
          }
          return {
            ...detail,
            product_name: productName,
            product_image_url: productImageUrl,
          };
        });
      }
      return order;
    });
  };

  return {
    orders: [],
    loading: false,
    error: null,
    selectedOrder: null,
    isDrawerOpen: false,

    fetchOrders: async ({ startDate, endDate, typeFilter }) => {
      try {
        set({ loading: true, error: null });

        let query = supabase
          .from('orders')
          .select(`
            id,
            user_uuid,
            status,
            total,
            created_at,
            started_at,
            ready_at,
            delivered_at,
            updated_at,
            scheduled_delivery_time,
            user:users (
              uuid,
              first_name,
              last_name,
              faculty,
              phone
            ),
            details:order_details (
              id,
              product_id,
              product_name,
              product_image_url,
              quantity,
              unit_price,
              subtotal,
              product:products (name),
              options:order_item_options (
                id,
                option_id,
                option_name,
                option_group_name,
                price_at_moment,
                quantity,
                option:options!order_item_options_option_id_fkey (
                  name,
                  option_group:option_groups (name)
                )
              )
            )
          `)
          .eq('payment_status', 'paid')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        if (typeFilter === 'Agendados') {
          query = query.not('scheduled_delivery_time', 'is', null);
        } else if (typeFilter === 'Inmediatos') {
          query = query.is('scheduled_delivery_time', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        const transformedData = transformOrderData(data || []);
        const sortedOrders = sortOrders(transformedData);

        set({ orders: sortedOrders, loading: false });
      } catch (error: any) {
        console.error('Error fetching orders (history):', error);
        set({
          error: error.message || 'Error al cargar los pedidos',
          loading: false
        });
      }
    },

    fetchOrdersToday: async (opts) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) {
          set({ loading: true, error: null });
        }

        const { data, error } = await supabase
          .from('orders_today')
          .select(`
            id,
            user_uuid,
            status,
            total,
            created_at,
            started_at,
            ready_at,
            delivered_at,
            updated_at,
            scheduled_delivery_time,
            user:users (
              uuid,
              first_name,
              last_name,
              faculty,
              phone
            ),
            details:order_details (
              id,
              product_id,
              product_name,
              product_image_url,
              quantity,
              unit_price,
              subtotal,
              product:products (name),
              options:order_item_options (
                id,
                option_id,
                option_name,
                option_group_name,
                price_at_moment,
                quantity,
                option:options!order_item_options_option_id_fkey (
                  name,
                  option_group:option_groups (name)
                )
              )
            )
          `)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData = transformOrderData(data || []);
        const sortedOrders = sortOrders(transformedData);

        const { selectedOrder } = get();
        const updatedSelected = selectedOrder
          ? sortedOrders.find(o => o.id === selectedOrder.id) ?? null
          : null;

        set({
          orders: sortedOrders,
          loading: false,
          selectedOrder: updatedSelected,
        });
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        if (!silent) {
          set({
            error: error.message || 'Error al cargar los pedidos',
            loading: false
          });
        }
      }
    },

    updateOrderStatus: async (id: number, status: OrderStatus) => {
      const snapshot = get().orders;
      const snapshotSelected = get().selectedOrder;

      try {
        const current = snapshot.find(o => o.id === id) || null;
        if (!current) {
          throw new Error('Pedido no encontrado en memoria.');
        }

        if (current.status === status) {
          return;
        }

        const STATUS_ORDER: Record<OrderStatus, number> = {
          Recibido: 0,
          EnPreparacion: 1,
          Listo: 2,
          Entregado: 3,
        };

        const currentRank = STATUS_ORDER[current.status];
        const nextRank = STATUS_ORDER[status];

        if (nextRank < currentRank) {
          throw new Error('No puedes retroceder el estado del pedido.');
        }

        const now = new Date().toISOString();
        const updateData: Record<string, any> = { status };

        switch (status) {
          case 'Recibido': {
            updateData.started_at = null;
            updateData.ready_at = null;
            updateData.delivered_at = null;
            break;
          }
          case 'EnPreparacion': {
            updateData.started_at = now;
            updateData.ready_at = null;
            updateData.delivered_at = null;
            break;
          }
          case 'Listo': {
            updateData.ready_at = now;
            if (!current?.started_at) {
              updateData.started_at = now;
            }
            updateData.delivered_at = null;
            break;
          }
          case 'Entregado': {
            updateData.delivered_at = now;
            if (!current?.ready_at) {
              updateData.ready_at = now;
            }
            if (!current?.started_at) {
              updateData.started_at = now;
            }
            break;
          }
        }

        const optimisticOrder: Order = {
          ...current,
          status,
          started_at: updateData.started_at !== undefined ? updateData.started_at : current.started_at,
          ready_at: updateData.ready_at !== undefined ? updateData.ready_at : current.ready_at,
          delivered_at: updateData.delivered_at !== undefined ? updateData.delivered_at : current.delivered_at,
          updated_at: now,
        };

        const optimisticOrders = sortOrders(
          snapshot.map(o => (o.id === id ? optimisticOrder : o))
        );

        const optimisticSelected =
          snapshotSelected?.id === id ? optimisticOrder : snapshotSelected;

        set({
          orders: optimisticOrders,
          selectedOrder: optimisticSelected,
        });

        const { data, error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('No se pudo actualizar el pedido. Verifique que el pedido existe y que tiene permisos para modificarlo.');
        }
      } catch (error: any) {
        console.error('Error updating order status:', error);
        set({ orders: snapshot, selectedOrder: snapshotSelected });
        throw error;
      }
    },

    sendPersonalNotification: async (order: Order, title: string, body: string) => {
      if (!order?.user_uuid) {
        throw new Error('El pedido no tiene un usuario asociado.');
      }
      if (!title?.trim() || !body?.trim()) {
        throw new Error('Título y cuerpo son requeridos.');
      }

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        throw new Error('No fue posible procesar la solicitud');
      }
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('No fue posible procesar la solicitud. Inicia sesión nuevamente.');
      }

      const { data: sendResp, error: sendErr } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'NotificacionPersonal',
          user_uuid: order.user_uuid,
          title,
          body,
          order_id: order.id,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (sendErr || sendResp?.success !== true) {
        throw new Error('No fue posible enviar la notificación al usuario.');
      }
    },

    fetchNotificationsByOrder: async (orderId: number) => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, order_id, user_uuid, title, message, type, created_at')
          .eq('order_id', orderId)
          .eq('type', 'NotificacionPersonal')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []) as OrderNotification[];
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        return [];
      }
    },

    setSelectedOrder: (order) => set({ selectedOrder: order }),
    setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
    subscribeToOrders,
    unsubscribeFromOrders,
  };
});
