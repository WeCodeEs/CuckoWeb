import React, { useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getActiveCategories, getSortedCategories, getCategoryNameFrequencies, formatCategoryName } from '../../utils/categoryUtils';
import { IMAGE_PRESETS } from '../../utils/transformImage';
import OptimizedImage from '../OptimizedImage';
import type { Category } from '../../stores/categoryStore';

interface BasicInfoTabProps {
  formData: {
    name: string;
    category_id: number;
    description: string | null;
    base_price: number;
    image_url: string | null;
    active: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<BasicInfoTabProps['formData']>>;
  categories: Category[];
  imageFile: File | null;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
}

export default function BasicInfoTab({
  formData,
  setFormData,
  categories,
  imageFile,
  imagePreview,
  handleImageChange,
  clearImage,
}: BasicInfoTabProps) {
  const categoryOptions = useMemo(() => {
    const activeCategories = getActiveCategories(categories);
    const sortedCategories = getSortedCategories(activeCategories);
    const frequencies = getCategoryNameFrequencies(activeCategories);
    return sortedCategories.map(category => ({
      id: category.id,
      label: formatCategoryName(category, frequencies),
    }));
  }, [categories]);

  return (
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
              {categoryOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
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
              value={formData.description || ''}
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
                <OptimizedImage
                  src={imagePreview}
                  transform={imagePreview.startsWith('blob:') ? undefined : IMAGE_PRESETS.productPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
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
  );
}
