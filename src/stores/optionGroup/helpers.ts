import { supabase } from '../../lib/supabase';
import type { OptionInput } from '../optionGroupStore';
import type { GroupPayload, DbOption, OptionsDiff, GroupHeaderData } from './types';

export function validateGroupPayload(data: GroupPayload): void {
  if (!data.name || data.name.trim() === '') {
    throw new Error('El nombre del grupo es requerido');
  }

  if (data.min_select < 0) {
    throw new Error('La selección mínima no puede ser negativa');
  }

  if (data.max_select < 0) {
    throw new Error('La selección máxima no puede ser negativa');
  }

  if (data.min_select > data.max_select) {
    throw new Error('La selección mínima no puede ser mayor que la máxima');
  }

  for (const option of data.options) {
    if (!option.name || option.name.trim() === '') {
      throw new Error('Todas las opciones deben tener un nombre');
    }

    if (typeof option.additional_price !== 'number' || isNaN(option.additional_price)) {
      throw new Error('El precio adicional debe ser un número válido');
    }

    if (option.additional_price < 0) {
      throw new Error('El precio adicional no puede ser negativo');
    }
  }
}

export function computeOptionsDiff(
  dbOptions: DbOption[],
  incomingOptions: OptionInput[]
): OptionsDiff {
  const dbIdSet = new Set(dbOptions.map(o => o.id));
  const incomingIdSet = new Set(
    incomingOptions.filter(o => o.id !== undefined).map(o => o.id!)
  );

  const toInsert = incomingOptions.filter(o => o.id === undefined);

  const toUpdate = incomingOptions.filter(
    o => o.id !== undefined && dbIdSet.has(o.id)
  );

  const toDelete = dbOptions
    .filter(o => !incomingIdSet.has(o.id))
    .map(o => o.id);

  return { toInsert, toUpdate, toDelete };
}

export async function fetchCurrentOptions(groupId: number): Promise<DbOption[]> {
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('option_group_id', groupId);

  if (error) {
    throw new Error(`Error al obtener opciones actuales: ${error.message}`);
  }

  return data || [];
}

export async function createGroup(headerData: GroupHeaderData): Promise<number> {
  const { data, error } = await supabase
    .from('option_groups')
    .insert(headerData)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un grupo con este nombre');
    }
    throw new Error(`Error al crear el grupo: ${error.message}`);
  }

  return data.id;
}

export async function updateGroup(
  groupId: number,
  headerData: GroupHeaderData
): Promise<number> {
  const { error } = await supabase
    .from('option_groups')
    .update(headerData)
    .eq('id', groupId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un grupo con este nombre');
    }
    throw new Error(`Error al actualizar el grupo: ${error.message}`);
  }

  return groupId;
}

export async function syncOptionsWithDB(
  groupId: number,
  incomingOptions: OptionInput[]
): Promise<void> {
  const dbOptions = await fetchCurrentOptions(groupId);
  const { toInsert, toUpdate, toDelete } = computeOptionsDiff(dbOptions, incomingOptions);

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('options')
      .insert(
        toInsert.map(o => ({
          option_group_id: groupId,
          name: o.name,
          additional_price: o.additional_price,
          active: true,
        }))
      );
    if (error) throw new Error(`Error al insertar opciones: ${error.message}`);
  }

  for (const opt of toUpdate) {
    const { error } = await supabase
      .from('options')
      .update({
        name: opt.name,
        additional_price: opt.additional_price,
      })
      .eq('id', opt.id!);
    if (error) throw new Error(`Error al actualizar opcion: ${error.message}`);
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('options')
      .delete()
      .in('id', toDelete);
    if (error) throw new Error(`Error al eliminar opciones: ${error.message}`);
  }
}
