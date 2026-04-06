import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../stores/productStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useToast } from '../ui/use-toast';
import type { SelectedGroupState } from './types';
import type { OptionGroup } from '../../stores/optionGroupStore';

export function useProductForm(onClose: () => void) {
  const { selectedProduct, createProduct, updateProduct } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'options'>('basic');
  const [formData, setFormData] = useState({
    name: selectedProduct?.name || '',
    category_id: selectedProduct?.category_id || 0,
    description: selectedProduct?.description || '',
    base_price: selectedProduct?.base_price || 0,
    image_url: selectedProduct?.image_url || '',
    active: selectedProduct?.active ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();

    if (selectedProduct?.image_url) {
      setImagePreview(selectedProduct.image_url);
    }
  }, [fetchCategories, selectedProduct]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre del producto es requerido');
      return false;
    }
    if (!formData.category_id) {
      setError('Debe seleccionar una categoría');
      return false;
    }
    if (formData.base_price <= 0) {
      setError('El precio base debe ser mayor a 0');
      return false;
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB');
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError(null);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    selectedGroups: Record<number, SelectedGroupState>,
    optionGroups: OptionGroup[]
  ) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const enabledGroups = Object.entries(selectedGroups)
        .filter(([_, state]) => state.enabled)
        .map(([groupId, state]) => {
          const gId = parseInt(groupId);
          const group = optionGroups.find(g => g.id === gId);
          return {
            groupId: gId,
            groupName: group?.name || '',
            state,
          };
        })
        .sort((a, b) => a.groupName.localeCompare(b.groupName));

      const optionGroupsData = enabledGroups.map((item, index) => ({
        option_group_id: item.groupId,
        sort_order: index,
        options: Object.entries(item.state.options)
          .filter(([_, optState]) => optState.enabled)
          .map(([optionId, optState]) => ({
            option_id: parseInt(optionId),
            additional_price: optState.priceOverride,
          })),
      }));

      const productData = {
        ...formData,
        option_groups: optionGroupsData,
      };

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData, imageFile || undefined);
      } else {
        await createProduct(productData, imageFile || undefined);
      }

      toast({
        title: selectedProduct ? 'Producto actualizado' : 'Producto creado',
        description: selectedProduct ? 'El producto se ha actualizado exitosamente' : 'El producto se ha creado exitosamente',
      });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedProduct,
    categories,
    loading,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    imageFile,
    imagePreview,
    error,
    handleImageChange,
    clearImage,
    handleSubmit,
  };
}
