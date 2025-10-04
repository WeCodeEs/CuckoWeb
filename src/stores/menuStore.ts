import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Menu {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface MenuForm {
  name: string;
  description: string;
  active: boolean;
}

interface MenuState {
  menus: Menu[];
  loading: boolean;
  error: string | null;
  selectedMenu: Menu | null;
  isModalOpen: boolean;
  fetchMenus: () => Promise<void>;
  createMenu: (menu: MenuForm) => Promise<void>;
  updateMenu: (id: number, menu: MenuForm) => Promise<void>;
  deleteMenu: (id: number) => Promise<void>;
  setSelectedMenu: (menu: Menu | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  loading: false,
  error: null,
  selectedMenu: null,
  isModalOpen: false,

  fetchMenus: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ menus: data || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar los menús',
        loading: false 
      });
    }
  },

  createMenu: async (menu: MenuForm) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('menus')
        .insert([menu])
        .select()
        .single();

      if (error) throw error;

      get().fetchMenus();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear el menú',
        loading: false 
      });
    }
  },

  updateMenu: async (id: number, menu: MenuForm) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('menus')
        .update(menu)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      get().fetchMenus();
      set({ isModalOpen: false, selectedMenu: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar el menú',
        loading: false 
      });
    }
  },

  deleteMenu: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id);

      if (error) throw error;

      get().fetchMenus();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar el menú',
        loading: false 
      });
    }
  },

  setSelectedMenu: (menu: Menu | null) => {
    set({ selectedMenu: menu });
  },

  setIsModalOpen: (isOpen: boolean) => {
    set({ isModalOpen: isOpen });
    if (!isOpen) {
      set({ selectedMenu: null });
    }
  },
}));