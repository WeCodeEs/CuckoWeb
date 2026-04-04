import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Option {
  id: number;
  option_group_id: number;
  name: string;
  additional_price: number;
  active: boolean;
}

export interface OptionGroup {
  id: number;
  name: string;
  min_select: number;
  max_select: number;
  active: boolean;
  created_at: string;
  options: Option[];
  product_count?: number;
}

interface OptionGroupState {
  groups: OptionGroup[];
  loading: boolean;
  error: string | null;
  selectedGroup: OptionGroup | null;
  selectedOption: Option | null;
  isGroupModalOpen: boolean;
  isOptionModalOpen: boolean;
  fetchGroups: () => Promise<OptionGroup[]>;
  createGroup: (data: { name: string; min_select: number; max_select: number }) => Promise<OptionGroup>;
  updateGroup: (id: number, data: Partial<OptionGroup>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  toggleGroupActive: (id: number, active: boolean) => Promise<void>;
  createOption: (groupId: number, data: { name: string; additional_price: number }) => Promise<void>;
  updateOption: (id: number, data: Partial<Option>) => Promise<void>;
  deleteOption: (id: number) => Promise<void>;
  toggleOptionActive: (id: number, active: boolean) => Promise<void>;
  setSelectedGroup: (group: OptionGroup | null) => void;
  setSelectedOption: (option: Option | null) => void;
  setIsGroupModalOpen: (isOpen: boolean) => void;
  setIsOptionModalOpen: (isOpen: boolean) => void;
}

export const useOptionGroupStore = create<OptionGroupState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,
  selectedGroup: null,
  selectedOption: null,
  isGroupModalOpen: false,
  isOptionModalOpen: false,

  fetchGroups: async () => {
    try {
      set({ loading: true, error: null });

      const { data: groups, error: groupsError } = await supabase
        .from('option_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .order('name', { ascending: true });

      if (optionsError) throw optionsError;

      const { data: productCounts, error: countError } = await supabase
        .from('product_option_groups')
        .select('option_group_id');

      if (countError) throw countError;

      const countMap: Record<number, number> = {};
      productCounts?.forEach(pc => {
        countMap[pc.option_group_id] = (countMap[pc.option_group_id] || 0) + 1;
      });

      const groupsWithOptions: OptionGroup[] = (groups || []).map(group => ({
        ...group,
        options: (options || []).filter(opt => opt.option_group_id === group.id),
        product_count: countMap[group.id] || 0,
      }));

      set({ groups: groupsWithOptions, loading: false });
      return groupsWithOptions;
    } catch (error: any) {
      set({
        error: error.message || 'Error al cargar los grupos de opciones',
        loading: false,
      });
      return [];
    }
  },

  createGroup: async (data) => {
    try {
      set({ loading: true, error: null });

      const { data: newGroup, error } = await supabase
        .from('option_groups')
        .insert([{ ...data, active: true }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe un grupo con este nombre');
        }
        throw error;
      }

      await get().fetchGroups();
      set({ isGroupModalOpen: false });
      return { ...newGroup, options: [] };
    } catch (error: any) {
      set({
        error: error.message || 'Error al crear el grupo',
        loading: false,
      });
      throw error;
    }
  },

  updateGroup: async (id, data) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('option_groups')
        .update(data)
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe un grupo con este nombre');
        }
        throw error;
      }

      await get().fetchGroups();
      set({ isGroupModalOpen: false, selectedGroup: null });
    } catch (error: any) {
      set({
        error: error.message || 'Error al actualizar el grupo',
        loading: false,
      });
      throw error;
    }
  },

  deleteGroup: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('option_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchGroups();
    } catch (error: any) {
      set({
        error: error.message || 'Error al eliminar el grupo',
        loading: false,
      });
      throw error;
    }
  },

  toggleGroupActive: async (id, active) => {
    try {
      const { error: groupError } = await supabase
        .from('option_groups')
        .update({ active })
        .eq('id', id);

      if (groupError) throw groupError;

      const { error: optionsError } = await supabase
        .from('options')
        .update({ active })
        .eq('option_group_id', id);

      if (optionsError) throw optionsError;

      set(state => ({
        groups: state.groups.map(g =>
          g.id === id
            ? { ...g, active, options: g.options.map(o => ({ ...o, active })) }
            : g
        ),
      }));
    } catch (error: any) {
      console.error('Error al cambiar estado del grupo:', error);
      throw error;
    }
  },

  createOption: async (groupId, data) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('options')
        .insert([{ ...data, option_group_id: groupId, active: true }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe una opcion con este nombre en el grupo');
        }
        throw error;
      }

      await get().fetchGroups();
      set({ isOptionModalOpen: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al crear la opcion',
        loading: false,
      });
      throw error;
    }
  },

  updateOption: async (id, data) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('options')
        .update(data)
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe una opcion con este nombre');
        }
        throw error;
      }

      await get().fetchGroups();
      set({ isOptionModalOpen: false, selectedOption: null });
    } catch (error: any) {
      set({
        error: error.message || 'Error al actualizar la opcion',
        loading: false,
      });
      throw error;
    }
  },

  deleteOption: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchGroups();
    } catch (error: any) {
      set({
        error: error.message || 'Error al eliminar la opcion',
        loading: false,
      });
      throw error;
    }
  },

  toggleOptionActive: async (id, active) => {
    try {
      const { error } = await supabase
        .from('options')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        groups: state.groups.map(g => ({
          ...g,
          options: g.options.map(o => (o.id === id ? { ...o, active } : o)),
        })),
      }));
    } catch (error: any) {
      console.error('Error al cambiar estado de la opcion:', error);
      throw error;
    }
  },

  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setSelectedOption: (option) => set({ selectedOption: option }),
  setIsGroupModalOpen: (isOpen) => {
    set({ isGroupModalOpen: isOpen });
    if (!isOpen) set({ selectedGroup: null });
  },
  setIsOptionModalOpen: (isOpen) => {
    set({ isOptionModalOpen: isOpen });
    if (!isOpen) set({ selectedOption: null });
  },
}));
