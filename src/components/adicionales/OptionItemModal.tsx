import { useState } from 'react';
import { useOptionGroupStore } from '../../stores/optionGroupStore';
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

const normalizeText = (text: string): string => {
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
};

export default function OptionItemModal({ onClose }: Props) {
  const { selectedGroup, selectedOption, createOption, updateOption } = useOptionGroupStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedOption?.name || '',
    additional_price: selectedOption?.additional_price ?? 0,
    active: selectedOption?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const normalizedName = normalizeText(formData.name);

    if (!normalizedName) {
      newErrors.name = 'El nombre es requerido';
    } else if (normalizedName.length > 100) {
      newErrors.name = 'El nombre no puede exceder los 100 caracteres';
    } else if (selectedGroup) {
      const isDuplicate = selectedGroup.options.some(opt =>
        opt.id !== selectedOption?.id &&
        opt.name.toLowerCase() === normalizedName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = 'Ya existe una opcion con este nombre en el grupo';
      }
    }

    if (formData.additional_price < 0) {
      newErrors.additional_price = 'El precio no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedGroup) return;

    try {
      setLoading(true);
      const normalizedName = normalizeText(formData.name);

      if (selectedOption) {
        await updateOption(selectedOption.id, {
          name: normalizedName,
          additional_price: formData.additional_price,
          active: formData.active,
        });
        toast({
          title: 'Opcion actualizada',
          description: 'La opcion se ha actualizado exitosamente',
        });
      } else {
        await createOption(selectedGroup.id, {
          name: normalizedName,
          additional_price: formData.additional_price,
        });
        toast({
          title: 'Opcion creada',
          description: 'La opcion se ha creado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar la opcion',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGroup) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedOption ? 'Editar Opcion' : 'Nueva Opcion'}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grupo: {selectedGroup.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Opcion</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={errors.name ? 'border-red-500' : ''}
              maxLength={100}
              placeholder="Ej: Grande, Mediano, Extra queso"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
            {formData.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se guardara como: "{normalizeText(formData.name)}"
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_price">Precio Adicional (MXN)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <Input
                type="number"
                id="additional_price"
                value={formData.additional_price}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    additional_price: parseFloat(e.target.value) || 0,
                  }));
                  if (errors.additional_price) setErrors(prev => ({ ...prev, additional_price: '' }));
                }}
                min="0"
                step="0.50"
                className={`pl-8 ${errors.additional_price ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.additional_price && (
              <p className="text-sm text-red-500">{errors.additional_price}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deja en 0 si no tiene costo adicional
            </p>
          </div>

          {selectedOption && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  active: e.target.checked,
                }))}
                className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20 dark:bg-darkbg-lighter"
              />
              <Label htmlFor="active">Opcion Activa</Label>
            </div>
          )}

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
