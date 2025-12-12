import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Customization {
  id: number;
  name: string;
  min_select: number;
  max_select: number;
  options: CustomizationOption[];
  display_order?: number;
}

export interface CustomizationOption {
  id: number;
  name: string;
  extra_price: number;
  active: boolean;
}

interface CustomizationState {
  customizations: Customization[];
  loading: boolean;
  error: string | null;
  fetchCustomizations: () => Promise<void>;
  createCustomization: (
    header: { name: string; min_select: number; max_select: number }, 
    options: { name: string; extra_price: number }[]
  ) => Promise<void>;
  deleteCustomization: (id: number) => Promise<void>;
}

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  customizations: [],
  loading: false,
  error: null,

  fetchCustomizations: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select(`
          *,
          options:customization_options(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        options: item.options || []
      }));

      set({ customizations: formattedData as Customization[], loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Error al cargar personalizaciones' });
    }
  },

  createCustomization: async (header, options) => {
    set({ loading: true, error: null });
    try {
      const { data: custData, error: custError } = await supabase
        .from('customizations')
        .insert([header])
        .select()
        .single();

      if (custError) throw custError;

      if (options.length > 0) {
        const optionsToInsert = options.map(opt => ({
          customization_id: custData.id,
          name: opt.name,
          extra_price: opt.extra_price,
          active: true
        }));

        const { error: optError } = await supabase
          .from('customization_options')
          .insert(optionsToInsert);
          
        if (optError) throw optError;
      }

      await get().fetchCustomizations();
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Error al crear personalización' });
      throw error;
    }
  },

  deleteCustomization: async (id: number) => {
    try {
      const { error } = await supabase.from('customizations').delete().eq('id', id);
      if (error) throw error;
      await get().fetchCustomizations();
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  }
}));