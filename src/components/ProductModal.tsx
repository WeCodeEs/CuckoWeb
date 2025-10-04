import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Search, RefreshCw, Package, Settings, Palette } from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useVariantOptionStore } from '../stores/variantOptionStore';
import { useIngredientOptionStore } from '../stores/ingredientOptionStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface Props {
  onClose: () => void;
}

export default function ProductModal({ onClose }: Props) {
  const { selectedProduct, createProduct, updateProduct, fetchProductVariants } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { 
    options: variants, 
    fetchOptions: fetchVariants,
    setIsModalOpen: setVariantModalOpen 
  } = useVariantOptionStore();
  const { 
    options: ingredients, 
    fetchOptions: fetchIngredients,
    setIsModalOpen: setIngredientModalOpen 
  } = useIngredientOptionStore();
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'ingredients'>('basic');
  const [formData, setFormData] = useState({
    name: selectedProduct?.name || '',
    category_id: selectedProduct?.category_id || 0,
    description: selectedProduct?.description || '',
    base_price: selectedProduct?.base_price || 0,
    image_url: selectedProduct?.image_url || '',
    active: selectedProduct?.active ?? true,
  });

  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [variantState, setVariantState] = useState<Record<number, { active: boolean; priceOverride: number }>>({});
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interactionLock, setInteractionLock] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    loadVariants();
    fetchIngredients();
    if (selectedProduct) {
      if (selectedProduct.image_url) {
        setImagePreview(selectedProduct.image_url);
      }
      // Set initial ingredients
      const initialIngredients = selectedProduct.ingredients?.map(i => i.ingredient_option_id) || [];
      setSelectedIngredients(initialIngredients);
    }
  }, [fetchCategories, fetchIngredients, selectedProduct]);

  const loadVariants = async () => {
    try {
      setLoadingVariants(true);
      
      await fetchVariants();
      
      if (selectedProduct) {
        // Load existing product variants
        const productVariants = await fetchProductVariants(selectedProduct.id);
        
        const initialState: Record<number, { active: boolean; priceOverride: number }> = {};
        
        // Initialize state for all globally active variants
        variants.filter(v => v.active).forEach(variant => {
          const productVariant = productVariants.find(pv => pv.id === variant.id);
          const hasProductVariant = productVariant?.product_variants?.[0];
          
          initialState[variant.id] = {
            active: hasProductVariant?.active || false,
            priceOverride: hasProductVariant?.additional_price ?? variant.additional_price
          };
        });
        
        setVariantState(initialState);
      } else {
        // For new products, initialize with all variants inactive
        const initialState: Record<number, { active: boolean; priceOverride: number }> = {};
        variants.filter(v => v.active).forEach(variant => {
          initialState[variant.id] = {
            active: false,
            priceOverride: variant.additional_price
          };
        });
        setVariantState(initialState);
      }
    } catch (error) {
      // Error loading variants
    } finally {
      setLoadingVariants(false);
    }
  };

  const filteredVariants = variants.filter(variant => 
    variant.active &&
    variant.name.toLowerCase().includes(variantSearch.toLowerCase())
  );

  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
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

  const handleVariantToggle = (variantId: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    // Lock the current sorting order during interaction
    setInteractionLock(variantId);
    
    // Clear the lock after a short delay to allow for price editing
    setTimeout(() => {
      setInteractionLock(null);
    }, 2000);
    setVariantState(prev => ({
      ...prev,
      [variantId]: {
        active: !prev[variantId]?.active,
        priceOverride: prev[variantId]?.priceOverride ?? variant.additional_price
      }
    }));
  };

  const handlePriceChange = (variantId: number, price: number) => {
    setVariantState(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        priceOverride: price
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const productData = {
        ...formData,
        ingredients: selectedIngredients,
        variants: Object.entries(variantState)
          .filter(([_, state]) => state.active)
          .map(([variantId, state]) => ({
            variant_option_id: parseInt(variantId),
            additional_price: state.priceOverride || variants.find(v => v.id === parseInt(variantId))?.additional_price || 0
          }))
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
    { id: 'variants', label: 'Variantes', icon: Settings },
    { id: 'ingredients', label: 'Ingredientes', icon: Palette },
  ];

  const activeVariantsCount = Object.values(variantState).filter(v => v.active).length;
  const selectedIngredientsCount = selectedIngredients.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex flex-col h-[85vh]">
          {/* Header */}
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

          {/* Tab Navigation */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-darkbg bg-gray-50 dark:bg-darkbg-darker">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                let badge = '';
                
                if (tab.id === 'variants' && activeVariantsCount > 0) {
                  badge = activeVariantsCount.toString();
                } else if (tab.id === 'ingredients' && selectedIngredientsCount > 0) {
                  badge = selectedIngredientsCount.toString();
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <form id="productForm" onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Basic Information Tab */}
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
                          placeholder="Ej: Café Americano"
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

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Variantes del Producto</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona las variantes disponibles para este producto</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadVariants}
                        disabled={loadingVariants}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
                        title="Recargar variantes"
                      >
                        <RefreshCw className={`w-5 h-5 ${loadingVariants ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariantModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Nueva Variante
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar variantes..."
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {loadingVariants ? (
                      <div className="col-span-full text-center py-8">
                        <div className="w-8 h-8 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando variantes...</p>
                      </div>
                    ) : filteredVariants
                      .sort((a, b) => {
                        const aState = variantState[a.id] || { active: false, priceOverride: a.additional_price };
                        const bState = variantState[b.id] || { active: false, priceOverride: b.additional_price };
                        
                        // When editing a product, show selected variants first
                        if (selectedProduct) {
                          if (aState.active && !bState.active) return -1;
                          if (!aState.active && bState.active) return 1;
                        }
                        
                        // Then sort alphabetically
                        return a.name.localeCompare(b.name);
                      }).length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {variantSearch ? 'No se encontraron variantes' : 'No hay variantes activas disponibles'}
                        </p>
                      </div>
                    ) : (
                      filteredVariants
                        .sort((a, b) => {
                          // If we're in interaction lock mode, don't reorder
                          if (interactionLock !== null) {
                            return a.name.localeCompare(b.name);
                          }
                          
                          // Normal sorting: selected variants first when editing
                          if (selectedProduct) {
                            const aState = variantState[a.id] || { active: false, priceOverride: a.additional_price };
                            const bState = variantState[b.id] || { active: false, priceOverride: b.additional_price };
                            
                            // Selected variants first
                            if (aState.active && !bState.active) return -1;
                            if (!aState.active && bState.active) return 1;
                          }
                          
                          // Then alphabetically
                          return a.name.localeCompare(b.name);
                        })
                        .map(variant => {
                        const state = variantState[variant.id] || { active: false, priceOverride: variant.additional_price };
                        
                        return (
                          <div
                            key={variant.id}
                            className={`p-4 border rounded-lg transition-all ${
                              state.active 
                                ? 'border-primary/30 dark:border-secondary/30 bg-primary/5 dark:bg-secondary/5' 
                                : 'border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter hover:border-gray-300 dark:hover:border-darkbg-darker'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id={`variant-${variant.id}`}
                                  checked={state.active}
                                  onChange={() => handleVariantToggle(variant.id)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
                                />
                                <label htmlFor={`variant-${variant.id}`} className="font-medium text-gray-900 dark:text-white">
                                  {variant.name}
                                </label>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                                Global: {formatCurrency(variant.additional_price)}
                              </span>
                            </div>
                            
                            {state.active && (
                              <div className="pt-3 border-t border-gray-200 dark:border-darkbg">
                                <Label htmlFor={`variant-price-${variant.id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Precio para este producto
                                </Label>
                                <div className="mt-1 relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    id={`variant-price-${variant.id}`}
                                    value={state.priceOverride}
                                    onChange={(e) => handlePriceChange(variant.id, parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.50"
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-darkbg focus:ring-1 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary rounded-lg bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                                    placeholder={formatCurrency(variant.additional_price)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Ingredients Tab */}
              {activeTab === 'ingredients' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredientes Personalizables</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona los ingredientes que los clientes pueden personalizar</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIngredientModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Ingrediente
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar ingredientes..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredIngredients.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Palette className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ingredientSearch ? 'No se encontraron ingredientes' : 'No hay ingredientes disponibles'}
                        </p>
                      </div>
                    ) : (
                      filteredIngredients.map(ingredient => (
                        <div 
                          key={ingredient.id}
                          className={`p-4 border rounded-lg transition-all ${
                            selectedIngredients.includes(ingredient.id)
                              ? 'border-primary/30 dark:border-secondary/30 bg-primary/5 dark:bg-secondary/5'
                              : 'border-gray-200 dark:border-darkbg bg-white dark:bg-darkbg-lighter hover:border-gray-300 dark:hover:border-darkbg-darker'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`ingredient-${ingredient.id}`}
                                checked={selectedIngredients.includes(ingredient.id)}
                                onChange={() => {
                                  setSelectedIngredients(prev => 
                                    prev.includes(ingredient.id)
                                      ? prev.filter(id => id !== ingredient.id)
                                      : [...prev, ingredient.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20"
                              />
                              <Label htmlFor={`ingredient-${ingredient.id}`} className="font-medium text-gray-900 dark:text-white">
                                {ingredient.name}
                              </Label>
                            </div>
                            {ingredient.extra_price > 0 && (
                              <span className="text-sm text-primary dark:text-secondary font-medium">
                                +{formatCurrency(ingredient.extra_price)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
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