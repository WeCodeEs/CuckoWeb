import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ProductOptionGroupOption {
  id: number;
  product_option_group_id: number;
  option_id: number;
  additional_price: number | null;
  active: boolean;
  option: {
    id: number;
    name: string;
    additional_price: number;
    active: boolean;
  };
}

export interface ProductOptionGroup {
  id: number;
  product_id: number;
  option_group_id: number;
  sort_order: number;
  option_group: {
    id: number;
    name: string;
    min_select: number;
    max_select: number;
    active: boolean;
  };
  options: ProductOptionGroupOption[];
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  category?: {
    name: string;
    active: boolean;
    menu?: {
      name: string;
    };
  };
  option_groups?: ProductOptionGroup[];
}

interface ProductOptionGroupInput {
  option_group_id: number;
  sort_order?: number;
  options: Array<{
    option_id: number;
    additional_price?: number | null;
  }>;
}

interface ProductForm {
  name: string;
  category_id: number;
  description: string | null;
  base_price: number;
  image_url: string | null;
  active: boolean;
  option_groups?: ProductOptionGroupInput[];
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  isModalOpen: boolean;
  fetchProducts: () => Promise<void>;
  createProduct: (product: ProductForm, imageFile?: File) => Promise<void>;
  updateProduct: (id: number, product: ProductForm, imageFile?: File) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  deactivateProductsByCategory: (categoryId: number) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  uploadImage: (file: File) => Promise<string>;
  toggleProductStatus: (id: number, active: boolean) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  selectedProduct: null,
  isModalOpen: false,

  uploadImage: async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('menu_items')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('menu_items')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('ERROR en uploadImage:', error);
      throw new Error('Error al subir la imagen');
    }
  },

  fetchProducts: async () => {
    try {
      set({ loading: true, error: null });

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          category_id,
          name,
          description,
          base_price,
          image_url,
          active,
          created_at,
          category:categories (
            name,
            active,
            menu:menus (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: productOptionGroups, error: pogError } = await supabase
        .from('product_option_groups')
        .select(`
          id,
          product_id,
          option_group_id,
          sort_order,
          option_group:option_groups (
            id,
            name,
            min_select,
            max_select,
            active
          )
        `)
        .order('sort_order', { ascending: true });

      if (pogError) throw pogError;

      const { data: productOptions, error: poError } = await supabase
        .from('product_option_group_options')
        .select(`
          id,
          product_option_group_id,
          option_id,
          additional_price,
          active,
          option:options (
            id,
            name,
            additional_price,
            active
          )
        `);

      if (poError) throw poError;

      const productsWithOptions: Product[] = (products || []).map(product => {
        const groups = (productOptionGroups || [])
          .filter(pog => pog.product_id === product.id)
          .map(pog => ({
            ...pog,
            options: (productOptions || []).filter(
              po => po.product_option_group_id === pog.id
            ),
          }));

        return {
          ...product,
          option_groups: groups,
        };
      });

      set({ products: productsWithOptions, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al cargar los productos',
        loading: false,
      });
    }
  },

  createProduct: async (product: ProductForm, imageFile?: File) => {
    try {
      set({ loading: true, error: null });

      let imageUrl = product.image_url;

      if (imageFile) {
        imageUrl = await get().uploadImage(imageFile);
      }

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          category_id: product.category_id,
          description: product.description,
          base_price: product.base_price,
          image_url: imageUrl,
          active: product.active
        }])
        .select()
        .single();

      if (productError) throw productError;

      if (product.option_groups && product.option_groups.length > 0) {
        for (let i = 0; i < product.option_groups.length; i++) {
          const og = product.option_groups[i];

          const { data: pog, error: pogError } = await supabase
            .from('product_option_groups')
            .insert({
              product_id: newProduct.id,
              option_group_id: og.option_group_id,
              sort_order: og.sort_order ?? i,
            })
            .select()
            .single();

          if (pogError) throw pogError;

          if (og.options && og.options.length > 0) {
            const optionLinks = og.options.map(opt => ({
              product_option_group_id: pog.id,
              option_id: opt.option_id,
              additional_price: opt.additional_price ?? null,
              active: true,
            }));

            const { error: optError } = await supabase
              .from('product_option_group_options')
              .insert(optionLinks);

            if (optError) throw optError;
          }
        }
      }

      get().fetchProducts();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al crear el producto',
        loading: false,
      });
      throw error;
    }
  },

  updateProduct: async (id: number, product: ProductForm, imageFile?: File) => {
    try {
      set({ loading: true, error: null });

      let imageUrl = product.image_url;

      if (imageFile) {
        imageUrl = await get().uploadImage(imageFile);
      }

      const { error: productError } = await supabase
        .from('products')
        .update({
          name: product.name,
          category_id: product.category_id,
          description: product.description,
          base_price: product.base_price,
          image_url: imageUrl,
          active: product.active
        })
        .eq('id', id);

      if (productError) throw productError;

      if (product.option_groups !== undefined) {
        const { data: existingPogs, error: fetchPogsError } = await supabase
          .from('product_option_groups')
          .select('id')
          .eq('product_id', id);

        if (fetchPogsError) throw fetchPogsError;

        if (existingPogs && existingPogs.length > 0) {
          const pogIds = existingPogs.map(p => p.id);

          const { error: deleteOptionsError } = await supabase
            .from('product_option_group_options')
            .delete()
            .in('product_option_group_id', pogIds);

          if (deleteOptionsError) throw deleteOptionsError;

          const { error: deletePogsError } = await supabase
            .from('product_option_groups')
            .delete()
            .eq('product_id', id);

          if (deletePogsError) throw deletePogsError;
        }

        if (product.option_groups.length > 0) {
          for (let i = 0; i < product.option_groups.length; i++) {
            const og = product.option_groups[i];

            const { data: pog, error: pogError } = await supabase
              .from('product_option_groups')
              .insert({
                product_id: id,
                option_group_id: og.option_group_id,
                sort_order: og.sort_order ?? i,
              })
              .select()
              .single();

            if (pogError) throw pogError;

            if (og.options && og.options.length > 0) {
              const optionLinks = og.options.map(opt => ({
                product_option_group_id: pog.id,
                option_id: opt.option_id,
                additional_price: opt.additional_price ?? null,
                active: true,
              }));

              const { error: optError } = await supabase
                .from('product_option_group_options')
                .insert(optionLinks);

              if (optError) throw optError;
            }
          }
        }
      }

      get().fetchProducts();
      set({ isModalOpen: false, selectedProduct: null });
    } catch (error: any) {
      set({
        error: error.message || 'Error al actualizar el producto',
        loading: false,
      });
      throw error;
    }
  },

  deleteProduct: async (id: number) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchProducts();
    } catch (error: any) {
      set({
        error: error.message || 'Error al eliminar el producto',
        loading: false,
      });
      throw error;
    }
  },

  deactivateProductsByCategory: async (categoryId: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('category_id', categoryId);

      if (error) throw error;

      set((state) => ({
        products: state.products.map(p =>
          p.category_id === categoryId ? { ...p, active: false } : p
        ),
      }));
    } catch (error: any) {
      console.error('Error al desactivar productos de la categoria:', error);
      throw error;
    }
  },

  toggleProductStatus: async (id: number, active: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, active } : p
        ),
      }));
    } catch (error: any) {
      console.error("Error al cambiar el estado del producto:", error);
      throw error;
    }
  },

  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product });
  },

  setIsModalOpen: (isOpen: boolean) => {
    set({ isModalOpen: isOpen });
    if (!isOpen) {
      set({ selectedProduct: null });
    }
  },
}));
