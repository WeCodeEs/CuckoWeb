import React, { useState } from 'react';
import { useIngredientOptionStore } from '../../stores/ingredientOptionStore';
import { useToast } from '../ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface Props {
  onClose: () => void;
}

// Helper function to capitalize first letter and lowercase the rest
const normalizeText = (text: string): string => {
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
};
export default function IngredientModal({ onClose }: Props) {
  const { selectedOption, createOption, updateOption, options } = useIngredientOptionStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedOption?.name || '',
    extra_price: selectedOption?.extra_price || 0,
    active: selectedOption?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const normalizedName = normalizeText(formData.name);

    if (!normalizedName) {
      newErrors.name = 'El nombre es requerido';
    } else if (normalizedName.length > 60) {
      newErrors.name = 'El nombre no puede exceder los 60 caracteres';
    } else {
      // Check for duplicates (excluding current item when editing)
      const isDuplicate = options.some(option => 
        option.id !== selectedOption?.id && 
        option.name.toLowerCase() === normalizedName.toLowerCase()
      );
      
      if (isDuplicate) {
        newErrors.name = 'Ya existe un ingrediente con este nombre';
      }
    }

    if (formData.extra_price < 0) {
      newErrors.extra_price = 'El precio extra no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      // Normalize name before saving
      const normalizedName = normalizeText(formData.name);

      if (selectedOption) {
        await updateOption(selectedOption.id, {
          ...formData,
          name: normalizedName,
        });
        toast({
          title: 'Ingrediente actualizado',
          description: 'El ingrediente se ha actualizado exitosamente',
        });
      } else {
        await createOption(normalizedName, formData.extra_price);
        toast({
          title: 'Ingrediente creado',
          description: 'El ingrediente se ha creado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar el ingrediente',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedOption ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              className={errors.name ? 'border-red-500' : ''}
              maxLength={60}
              placeholder="Ej: Queso extra"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
            {formData.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se guardará como: "{normalizeText(formData.name)}"
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra_price">Precio Extra (MXN)</Label>
            <Input
              type="number"
              id="extra_price"
              value={formData.extra_price}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  extra_price: parseFloat(e.target.value) || 0
                }));
                if (errors.extra_price) {
                  setErrors(prev => ({ ...prev, extra_price: '' }));
                }
              }}
              min="0"
              step="0.50"
              className={errors.extra_price ? 'border-red-500' : ''}
            />
            {errors.extra_price && (
              <p className="text-sm text-red-500">{errors.extra_price}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                active: e.target.checked 
              }))}
              className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20 dark:bg-darkbg-lighter"
            />
            <Label htmlFor="active">Ingrediente Activo</Label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg-darker transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}