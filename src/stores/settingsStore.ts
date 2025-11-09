import { create } from 'zustand';
import { supabase } from '../lib/supabase'; 

export interface StoreDetailsPayload {
  is_open?: boolean;
  opening_time?: string; 
  closing_time?: string; 
  is_in_maintenance?: boolean;
  allow_scheduled_orders?: boolean;
}

interface SettingsState {
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  maintenanceMode: boolean;
  scheduledOrdersEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (payload: StoreDetailsPayload) => Promise<void>;
  setLocalOpeningTime: (time: string) => void;
  setLocalClosingTime: (time: string) => void;
}

const timeToParts = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
};

const partsToTime = (h: number, m: number) => {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const isValidTime = (t: string) => {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const { hour, minute } = timeToParts(t);
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const compareTimes = (a: string, b: string) => {
  const ap = timeToParts(a);
  const bp = timeToParts(b);
  return (ap.hour * 60 + ap.minute) - (bp.hour * 60 + bp.minute);
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: true,
  openingTime: '00:00',
  closingTime: '00:00',
  maintenanceMode: false,
  scheduledOrdersEnabled: true,
  isLoading: true,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('store_details')
        .select('id, is_open, open_hour, open_minute, close_hour, close_minute, is_in_maintenance, allow_scheduled_orders')
        .single();

      if (error) throw error;

      if (data) {
        set({
          isOpen: data.is_open,
          openingTime: partsToTime(data.open_hour, data.open_minute),
          closingTime: partsToTime(data.close_hour, data.close_minute),
          maintenanceMode: data.is_in_maintenance,
          scheduledOrdersEnabled: data.allow_scheduled_orders,
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

    if (payload.opening_time !== undefined && !isValidTime(payload.opening_time)) {
      set({ error: 'opening_time inválido. Usa formato HH:mm.' });
      throw new Error('opening_time inválido. Usa formato HH:mm.');
    }
    if (payload.closing_time !== undefined && !isValidTime(payload.closing_time)) {
      set({ error: 'closing_time inválido. Usa formato HH:mm.' });
      throw new Error('closing_time inválido. Usa formato HH:mm.');
    }
    if (payload.opening_time && payload.closing_time) {

      if (compareTimes(payload.opening_time, payload.closing_time) >= 0) {
        set({ error: 'opening_time debe ser menor que closing_time.' });
        throw new Error('opening_time debe ser menor que closing_time.');
      }
    }

    const optimisticState: Partial<SettingsState> = {};
    if (payload.is_open !== undefined) optimisticState.isOpen = payload.is_open;
    if (payload.is_in_maintenance !== undefined) optimisticState.maintenanceMode = payload.is_in_maintenance;
    if (payload.allow_scheduled_orders !== undefined) optimisticState.scheduledOrdersEnabled = payload.allow_scheduled_orders;
    if (payload.opening_time !== undefined) optimisticState.openingTime = payload.opening_time;
    if (payload.closing_time !== undefined) optimisticState.closingTime = payload.closing_time;

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

      if (payload.opening_time !== undefined) {
        const { hour, minute } = timeToParts(payload.opening_time);
        updateData.open_hour = hour;
        updateData.open_minute = minute;
      }
      if (payload.closing_time !== undefined) {
        const { hour, minute } = timeToParts(payload.closing_time);
        updateData.close_hour = hour;
        updateData.close_minute = minute;
      }

      const { error: updateErr } = await supabase
        .from('store_details')
        .update(updateData)
        .eq('id', row.id);

      if (updateErr) throw updateErr;

      const { data: refreshed, error: refErr } = await supabase
        .from('store_details')
        .select('is_open, open_hour, open_minute, close_hour, close_minute, is_in_maintenance, allow_scheduled_orders')
        .single();

      if (!refErr && refreshed) {
        set({
          isOpen: refreshed.is_open,
          openingTime: partsToTime(refreshed.open_hour, refreshed.open_minute),
          closingTime: partsToTime(refreshed.close_hour, refreshed.close_minute),
          maintenanceMode: refreshed.is_in_maintenance,
          scheduledOrdersEnabled: refreshed.allow_scheduled_orders,
          error: null,
        });
      }

    } catch (error: any) {
      console.error("Error updating settings:", error);
      set({
        isOpen: currentState.isOpen,
        openingTime: currentState.openingTime,
        closingTime: currentState.closingTime,
        maintenanceMode: currentState.maintenanceMode,
        scheduledOrdersEnabled: currentState.scheduledOrdersEnabled,
        error: error.message || 'Error al actualizar configuraciones',
      });
      throw error;
    }
  },

  setLocalOpeningTime: (time: string) => set({ openingTime: time }),
  setLocalClosingTime: (time: string) => set({ closingTime: time }),
}));
