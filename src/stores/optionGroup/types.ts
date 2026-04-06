import type { OptionInput } from '../optionGroupStore';

export interface GroupPayload {
  groupId?: number | null;
  name: string;
  min_select: number;
  max_select: number;
  active: boolean;
  options: OptionInput[];
}

export interface DbOption {
  id: number;
  option_group_id: number;
  name: string;
  additional_price: number;
  active: boolean;
}

export interface OptionsDiff {
  toInsert: OptionInput[];
  toUpdate: OptionInput[];
  toDelete: number[];
}

export interface GroupHeaderData {
  name: string;
  min_select: number;
  max_select: number;
  active: boolean;
}
