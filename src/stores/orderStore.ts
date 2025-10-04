import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type OrderStatus = 'Recibido' | 'EnPreparacion' | 'Listo' | 'Entregado';

export interface OrderDetail {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    variant?: {
      name?: string;
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
  details: OrderDetail[];
  user?: {
    uuid: string;
    first_name: string;
    last_name: string;
    faculty_id?: number;
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
    // Unsubscribe from any existing subscription
    if (subscription) {
      supabase.removeChannel(subscription);
    }

    subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        }, 
        async (payload) => {
          try {
            // Play sound if supported and user has interacted with page
            if ('Audio' in window && document.hasFocus()) {
              try {
                const audio = new Audio('/assets/new-order.mp3');
                audio.volume = 0.5;
                await audio.play();
              } catch (audioError) {
                console.log('Audio play failed (expected on mobile):', audioError);
              }
            }

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Nuevo Pedido', {
                  body: `Pedido #${payload.new.id} recibido`,
                  icon: '/vite.svg',
                  tag: 'new-order',
                  requireInteraction: false,
                  silent: false
                });
              } catch (notificationError) {
                console.log('Notification failed:', notificationError);
              }
            }

            // Fetch updated orders list
            await get().fetchOrders();
          } catch (error) {
            console.error('Error handling new order notification:', error);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        async () => {
          try {
            await get().fetchOrders();
          } catch (error) {
            console.error('Error handling order update:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to orders');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to orders');
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

        let { data, error } = await supabase
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
            user:users (
              uuid,
              first_name,
              last_name,
              faculty_id
            ),
            details:order_details (
              id,
              product_id,
              variant_option_id,
              product_variant_id,
              quantity,
              unit_price,
              product:products (
                name,
                variant:variant_options!inner (
                  name
                )
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

        // Transform the data to include ingredients in a more accessible format
        if (data) {
          data = data.map(order => {
            if (order.details) {
              order.details = order.details.map(detail => {
                // Transform ingredients from the nested structure to a simpler array
                if (detail.ingredients) {
                  detail.ingredients = detail.ingredients.map(ing => ({
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

        set({ orders: data || [], loading: false });
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

        const { data, error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', id)
          .select();

        if (error) throw error;

        // Check if any rows were updated
        if (!data || data.length === 0) {
          throw new Error('No se pudo actualizar el pedido. Verifique que el pedido existe y que tiene permisos para modificarlo.');
        }

        // Refresh orders list
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