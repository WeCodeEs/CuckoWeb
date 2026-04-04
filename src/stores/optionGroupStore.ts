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

  saveGroupWithOptions: async ({ groupId, name, min_select, max_select, active, options }) => {
    try {
      set({ loading: true, error: null });

      let resultGroupId: number;

      if (!groupId) {
        const { data: groupData, error: groupError } = await supabase
          .from('option_groups')
          .insert({ name, min_select, max_select, active })
          .select('id')
          .single();

        if (groupError) {
          if (groupError.code === '23505') throw new Error('Ya existe un grupo con este nombre');
          throw groupError;
        }

        resultGroupId = groupData.id;

        if (options.length > 0) {
          const { error: optError } = await supabase
            .from('options')
            .insert(options.map(o => ({
              option_group_id: resultGroupId,
              name: o.name,
              additional_price: o.additional_price,
              active: true,
            })));

          if (optError) throw optError;
        }
      } else {
        resultGroupId = groupId;

        const { error: groupError } = await supabase
          .from('option_groups')
          .update({ name, min_select, max_select, active })
          .eq('id', groupId);

        if (groupError) {
          if (groupError.code === '23505') throw new Error('Ya existe un grupo con este nombre');
          throw groupError;
        }

        const existingOptions = options.filter(o => o.id);
        const newOptions = options.filter(o => !o.id);

        for (const opt of existingOptions) {
          const { error: updErr } = await supabase
            .from('options')
            .update({ name: opt.name, additional_price: opt.additional_price })
            .eq('id', opt.id!);

          if (updErr) throw updErr;
        }

        if (newOptions.length > 0) {
          const { error: insErr } = await supabase
            .from('options')
            .insert(newOptions.map(o => ({
              option_group_id: groupId,
              name: o.name,
              additional_price: o.additional_price,
              active: true,
            })));

          if (insErr) throw insErr;
        }

        const keepIds = existingOptions.map(o => o.id!);
        if (keepIds.length > 0) {
          const { error: delErr } = await supabase
            .from('options')
            .delete()
            .eq('option_group_id', groupId)
            .not('id', 'in', `(${keepIds.join(',')})`);

          if (delErr) throw delErr;
        } else {
          const { error: delErr } = await supabase
            .from('options')
            .delete()
            .eq('option_group_id', groupId);

          if (delErr) throw delErr;
        }
      }

      await get().fetchGroups();
      set({ isGroupModalOpen: false, selectedGroup: null });
      return resultGroupId;
    } catch (error: any) {
      set({
        error: error.message || 'Error al guardar el grupo',
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

  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setIsGroupModalOpen: (isOpen) => {
    set({ isGroupModalOpen: isOpen });
    if (!isOpen) set({ selectedGroup: null });
  },
}));
