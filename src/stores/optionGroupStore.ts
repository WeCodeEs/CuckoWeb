import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  validateGroupPayload,
  createGroup,
  updateGroup,
  syncOptionsWithDB,
} from './optionGroup';

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

export interface OptionInput {
  id?: number;
  name: string;
  additional_price: number;
}

interface OptionGroupState {
  groups: OptionGroup[];
  loading: boolean;
  error: string | null;
  selectedGroup: OptionGroup | null;
  isGroupModalOpen: boolean;
  fetchGroups: () => Promise<OptionGroup[]>;
  saveGroupWithOptions: (data: {
    groupId?: number | null;
    name: string;
    min_select: number;
    max_select: number;
    active: boolean;
    options: OptionInput[];
  }) => Promise<number>;
  deleteGroup: (id: number) => Promise<void>;
  toggleGroupActive: (id: number, active: boolean) => Promise<void>;
  setSelectedGroup: (group: OptionGroup | null) => void;
  setIsGroupModalOpen: (isOpen: boolean) => void;
}

export const useOptionGroupStore = create<OptionGroupState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,
  selectedGroup: null,
  isGroupModalOpen: false,

  fetchGroups: async () => {
    try {
      set({ loading: true, error: null });

      const { data: groups, error: groupsError } = await supabase
        .from('option_groups')
        .select('*')
        .order('name', { ascending: true });

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

  saveGroupWithOptions: async (data) => {
    const { groupId, name, min_select, max_select, active, options } = data;

    try {
      validateGroupPayload(data);
      set({ loading: true, error: null });

      const headerData = { name, min_select, max_select, active };

      const resultGroupId = groupId
        ? await updateGroup(groupId, headerData)
        : await createGroup(headerData);

      await syncOptionsWithDB(resultGroupId, options);

      await get().fetchGroups();
      return resultGroupId;
    } catch (error: any) {
      set({ error: error.message || 'Error al guardar el grupo' });
      throw error;
    } finally {
      set({ loading: false, isGroupModalOpen: false, selectedGroup: null });
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

  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setIsGroupModalOpen: (isOpen) => {
    set({ isGroupModalOpen: isOpen });
    if (!isOpen) set({ selectedGroup: null });
  },
}));
