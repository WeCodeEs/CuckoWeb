export interface ProductModalProps {
  onClose: () => void;
}

export interface SelectedGroupState {
  enabled: boolean;
  options: Record<number, { enabled: boolean; priceOverride: number | null }>;
}

export interface OptionRow {
  tempId: string;
  name: string;
  additional_price: string;
}
