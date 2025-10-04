import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  };
  variants?: Array<{
    variant_option_id: number;
    additional_price: number;
    active: boolean;
    variant_option: {
      name: string;
      active: boolean;
    };
  }>;
  ingredients?: Array<{
    ingredient_option_id: number;
    ingredient_option: {
      name: string;
      active: boolean;
    };
  }>;
}

interface ProductForm {
  name: string;
  category_id: number;
  description: string | null;
  base_price: number;
  image_url: string | null;
  active: boolean;
  ingredients?: number[];
  variants?: Array<{
    variant_option_id: number;
    additional_price: number;
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
  fetchProductVariants: (productId: number) => Promise<any[]>;
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
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
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
            name
          ),
          ingredients:product_customizable_ingredients (
            ingredient_option_id,
            active,
            ingredient_option:ingredient_options (
              name,
              extra_price,
              active
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
      
      const { data, error } = await supabase
        .from('variant_options')
        .select(`
          id,
          name,
          additional_price,
          active,
          product_variants!left (
            product_id,
            active,
            additional_price
          )
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      
      // Filter to only include variants that have a relationship with this product
      const filteredData = (data || []).map(variant => {
        // Filter product_variants to only include those for this specific product
        const productVariantsForThisProduct = variant.product_variants?.filter(
          pv => pv.product_id === productId
        ) || [];
        
        return {
          ...variant,
          product_variants: productVariantsForThisProduct
        };
      });
      
      return filteredData;
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar las variantes del producto');
    }
  },

  saveProductVariants: async (productId: number, variants: Array<{ variant_option_id: number; active: boolean; additional_price: number }>) => {
    try {
      // First, delete existing variants for this product
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Then insert the new variants (only active ones)
      const activeVariants = variants.filter(v => v.active);
      if (activeVariants.length > 0) {
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(
            activeVariants.map(variant => ({
              product_id: productId,
              variant_option_id: variant.variant_option_id,
              active: variant.active,
              additional_price: variant.additional_price
            }))
          );

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al guardar las variantes del producto');
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

      // Handle variants if provided
      if (product.variants && product.variants.length > 0) {
        const variantLinks = product.variants.map(variant => ({
          product_id: newProduct.id,
          variant_option_id: variant.variant_option_id,
          additional_price: variant.additional_price,
          active: true
        }));

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantLinks);

        if (variantError) throw variantError;
      }

      // Handle ingredients if provided
      if (product.ingredients && product.ingredients.length > 0) {
        const ingredientLinks = product.ingredients.map(ingredientId => ({
          product_id: newProduct.id,
          ingredient_option_id: ingredientId,
          active: true
        }));

        const { error: ingredientError } = await supabase
          .from('product_customizable_ingredients')
          .insert(ingredientLinks);

        if (ingredientError) throw ingredientError;
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

      // Handle variants
      if (product.variants !== undefined) {
        // First remove all existing variants
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', id);

        if (deleteError) throw deleteError;

        // Then add new ones if any provided
        if (product.variants.length > 0) {
          const variantLinks = product.variants.map(variant => ({
            product_id: id,
            variant_option_id: variant.variant_option_id,
            additional_price: variant.additional_price,
            active: true
          }));

          const { error: variantError } = await supabase
            .from('product_variants')
            .insert(variantLinks);

          if (variantError) throw variantError;
        }
      }

      // Handle ingredients
      if (product.ingredients !== undefined) {
        // First remove all existing ingredients
        const { error: deleteError } = await supabase
          .from('product_customizable_ingredients')
          .delete()
          .eq('product_id', id);

        if (deleteError) throw deleteError;

        // Then add new ones if any provided
        if (product.ingredients.length > 0) {
          const ingredientLinks = product.ingredients.map(ingredientId => ({
            product_id: id,
            ingredient_option_id: ingredientId,
            active: true
          }));

          const { error: ingredientError } = await supabase
            .from('product_customizable_ingredients')
            .insert(ingredientLinks);

          if (ingredientError) throw ingredientError;
        }
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