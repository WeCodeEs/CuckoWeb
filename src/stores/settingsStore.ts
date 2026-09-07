import { create } from 'zustand';
import { supabase } from '../lib/supabase'; 

export interface StoreSchedule {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface StoreDetailsPayload {
  is_open?: boolean;
  is_in_maintenance?: boolean;
  allow_scheduled_orders?: boolean;
}

interface SettingsState {
  isOpen: boolean;
  maintenanceMode: boolean;
  scheduledOrdersEnabled: boolean;
  schedules: StoreSchedule[];
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (payload: StoreDetailsPayload) => Promise<void>;
  updateSchedules: (newSchedules: StoreSchedule[]) => Promise<void>;
}

const isValidTime = (t: string) => {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(t);
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: true,
  maintenanceMode: false,
  scheduledOrdersEnabled: true,
  schedules: [],
  isLoading: true,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('store_details')
        .select('id, is_open, is_in_maintenance, allow_scheduled_orders, store_schedules(day_of_week, is_open, open_time, close_time)')
        .single();

      if (error) throw error;

      if (data) {
        set({
          isOpen: data.is_open,
          maintenanceMode: data.is_in_maintenance,
          scheduledOrdersEnabled: data.allow_scheduled_orders,
          schedules: data.store_schedules || [],
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false, error: "No se encontraron configuraciones de la tienda." });
      }
    } catch (error: any) {
      console.error("Error fetching store settings:", error);
      set({ isLoading: false, error: error.message });
    }
  },

  updateSettings: async (payload: StoreDetailsPayload) => {
    const currentState = get();
    const optimisticState: Partial<SettingsState> = {};
    
    if (payload.is_open !== undefined) optimisticState.isOpen = payload.is_open;
    if (payload.is_in_maintenance !== undefined) optimisticState.maintenanceMode = payload.is_in_maintenance;
    if (payload.allow_scheduled_orders !== undefined) optimisticState.scheduledOrdersEnabled = payload.allow_scheduled_orders;

    set({ ...optimisticState, error: null });

    try {
      const { data: row, error: fetchErr } = await supabase
        .from('store_details')
        .select('id')
        .single();

      if (fetchErr) throw fetchErr;
      if (!row?.id) throw new Error('No se encontró la fila de store_details.');

      const updateData: Record<string, any> = {};

      if (payload.is_open !== undefined) updateData.is_open = payload.is_open;
      if (payload.is_in_maintenance !== undefined) updateData.is_in_maintenance = payload.is_in_maintenance;
      if (payload.allow_scheduled_orders !== undefined) updateData.allow_scheduled_orders = payload.allow_scheduled_orders;
      
      updateData.updated_at = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from('store_details')
        .update(updateData)
        .eq('id', row.id);

      if (updateErr) throw updateErr;

      const { data: refreshed, error: refErr } = await supabase
        .from('store_details')
        .select('is_open, is_in_maintenance, allow_scheduled_orders')
        .single();

      if (!refErr && refreshed) {
        set({
          isOpen: refreshed.is_open,
          maintenanceMode: refreshed.is_in_maintenance,
          scheduledOrdersEnabled: refreshed.allow_scheduled_orders,
          error: null,
        });
      }
    } catch (error: any) {
      console.error("Error updating settings:", error);
      set({
        isOpen: currentState.isOpen,
        maintenanceMode: currentState.maintenanceMode,
        scheduledOrdersEnabled: currentState.scheduledOrdersEnabled,
        error: error.message || 'Error al actualizar configuraciones',
      });
      throw error;
    }
  },

  updateSchedules: async (newSchedules: StoreSchedule[]) => {
    const currentState = get();
    
    // Validate
    for (const s of newSchedules) {
      if (!isValidTime(s.open_time) || !isValidTime(s.close_time)) {
        throw new Error('Formato de hora inválido.');
      }
    }
    
    set({ schedules: newSchedules, error: null });

    try {
      const { data: row, error: fetchErr } = await supabase
        .from('store_details')
        .select('id')
        .single();

      if (fetchErr) throw fetchErr;
      if (!row?.id) throw new Error('No se encontró la fila de store_details.');

      const payload = newSchedules.map(s => ({
        store_id: row.id,
        day_of_week: s.day_of_week,
        is_open: s.is_open,
        // Ensure TIME format HH:MM:SS for postgres
        open_time: s.open_time.length === 5 ? `${s.open_time}:00` : s.open_time,
        close_time: s.close_time.length === 5 ? `${s.close_time}:00` : s.close_time,
      }));

      const { error: upsertErr } = await supabase
        .from('store_schedules')
        .upsert(payload, { onConflict: 'store_id, day_of_week' });

      if (upsertErr) throw upsertErr;

    } catch (error: any) {
      console.error("Error updating schedules:", error);
      set({
        schedules: currentState.schedules,
        error: error.message || 'Error al actualizar horarios',
      });
      throw error;
    }
  }
}));
