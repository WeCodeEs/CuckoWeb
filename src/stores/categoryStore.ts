import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Category {
  id: number;
  menu_id: number;
  name: string;
  active: boolean;
  created_at: string;
  menu?: {
    name: string;
  };
}

interface CategoryForm {
  name: string;
  menu_id: number;
  active: boolean;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  selectedCategory: Category | null;
  isModalOpen: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (category: CategoryForm) => Promise<void>;
  updateCategory: (id: number, category: CategoryForm) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  setSelectedCategory: (category: Category | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,
  isModalOpen: false,

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          menu_id,
          name,
          active,
          created_at,
          menu:menus (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ categories: data || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar las categorías',
        loading: false 
      });
    }
  },

  createCategory: async (category: CategoryForm) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      get().fetchCategories();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear la categoría',
        loading: false 
      });
    }
  },

  updateCategory: async (id: number, category: CategoryForm) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      get().fetchCategories();
      set({ isModalOpen: false, selectedCategory: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar la categoría',
        loading: false 
      });
    }
  },

  deleteCategory: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      get().fetchCategories();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar la categoría',
        loading: false 
      });
    }
  },

  setSelectedCategory: (category: Category | null) => {
    set({ selectedCategory: category });
  },

  setIsModalOpen: (isOpen: boolean) => {
    set({ isModalOpen: isOpen });
    if (!isOpen) {
      set({ selectedCategory: null });
    }
  },
}));