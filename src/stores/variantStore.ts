import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Variant {
  id: number;
  product_id: number;
  name: string;
  additional_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface VariantForm {
  name: string;
  additional_price: number;
  active: boolean;
}

interface VariantState {
  variants: Variant[];
  loading: boolean;
  error: string | null;
  fetchVariants: (productId: number) => Promise<void>;
  createVariant: (productId: number, variant: VariantForm) => Promise<void>;
  updateVariant: (id: number, variant: Partial<Variant>) => Promise<void>;
  deleteVariant: (id: number) => Promise<void>;
}

export const useVariantStore = create<VariantState>((set) => ({
  variants: [],
  loading: false,
  error: null,

  fetchVariants: async (productId: number) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ variants: data || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar las variantes',
        loading: false 
      });
    }
  },

  createVariant: async (productId: number, variant: VariantForm) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variants')
        .insert([{ ...variant, product_id: productId }])
        .select()
        .single();

      if (error) throw error;

      const { data: updatedVariants, error: fetchError } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      set({ variants: updatedVariants || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear la variante',
        loading: false 
      });
    }
  },

  updateVariant: async (id: number, variant: Partial<Variant>) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variants')
        .update(variant)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        loading: false,
        variants: state.variants.map(v => 
          v.id === id ? { ...v, ...variant } : v
        )
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar la variante',
        loading: false 
      });
    }
  },

  deleteVariant: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        loading: false,
        variants: state.variants.filter(v => v.id !== id)
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar la variante',
        loading: false 
      });
    }
  },
}));