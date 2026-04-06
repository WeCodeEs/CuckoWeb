import { useState, useEffect, useMemo } from 'react';
import { useOptionGroupStore, type Option, type OptionInput } from '../../stores/optionGroupStore';
import { useProductStore } from '../../stores/productStore';
import { useToast } from '../ui/use-toast';
import { normalizeText, generateTempId } from './utils';
import type { SelectedGroupState, OptionRow } from './types';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export function useOptionGroupManager() {
  const { selectedProduct } = useProductStore();
  const {
    groups: optionGroups,
    fetchGroups,
    isGroupModalOpen,
    setIsGroupModalOpen,
    saveGroupWithOptions,
  } = useOptionGroupStore();

  const { toast } = useToast();

  const [selectedGroups, setSelectedGroups] = useState<Record<number, SelectedGroupState>>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionSearch, setOptionSearch] = useState('');

  const [newGroupData, setNewGroupData] = useState({
    name: '',
    min_select: 0,
    max_select: 1,
  });
  const [newGroupOptions, setNewGroupOptions] = useState<OptionRow[]>([
    { tempId: generateTempId(), name: '', additional_price: '' }
  ]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupFormErrors, setGroupFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoadingOptions(true);
    fetchGroups().finally(() => setLoadingOptions(false));

    if (selectedProduct) {
      const initialState: Record<number, SelectedGroupState> = {};
      selectedProduct.option_groups?.forEach(pog => {
        initialState[pog.option_group_id] = {
          enabled: true,
          options: {},
        };
        pog.options.forEach(po => {
          initialState[pog.option_group_id].options[po.option_id] = {
            enabled: po.active,
            priceOverride: po.additional_price,
          };
        });
      });
      setSelectedGroups(initialState);
    }
  }, [fetchGroups, selectedProduct]);

  useEffect(() => {
    return () => {
      setIsGroupModalOpen(false);
    };
  }, [setIsGroupModalOpen]);

  const filteredGroups = useMemo(
    () =>
      optionGroups
        .filter(group =>
          group.active &&
          (group.name.toLowerCase().includes(optionSearch.toLowerCase()) ||
            group.options.some(opt => opt.name.toLowerCase().includes(optionSearch.toLowerCase())))
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [optionGroups, optionSearch]
  );

  const handleGroupToggle = (groupId: number) => {
    const group = optionGroups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedGroups(prev => {
      const current = prev[groupId];
      if (current?.enabled) {
        return {
          ...prev,
          [groupId]: { ...current, enabled: false },
        };
      }

      const activeOptions = group.options.filter(o => o.active);
      const existingOptions = current?.options ?? {};

      const optionsState: Record<number, { enabled: boolean; priceOverride: number | null }> = {};
      activeOptions.forEach(opt => {
        if (existingOptions[opt.id]) {
          optionsState[opt.id] = existingOptions[opt.id];
        } else {
          optionsState[opt.id] = { enabled: true, priceOverride: null };
        }
      });

      return {
        ...prev,
        [groupId]: { enabled: true, options: optionsState },
      };
    });
  };

  const handleOptionToggle = (groupId: number, optionId: number, _option: Option) => {
    setSelectedGroups(prev => {
      const groupState = prev[groupId];
      if (!groupState) return prev;

      const optionState = groupState.options[optionId];
      const newEnabled = !optionState?.enabled;

      return {
        ...prev,
        [groupId]: {
          ...groupState,
          options: {
            ...groupState.options,
            [optionId]: {
              enabled: newEnabled,
              priceOverride: optionState?.priceOverride ?? null,
            },
          },
        },
      };
    });
  };

  const handlePriceOverride = (groupId: number, optionId: number, price: number | null) => {
    setSelectedGroups(prev => {
      const groupState = prev[groupId];
      if (!groupState) return prev;

      return {
        ...prev,
        [groupId]: {
          ...groupState,
          options: {
            ...groupState.options,
            [optionId]: {
              ...groupState.options[optionId],
              priceOverride: price,
            },
          },
        },
      };
    });
  };

  const resetNewGroupForm = () => {
    setNewGroupData({ name: '', min_select: 0, max_select: 1 });
    setNewGroupOptions([{ tempId: generateTempId(), name: '', additional_price: '' }]);
    setGroupFormErrors({});
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    resetNewGroupForm();
  };

  const updateGroupOptionRow = (tempId: string, field: 'name' | 'additional_price', value: string) => {
    setNewGroupOptions(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
    if (groupFormErrors.options) setGroupFormErrors(prev => ({ ...prev, options: '' }));
  };

  const removeGroupOptionRow = (tempId: string) => {
    setNewGroupOptions(prev => {
      const filtered = prev.filter(r => r.tempId !== tempId);
      return filtered.length === 0
        ? [{ tempId: generateTempId(), name: '', additional_price: '' }]
        : filtered;
    });
  };

  const addGroupOptionRow = () => {
    setNewGroupOptions(prev => [...prev, { tempId: generateTempId(), name: '', additional_price: '' }]);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setNewGroupOptions(prev => {
      const oldIndex = prev.findIndex(r => r.tempId === active.id);
      const newIndex = prev.findIndex(r => r.tempId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const validateGroupForm = () => {
    const newErrors: Record<string, string> = {};
    const normalizedName = normalizeText(newGroupData.name);

    if (!normalizedName) {
      newErrors.name = 'El nombre es requerido';
    } else if (normalizedName.length > 100) {
      newErrors.name = 'El nombre no puede exceder los 100 caracteres';
    } else {
      const isDuplicate = optionGroups.some(group =>
        group.name.toLowerCase() === normalizedName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = 'Ya existe un grupo con este nombre';
      }
    }

    if (newGroupData.min_select < 0) {
      newErrors.min_select = 'No puede ser negativo';
    }
    if (newGroupData.max_select < 1) {
      newErrors.max_select = 'Debe ser al menos 1';
    }
    if (newGroupData.min_select > newGroupData.max_select) {
      newErrors.min_select = 'No puede ser mayor que el maximo';
    }

    const validOptions = newGroupOptions.filter(r => r.name.trim() !== '');
    const optionNames = validOptions.map(r => normalizeText(r.name).toLowerCase());
    const hasDuplicateOptions = new Set(optionNames).size !== optionNames.length;
    if (hasDuplicateOptions) {
      newErrors.options = 'Hay opciones con nombres duplicados';
    }

    for (const row of validOptions) {
      const price = parseFloat(row.additional_price) || 0;
      if (price < 0) {
        newErrors.options = 'Los precios no pueden ser negativos';
        break;
      }
    }

    setGroupFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNewGroup = async () => {
    if (!validateGroupForm()) return;

    try {
      setSavingGroup(true);
      const normalizedName = normalizeText(newGroupData.name);

      const validOptions: OptionInput[] = newGroupOptions
        .filter(r => r.name.trim() !== '')
        .map(r => ({
          name: normalizeText(r.name),
          additional_price: parseFloat(r.additional_price) || 0,
        }));

      await saveGroupWithOptions({
        groupId: null,
        name: normalizedName,
        min_select: newGroupData.min_select,
        max_select: newGroupData.max_select,
        active: true,
        options: validOptions,
      });

      setLoadingOptions(true);
      try {
        await fetchGroups();
      } finally {
        setLoadingOptions(false);
      }

      toast({
        title: 'Grupo creado',
        description: 'El grupo y sus opciones se han creado exitosamente',
      });

      handleCloseGroupModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear el grupo';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setSavingGroup(false);
    }
  };

  const getGroupSelectionDescription = () => {
    const { min_select, max_select } = newGroupData;
    if (min_select === 0 && max_select === 1) return 'El cliente puede seleccionar hasta 1 opcion (opcional)';
    if (min_select === 1 && max_select === 1) return 'El cliente debe seleccionar exactamente 1 opcion (requerido)';
    if (min_select === 0 && max_select > 1) return `El cliente puede seleccionar hasta ${max_select} opciones (opcional)`;
    if (min_select > 0 && max_select > 1 && min_select < max_select) return `El cliente debe seleccionar entre ${min_select} y ${max_select} opciones`;
    if (min_select > 0 && min_select === max_select && max_select > 1) return `El cliente debe seleccionar exactamente ${max_select} opciones`;
    return '';
  };

  const validNewGroupOptionCount = newGroupOptions.filter(r => r.name.trim() !== '').length;
  const activeGroupsCount = Object.values(selectedGroups).filter(g => g.enabled).length;

  const refreshGroups = () => {
    setLoadingOptions(true);
    fetchGroups().finally(() => setLoadingOptions(false));
  };

  return {
    optionGroups,
    selectedGroups,
    loadingOptions,
    optionSearch,
    setOptionSearch,
    filteredGroups,
    isGroupModalOpen,
    setIsGroupModalOpen,
    newGroupData,
    setNewGroupData,
    newGroupOptions,
    savingGroup,
    groupFormErrors,
    setGroupFormErrors,
    activeGroupsCount,
    validNewGroupOptionCount,
    handleGroupToggle,
    handleOptionToggle,
    handlePriceOverride,
    handleCloseGroupModal,
    updateGroupOptionRow,
    removeGroupOptionRow,
    addGroupOptionRow,
    handleGroupDragEnd,
    handleSaveNewGroup,
    getGroupSelectionDescription,
    refreshGroups,
  };
}
