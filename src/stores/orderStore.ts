import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type OrderStatus = 'Recibido' | 'EnPreparacion' | 'Listo' | 'Entregado';

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

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  selectedOrder: Order | null;
  isDrawerOpen: boolean;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
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
          if (payload.eventType === 'INSERT') {
            try {
              if ('Audio' in window && document.hasFocus()) {
                const audio = new Audio('/assets/new-order.mp3');
                audio.volume = 0.5;
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
            } catch (error) {
              console.error('Error handling new order notification:', error);
            }
          }
          await get().fetchOrders();
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

    fetchOrders: async () => {
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

        set({ orders: transformedData as Order[] || [], loading: false });
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
        set({ loading: true, error: null });

        const current = get().orders.find(o => o.id === id) || null;
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

        await get().fetchOrders();
      } catch (error: any) {
        console.error('Error updating order status:', error);
        set({
          error: error.message || 'Error al actualizar el estado del pedido',
          loading: false
        });
        throw error;
      }
    },

    setSelectedOrder: (order) => set({ selectedOrder: order }),
    setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
    subscribeToOrders,
    unsubscribeFromOrders,
  };
});