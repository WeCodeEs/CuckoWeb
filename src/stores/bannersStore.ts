import { create } from 'zustand';
import { supabase } from '../lib/supabase'; 

export type BannerAction = "NONE" | "REDIRECT_PRODUCT" | "REDIRECT_MENU";

export type Banner = {
  id: number;
  store_details_id: number;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  banner_action: BannerAction;
  product_id: number | null;
  menu_id: number | null;
};

type BannerOperation =
  | { action: 'CREATE'; imageUrl: string; sort_order: number }
  | { action: 'UPDATE_ORDER'; banners: Array<{ id: number; sort_order: number }> }
  | { action: 'UPDATE_STATUS'; id: number; active: boolean }
  | { action: 'DELETE'; id: number; imageUrl: string };

interface BannersState {
  banners: Banner[];
  loadingBanners: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  addBanner: (
    file: File,
    options?: {
      banner_action?: BannerAction;
      product_id?: number | null;
      menu_id?: number | null;
    }
  ) => Promise<void>;
  updateBannersOrder: (banners: Banner[]) => Promise<void>;
  toggleBannerStatus: (banner: Banner) => Promise<void>;
  deleteBanner: (banner: Banner) => Promise<void>;
}

export const useBannersStore = create<BannersState>((set, get) => ({
  banners: [],
  loadingBanners: false,
  error: null,

  fetchBanners: async () => {
    set({ loadingBanners: true, error: null });
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      set({ banners: (data as Banner[]) || [], loadingBanners: false });
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      set({ error: error.message, loadingBanners: false });
    }
  },

  addBanner: async (
    file: File,
    options?: {
      banner_action?: BannerAction;
      product_id?: number | null;
      menu_id?: number | null;
    }
  ) => {
    set({ loadingBanners: true, error: null });
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('banners')
        .getPublicUrl(uploadData.path);
      
      const imageUrl = publicUrlData.publicUrl;

      const currentBanners = get().banners;
      const newOrder = currentBanners.length > 0 ? Math.max(...currentBanners.map(b => b.sort_order)) + 1 : 1;

      const { banner_action, product_id, menu_id } = options || {};

      console.warn("imageUrl: ", imageUrl);
      const { error: functionError } = await supabase.functions.invoke('manage-banners', {
        body: {
          action: 'CREATE',
          imageUrl: imageUrl,
          sort_order: newOrder,
          banner_action,
          product_id,
          menu_id,
        } as BannerOperation
      });

      console.warn("functionError: ", functionError);
      if (functionError) throw functionError;

      await get().fetchBanners();
    } catch (error: any) {
      console.error('Error adding banner:', error);
      set({ error: error.message, loadingBanners: false });
      throw error; 
    }
  },

  updateBannersOrder: async (banners: Banner[]) => {
    const originalBanners = get().banners;
    set({ banners }); 

    try {
      const orderPayload = banners.map(b => ({ id: b.id, sort_order: b.sort_order }));

      const { error: functionError } = await supabase.functions.invoke('manage-banners', {
        body: {
          action: 'UPDATE_ORDER',
          banners: orderPayload
        } as BannerOperation
      });

      if (functionError) throw functionError;
    } catch (error: any) {
      console.error('Error updating banner order:', error);
      set({ error: error.message, banners: originalBanners }); 
      throw error;
    }
  },

  toggleBannerStatus: async (banner: Banner) => {
    const newStatus = !banner.active;
    
    set(state => ({
      banners: state.banners.map(b => 
        b.id === banner.id ? { ...b, active: newStatus } : b
      )
    }));

    try {
      const { error: functionError } = await supabase.functions.invoke('manage-banners', {
        body: {
          action: 'UPDATE_STATUS',
          id: banner.id,
          active: newStatus
        } as BannerOperation
      });

      if (functionError) throw functionError;
    } catch (error: any) {
      console.error('Error toggling banner status:', error);
      set(state => ({
        banners: state.banners.map(b => 
          b.id === banner.id ? { ...b, active: banner.active } : b 
        )
      }));
      throw error;
    }
  },

  deleteBanner: async (banner: Banner) => {
    const originalBanners = get().banners;
    
    set(state => ({
      banners: state.banners.filter(b => b.id !== banner.id)
    }));

    try {
      const { error: functionError } = await supabase.functions.invoke('manage-banners', {
        body: {
          action: 'DELETE',
          id: banner.id,
          imageUrl: banner.image_url, 
        } as BannerOperation,
      });

      if (functionError) throw functionError;
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      set({ error: error.message, banners: originalBanners }); 
      throw error;
    }
  },
}));