import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type OrderStatus = 'Recibido' | 'EnPreparacion' | 'Listo' | 'Entregado';
export type NotificationType = 'NotificacionGeneral' | 'NotificacionPersonal' | 'PedidoRecibido' | 'PedidoEnPreparacion' | 'PedidoListo' | 'PedidoEntregado';

// Helper function to sort orders with custom logic
function sortOrders(orders: Order[]): Order[] {
  return orders.sort((a, b) => {
    // Only apply custom sorting for "Recibido" status
    if (a.status === 'Recibido' && b.status === 'Recibido') {
      const aHasScheduled = !!a.scheduled_delivery_time;
      const bHasScheduled = !!b.scheduled_delivery_time;

      // Both have scheduled times - sort by scheduled time (earliest first)
      if (aHasScheduled && bHasScheduled) {
        return new Date(a.scheduled_delivery_time!).getTime() - new Date(b.scheduled_delivery_time!).getTime();
      }

      // Scheduled orders come before non-scheduled
      if (aHasScheduled && !bHasScheduled) return -1;
      if (!aHasScheduled && bHasScheduled) return 1;

      // Both are non-scheduled - sort by created_at (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    // For other statuses, sort by created_at (newest first for default behavior)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export interface OrderDetail {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: {
    name: string;
  };
  product_variant?: {
    variant: {
      name: string;
    };
  };
  ingredients?: Array<{
    name: string;
    extra_price?: number;
  }>;
}

export interface Order {
  id: number;
  user_uuid: string;
  status: OrderStatus;
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

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  selectedOrder: Order | null;
  isDrawerOpen: boolean;
  fetchOrders: (opts: { startDate: Date; endDate: Date; typeFilter: OrderTypeFilter }) => Promise<void>;
  fetchOrdersToday: () => Promise<void>;
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
                // Play sound regardless of window focus
                if ('Audio' in window) {
                  const audio = new Audio('/assets/new-order.mp3');
                  audio.volume = 0.7;
                  await audio.play().catch(e => console.log('Audio play failed:', e));
                }

                // Show notification regardless of window focus
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
          await get().fetchOrdersToday();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscrito exitosamente a las órdenes de hoy.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error al subscribirse a las órdenes.');
        }
      });
  };

  const unsubscribeFromOrders = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
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
              faculty
            ),
            details:order_details (
              id,
              product_id,
              product_variant_id,
              quantity,
              unit_price,
              subtotal,
              product:products (name),
              product_variant:product_variants (
                variant:variant_options (name)
              ),
              ingredients:order_detail_ingredients (
                ingredient:ingredient_options (
                  name,
                  extra_price
                )
              )
            )
          `)
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

        let transformedData = data;
        if (transformedData) {
          transformedData = transformedData.map((order: any) => {
            if (order.details) {
              order.details = order.details.map((detail: any) => {
                if (detail.ingredients) {
                  detail.ingredients = detail.ingredients.map((ing: any) => ({
                    name: ing.ingredient.name,
                    extra_price: ing.ingredient.extra_price
                  }));
                }
                return detail;
              });
            }
            return order;
          });
        }

        // Sort orders with custom logic
        const sortedOrders = sortOrders(transformedData as Order[] || []);

        set({ orders: sortedOrders, loading: false });
      } catch (error: any) {
        console.error('Error fetching orders (history):', error);
        set({
          error: error.message || 'Error al cargar los pedidos',
          loading: false
        });
      }
    },

    fetchOrdersToday: async () => {
      try {
        set({ loading: true, error: null });

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
              faculty
            ),
            details:order_details (
              id,
              product_id,
              product_variant_id,
              quantity,
              unit_price,
              subtotal,
              product:products (name),
              product_variant:product_variants (
                variant:variant_options (name)
              ),
              ingredients:order_detail_ingredients (
                ingredient:ingredient_options (
                  name,
                  extra_price
                )
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        let transformedData = data;
        if (transformedData) {
          transformedData = transformedData.map(order => {
            if (order.details) {
              order.details = order.details.map((detail: any) => {
                if (detail.ingredients) {
                  detail.ingredients = detail.ingredients.map((ing: any) => ({
                    name: ing.ingredient.name,
                    extra_price: ing.ingredient.extra_price
                  }));
                }
                return detail;
              });
            }
            return order;
          });
        }

        // Sort orders with custom logic for "Recibido" status
        const sortedOrders = sortOrders(transformedData as Order[] || []);

        set({ orders: sortedOrders, loading: false });
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        set({
          error: error.message || 'Error al cargar los pedidos',
          loading: false
        });
      }
    },

    updateOrderStatus: async (id: number, status: OrderStatus) => {
      try {
        const current = get().orders.find(o => o.id === id) || null;
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

        set({ loading: true });
        const now = new Date().toISOString();
        const updateData: Record<string,any> = { status };

        switch(status){
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
            if(!current?.started_at){
              updateData.started_at = now;
            }
            updateData.delivered_at = null;
            break;
          }
          case 'Entregado': {
            updateData.delivered_at = now;
            if(!current?.ready_at) {
              updateData.ready_at = now;
            }
            if(!current?.started_at) {
              updateData.started_at = now;
            }
            break;
          }
        }

        const { data, error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('No se pudo actualizar el pedido. Verifique que el pedido existe y que tiene permisos para modificarlo.');
        }

        await get().fetchOrdersToday();
      } catch (error: any) {
        console.error('Error updating order status:', error);
        set({ loading: false });
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