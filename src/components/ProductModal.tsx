import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Search, RefreshCw, Package, Settings, Layers } from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useOptionGroupStore, Option } from '../stores/optionGroupStore';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import OptionGroupCard from './product/OptionGroupCard';

interface Props {
  onClose: () => void;
}

interface SelectedGroupState {
  enabled: boolean;
  options: Record<number, { enabled: boolean; priceOverride: number | null }>;
}

export default function ProductModal({ onClose }: Props) {
  const { selectedProduct, createProduct, updateProduct } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const {
    groups: optionGroups,
    fetchGroups,
    setIsGroupModalOpen,
  } = useOptionGroupStore();

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

  const [selectedGroups, setSelectedGroups] = useState<Record<number, SelectedGroupState>>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionSearch, setOptionSearch] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    setLoadingOptions(true);
    fetchGroups().finally(() => setLoadingOptions(false));

    if (selectedProduct) {
      if (selectedProduct.image_url) {
        setImagePreview(selectedProduct.image_url);
      }

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
  }, [fetchCategories, fetchGroups, selectedProduct]);

  const filteredGroups = optionGroups.filter(group =>
    group.active &&
    (group.name.toLowerCase().includes(optionSearch.toLowerCase()) ||
      group.options.some(opt => opt.name.toLowerCase().includes(optionSearch.toLowerCase())))
  );

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

  const handleOptionToggle = (groupId: number, optionId: number, option: Option) => {
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
              priceOverride: newEnabled ? (optionState?.priceOverride ?? null) : null,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const optionGroupsData = Object.entries(selectedGroups)
        .filter(([_, state]) => state.enabled)
        .map(([groupId, state], index) => {
          const gId = parseInt(groupId);
          return {
            option_group_id: gId,
            sort_order: index,
            options: Object.entries(state.options)
              .filter(([_, optState]) => optState.enabled)
              .map(([optionId, optState]) => ({
                option_id: parseInt(optionId),
                additional_price: optState.priceOverride,
              })),
          };
        });

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

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: Package },
    { id: 'options', label: 'Opciones', icon: Settings },
  ];

  const activeGroupsCount = Object.values(selectedGroups).filter(g => g.enabled).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex flex-col h-[85vh]">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-darkbg bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Package className="w-6 h-6" />
                {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-6 py-3 border-b border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg-darker">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                let badge = '';

                if (tab.id === 'options' && activeGroupsCount > 0) {
                  badge = activeGroupsCount.toString();
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-darkbg-lighter text-primary dark:text-secondary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-darkbg-lighter/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {badge && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-primary dark:bg-secondary text-white rounded-full">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form id="productForm" onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category_id">Categoría</Label>
                        <select
                          id="category_id"
                          value={formData.category_id}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            category_id: parseInt(e.target.value)
                          }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Seleccionar Categoría</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="name">Nombre del Producto</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="h-12"
                          placeholder="Ej: Cafe Americano"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="base_price">Precio Base</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                          <Input
                            type="number"
                            id="base_price"
                            value={formData.base_price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              base_price: parseFloat(e.target.value) || 0
                            }))}
                            min="0"
                            step="0.50"
                            className="pl-8 h-12"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white resize-none"
                          placeholder="Describe tu producto..."
                        />
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-darkbg-lighter rounded-lg">
                        <input
                          type="checkbox"
                          id="active"
                          checked={formData.active}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            active: e.target.checked
                          }))}
                          className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
                        />
                        <Label htmlFor="active" className="text-sm font-medium">
                          Producto Activo
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label>Imagen del Producto</Label>
                      <div className="mt-2 space-y-4">
                        {imagePreview && (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-darkbg">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                                setFormData(prev => ({ ...prev, image_url: '' }));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center justify-center w-full">
                          <label className="w-full flex flex-col items-center px-6 py-8 bg-white dark:bg-darkbg-lighter rounded-lg border-2 border-gray-300 dark:border-darkbg border-dashed cursor-pointer hover:bg-gray-50 dark:hover:bg-darkbg transition-colors">
                            <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {imageFile ? imageFile.name : 'Seleccionar imagen'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              PNG, JPG hasta 2MB
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'options' && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary dark:text-secondary" />
                        Grupos de Opciones
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Activa los grupos y personaliza las opciones disponibles para este producto
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setLoadingOptions(true);
                          fetchGroups().finally(() => setLoadingOptions(false));
                        }}
                        disabled={loadingOptions}
                        className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
                        title="Recargar opciones"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingOptions ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsGroupModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Nuevo Grupo
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar grupos u opciones..."
                      value={optionSearch}
                      onChange={(e) => setOptionSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>

                  {activeGroupsCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 dark:bg-secondary/10 rounded-lg border border-primary/10 dark:border-secondary/15">
                      <div className="w-2 h-2 rounded-full bg-primary dark:bg-secondary" />
                      <span className="text-sm text-primary-dark dark:text-secondary font-medium">
                        {activeGroupsCount} {activeGroupsCount === 1 ? 'grupo activo' : 'grupos activos'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                    {loadingOptions ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Cargando opciones...</p>
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-darkbg flex items-center justify-center mb-3">
                          <Layers className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {optionSearch ? 'Sin resultados' : 'Sin grupos disponibles'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {optionSearch ? 'Intenta con otro termino de busqueda' : 'Crea tu primer grupo de opciones'}
                        </p>
                      </div>
                    ) : (
                      filteredGroups.map(group => (
                        <OptionGroupCard
                          key={group.id}
                          group={group}
                          groupState={selectedGroups[group.id]}
                          onGroupToggle={handleGroupToggle}
                          onOptionToggle={handleOptionToggle}
                          onPriceOverride={handlePriceOverride}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg-darker">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-darkbg-lighter border border-gray-300 dark:border-darkbg rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
