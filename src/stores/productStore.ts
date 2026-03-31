import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ProductOptionGroupTemplate {
  id: number;
  name: string;
  min_select: number;
  max_select: number;
  active: boolean;
}

export interface Option {
  id: number;
  option_group_id: number;
  name: string;
  additional_price: number;
  active: boolean;
}

export interface ProductOptionGroupOption {
  id: number;
  option_id: number;
  additional_price: number | null; // override por producto (NULL => usar options.additional_price)
  active: boolean;
  option: Pick<Option, 'id' | 'name' | 'additional_price' | 'active'>;
}

export interface ProductOptionGroup {
  id: number;
  option_group_id: number;
  sort_order: number;
  option_group: ProductOptionGroupTemplate;
  options?: ProductOptionGroupOption[];
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
  };
  option_groups?: ProductOptionGroup[];
}

interface ProductForm {
  name: string;
  category_id: number;
  description: string | null;
  base_price: number;
  image_url: string | null;
  active: boolean;
  option_groups?: Array<{
    option_group_id: number;
    sort_order?: number;
    options?: Array<{
      option_id: number;
      active: boolean;
      additional_price: number | null;
    }>;
  }>;
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
  setSelectedProduct: (product: Product | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  uploadImage: (file: File) => Promise<string>;
  /**
   * (Compat) Antes era fetchProductVariants. Ahora devuelve:
   * - todos los option_groups con sus options
   * - y la configuración actual del producto (product_option_groups/product_option_group_options)
   */
  fetchProductOptionGroups: (productId: number) => Promise<any[]>;
  /**
   * Guardar configuración completa de option groups para un producto.
   */
  saveProductOptionGroups: (
    productId: number,
    groups: NonNullable<ProductForm['option_groups']>
  ) => Promise<void>;
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
      console.log('--- Iniciando carga de imagen ---');
      console.log('1. Archivo recibido:', file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`2. Intentando subir al bucket 'menu_items' con la ruta:`, filePath);

      const { data, error: uploadError } = await supabase.storage
        .from('menu_items') 
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('3. Respuesta de Supabase Storage (upload):', { data, uploadError });

      if (uploadError) {
        throw uploadError;
      }

      console.log('4. Obteniendo URL pública para la ruta:', filePath);
      const { data: { publicUrl } } = supabase.storage
        .from('menu_items')
        .getPublicUrl(filePath);

      console.log('5. URL pública obtenida:', publicUrl);
      console.log('--- Carga de imagen finalizada ---');

      return publicUrl;
    } catch (error: any) {
      console.error('ERROR en uploadImage:', error);
      throw new Error('Error al subir la imagen');
    }
  },

  fetchProducts: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
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
            active 
          ),
          option_groups:product_option_groups (
            id,
            option_group_id,
            sort_order,
            option_group:option_groups (
              id,
              name,
              min_select,
              max_select,
              active
            ),
            options:product_option_group_options (
              id,
              option_id,
              additional_price,
              active,
              option:options (
                id,
                name,
                additional_price,
                active
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ products: data || [], loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar los productos',
        loading: false 
      });
    }
  },

  fetchProductVariants: async (productId: number) => {
    try {
      const { data: groups, error: groupsErr } = await supabase
        .from('option_groups')
        .select(`
          id,
          name,
          min_select,
          max_select,
          active,
          options:options (
            id,
            option_group_id,
            name,
            additional_price,
            active
          )
        `)
        .eq('active', true)
        .order('name');

      if (groupsErr) throw groupsErr;

      const { data: productGroups, error: pgErr } = await supabase
        .from('product_option_groups')
        .select(`
          id,
          product_id,
          option_group_id,
          sort_order,
          options:product_option_group_options (
            id,
            option_id,
            additional_price,
            active
          )
        `)
        .eq('product_id', productId);

      if (pgErr) throw pgErr;

      const pgByGroupId = new Map<number, any>();
      (productGroups ?? []).forEach((pg: any) => pgByGroupId.set(pg.option_group_id, pg));

      const merged = (groups ?? []).map((g: any) => {
        const pg = pgByGroupId.get(g.id);
        const pcoByOptionId = new Map<number, any>();
        (pg?.options ?? []).forEach((pco: any) => pcoByOptionId.set(pco.option_id, pco));

        return {
          ...g,
          product_option_group: pg
            ? { id: pg.id, product_id: pg.product_id, sort_order: pg.sort_order }
            : null,
          options: (g.options ?? []).map((o: any) => {
            const pco = pcoByOptionId.get(o.id);
            return {
              ...o,
              product_option_group_options: pco ? [pco] : [],
            };
          }),
        };
      });

      return merged;
      
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar las personalizaciones del producto');
    }
  },

  saveProductOptionGroups: async (productId, groups) => {
    try {
      const { data: existingGroups, error: egErr } = await supabase
        .from('product_option_groups')
        .select('id')
        .eq('product_id', productId);
      if (egErr) throw egErr;

      const existingIds = (existingGroups ?? []).map((g: any) => g.id);

      if (existingIds.length > 0) {
        const { error: delOptErr } = await supabase
          .from('product_option_group_options')
          .delete()
          .in('product_option_group_id', existingIds);
        if (delOptErr) throw delOptErr;

        const { error: delGroupsErr } = await supabase
          .from('product_option_groups')
          .delete()
          .eq('product_id', productId);
        if (delGroupsErr) throw delGroupsErr;
      }

      if (!groups || groups.length === 0) return;

      const groupsPayload = groups.map((g, idx) => ({
        product_id: productId,
        option_group_id: g.option_group_id,
        sort_order: g.sort_order ?? idx,
      }));

      const { data: insertedGroups, error: insGErr } = await supabase
        .from('product_option_groups')
        .insert(groupsPayload)
        .select('id, option_group_id');
      if (insGErr) throw insGErr;

      const insertedByOgId = new Map<number, number>();
      (insertedGroups ?? []).forEach((row: any) => insertedByOgId.set(row.option_group_id, row.id));

      for (const g of groups) {
        const pogId = insertedByOgId.get(g.option_group_id);
        if (!pogId) continue;

        let optionsToInsert = g.options;

        if (!optionsToInsert) {
          const { data: templateOptions, error: toErr } = await supabase
            .from('options')
            .select('id')
            .eq('option_group_id', g.option_group_id)
            .eq('active', true);
          if (toErr) throw toErr;

          optionsToInsert = (templateOptions ?? []).map((o: any) => ({
            option_id: o.id,
            active: true,
            additional_price: null,
          }));
        }

        const pgoPayload = optionsToInsert.map((o) => ({
          product_option_group_id: pogId,
          option_id: o.option_id,
          active: o.active,
          additional_price: o.additional_price,
        }));

        if (pgoPayload.length > 0) {
          const { error: insOptErr } = await supabase
            .from('product_option_group_options')
            .insert(pgoPayload);
          if (insOptErr) throw insOptErr;
        }
      }
     } catch (error: any) {
      throw new Error(error.message || 'Error al guardar las personalizaciones del producto');
     }
   },
  createProduct: async (product: ProductForm, imageFile?: File) => {
    try {
      set({ loading: true, error: null });

      let imageUrl = product.image_url;

      if (imageFile) {
        imageUrl = await get().uploadImage(imageFile);
      }

      // First create the product
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

      // Handle option groups (personalizaciones) si se proporcionan
      if (product.option_groups !== undefined) {
        await get().saveProductOptionGroups(newProduct.id, product.option_groups);
      }

      get().fetchProducts();
      set({ isModalOpen: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear el producto',
        loading: false 
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
      
      // First update the product
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

      // Handle option groups (personalizaciones) si se proporcionan
      if (product.option_groups !== undefined) {
        await get().saveProductOptionGroups(id, product.option_groups);
      }

      get().fetchProducts();
      set({ isModalOpen: false, selectedProduct: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar el producto',
        loading: false 
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

      get().fetchProducts();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar el producto',
        loading: false 
      });
      throw error;
    }
  },

  toggleProductStatus: async (id: number, active: boolean) => {
    try {
      // 1. Actualiza la base de datos
      const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      // 2. Actualiza el estado local (actualización optimista)
      // Esto evita tener que recargar toda la lista de productos
      set((state) => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, active } : p
        ),
      }));
    } catch (error: any) {
      console.error("Error al cambiar el estado del producto:", error);
      // Relanza el error para que el componente pueda manejarlo si es necesario
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