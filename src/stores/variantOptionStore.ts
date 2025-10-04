import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface VariantOption {
  id: number;
  name: string;
  additional_price: number;
  active: boolean;
  created_at: string;
}

interface VariantOptionState {
  options: VariantOption[];
  loading: boolean;
  error: string | null;
  selectedOption: VariantOption | null;
  isModalOpen: boolean;
  fetchOptions: () => Promise<void>;
  createOption: (name: string, additional_price: number) => Promise<void>;
  updateOption: (id: number, data: Partial<VariantOption>) => Promise<void>;
  deleteOption: (id: number) => Promise<void>;
  toggleActive: (id: number, active: boolean) => Promise<void>;
  setSelectedOption: (option: VariantOption | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const useVariantOptionStore = create<VariantOptionState>((set, get) => ({
  options: [],
  loading: false,
  error: null,
  selectedOption: null,
  isModalOpen: false,

  fetchOptions: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('variant_options')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ options: data || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar las variantes',
        loading: false 
      });
    }
  },

  createOption: async (name: string, additional_price: number) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variant_options')
        .insert([{ name, additional_price }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Ya existe una variante con este nombre');
        }
        throw error;
      }

      get().fetchOptions();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear la variante',
        loading: false 
      });
      throw error;
    }
  },

  updateOption: async (id: number, data: Partial<VariantOption>) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variant_options')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Ya existe una variante con este nombre');
        }
        throw error;
      }

      get().fetchOptions();
      set({ isModalOpen: false, selectedOption: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar la variante',
        loading: false 
      });
      throw error;
    }
  },

  deleteOption: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('variant_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      get().fetchOptions();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar la variante',
        loading: false 
      });
      throw error;
    }
  },

  toggleActive: async (id: number, active: boolean) => {
    try {
      const { error } = await supabase
        .from('variant_options')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      get().fetchOptions();
    } catch (error: any) {
      throw error;
    }
  },

  setSelectedOption: (option) => set({ selectedOption: option }),
  setIsModalOpen: (isOpen) => {
    set({ isModalOpen: isOpen });
    if (!isOpen) {
      set({ selectedOption: null });
    }
  },
}));