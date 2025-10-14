import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Menu {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  icon_name: string; 
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
  setSelectedMenu: (menu: Menu | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  toggleMenuStatus: (menuId: number, newStatus: boolean) => Promise<void>;
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
      
      const menuToCreate = {
        ...menu,
        icon_name: 'ForkKnife',
      };

      const { error } = await supabase
        .from('menus')
        .insert([menuToCreate])
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

  toggleMenuStatus: async (menuId: number, newStatus: boolean) => {
    try {
      const { error: menuError } = await supabase
        .from('menus')
        .update({ active: newStatus })
        .eq('id', menuId);
      if (menuError) throw menuError;

      const { data: categories, error: categoryFetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('menu_id', menuId);
      if (categoryFetchError) throw categoryFetchError;

      if (categories && categories.length > 0) {
        const categoryIds = categories.map(c => c.id);

        const { error: categoryError } = await supabase
          .from('categories')
          .update({ active: newStatus })
          .in('id', categoryIds);
        if (categoryError) throw categoryError;

        const { error: productError } = await supabase
          .from('products')
          .update({ active: newStatus })
          .in('category_id', categoryIds);
        if (productError) throw productError;
      }

      set((state) => ({
        menus: state.menus.map(m =>
          m.id === menuId ? { ...m, active: newStatus } : m
        ),
      }));
    } catch (error: any) {
      console.error("Error al cambiar el estado del menú y su cascada:", error);
      throw error;
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