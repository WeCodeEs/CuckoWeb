import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Menu {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  icon_name: string; 
  is_default?: boolean;
}

interface MenuForm {
  name: string;
  description: string;
  active: boolean;
  icon_name: string;
  is_default?: boolean;
}

export interface MenuStats {
  categoryCount: number;
  productCount: number;
  products: Array<{ id: number; name: string; active: boolean }>;
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
  getMenuStats: (id: number) => Promise<MenuStats>;
  setSelectedMenu: (menu: Menu | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  toggleMenuStatus: (menuId: number, newStatus: boolean) => Promise<void>;
  setDefaultMenu: (menuId: number) => Promise<void>;
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
      
      if (menu.is_default) {
        const { error: clearError } = await supabase
          .from('menus')
          .update({ is_default: false })
          .eq('is_default', true);
        if (clearError) throw clearError;
      }

      const { error } = await supabase
        .from('menus')
        .insert([menu]) 
        .select()
        .single();

      if (error) throw error;

      await get().fetchMenus();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear el menú',
        loading: false 
      });
      throw error;
    }
  },

  updateMenu: async (id: number, menu: MenuForm) => {
    try {
      set({ loading: true, error: null });
      
      if (menu.is_default) {
        const { error: clearError } = await supabase
          .from('menus')
          .update({ is_default: false })
          .neq('id', id)
          .eq('is_default', true);
        if (clearError) throw clearError;
      }

      const currentMenu = get().menus.find(m => m.id === id);
      const statusChanged = currentMenu !== undefined && currentMenu.active !== menu.active;

      const { error } = await supabase
        .from('menus')
        .update(menu)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (statusChanged) {
        const { data: categories, error: categoryFetchError } = await supabase
          .from('categories')
          .select('id')
          .eq('menu_id', id);

        if (categoryFetchError) throw categoryFetchError;

        if (categories && categories.length > 0) {
          const categoryIds = categories.map(c => c.id);

          const { error: categoryError } = await supabase
            .from('categories')
            .update({ active: menu.active })
            .in('id', categoryIds);
          if (categoryError) throw categoryError;

          const { error: productError } = await supabase
            .from('products')
            .update({ active: menu.active })
            .in('category_id', categoryIds);
          if (productError) throw productError;
        }
      }

      await get().fetchMenus();
      set({ isModalOpen: false, selectedMenu: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar el menú',
        loading: false 
      });
      throw error;
    }
  },

  toggleMenuStatus: async (menuId: number, newStatus: boolean) => {
    try {
      const menuToUpdate = get().menus.find(m => m.id === menuId);
      const updates: { active: boolean; is_default?: boolean } = { active: newStatus };
      if (menuToUpdate?.is_default && !newStatus) {
        updates.is_default = false;
      }

      const { error: menuError } = await supabase
        .from('menus')
        .update(updates)
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
          m.id === menuId
            ? { ...m, active: newStatus, is_default: !newStatus && m.is_default ? false : m.is_default }
            : m
        ),
      }));
    } catch (error: any) {
      console.error("Error al cambiar el estado del menú y su cascada:", error);
      throw error;
    }
  },

  getMenuStats: async (id: number) => {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('menu_id', id);

    if (catError) throw catError;

    const categoryIds = (categories || []).map(c => c.id);
    if (categoryIds.length === 0) {
      return { categoryCount: 0, productCount: 0, products: [] };
    }

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, active')
      .in('category_id', categoryIds);

    if (prodError) throw prodError;

    return {
      categoryCount: categoryIds.length,
      productCount: (products || []).length,
      products: products || [],
    };
  },

  deleteMenu: async (id: number) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchMenus();
    } catch (error: any) {
      set({
        error: error.message || 'Error al eliminar el menú',
        loading: false,
      });
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

  setDefaultMenu: async (menuId: number) => {
    try {
      set({ loading: true, error: null });

      // Atomically clear any current default in database
      const { error: clearError } = await supabase
        .from('menus')
        .update({ is_default: false })
        .eq('is_default', true);

      if (clearError) throw clearError;

      // Set new default
      const { error } = await supabase
        .from('menus')
        .update({ is_default: true })
        .eq('id', menuId);

      if (error) throw error;

      await get().fetchMenus();
    } catch (error: any) {
      console.error('Error al establecer el menú por defecto:', error);
      set({
        error: error.message || 'Error al establecer el menú por defecto',
        loading: false,
      });
      throw error;
    }
  },
}));