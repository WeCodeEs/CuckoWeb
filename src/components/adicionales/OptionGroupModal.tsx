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

export default function OptionGroupModal({ onClose }: Props) {
  const { selectedGroup, createGroup, updateGroup, groups } = useOptionGroupStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedGroup?.name || '',
    min_select: selectedGroup?.min_select ?? 0,
    max_select: selectedGroup?.max_select ?? 1,
    active: selectedGroup?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const normalizedName = normalizeText(formData.name);

    if (!normalizedName) {
      newErrors.name = 'El nombre es requerido';
    } else if (normalizedName.length > 100) {
      newErrors.name = 'El nombre no puede exceder los 100 caracteres';
    } else {
      const isDuplicate = groups.some(group =>
        group.id !== selectedGroup?.id &&
        group.name.toLowerCase() === normalizedName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = 'Ya existe un grupo con este nombre';
      }
    }

    if (formData.min_select < 0) {
      newErrors.min_select = 'No puede ser negativo';
    }

    if (formData.max_select < 1) {
      newErrors.max_select = 'Debe ser al menos 1';
    }

    if (formData.min_select > formData.max_select) {
      newErrors.min_select = 'No puede ser mayor que el maximo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const normalizedName = normalizeText(formData.name);

      if (selectedGroup) {
        await updateGroup(selectedGroup.id, {
          name: normalizedName,
          min_select: formData.min_select,
          max_select: formData.max_select,
          active: formData.active,
        });
        toast({
          title: 'Grupo actualizado',
          description: 'El grupo se ha actualizado exitosamente',
        });
      } else {
        await createGroup({
          name: normalizedName,
          min_select: formData.min_select,
          max_select: formData.max_select,
        });
        toast({
          title: 'Grupo creado',
          description: 'El grupo se ha creado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar el grupo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedGroup ? 'Editar Grupo de Opciones' : 'Nuevo Grupo de Opciones'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Grupo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={errors.name ? 'border-red-500' : ''}
              maxLength={100}
              placeholder="Ej: Tamano, Extras, Tipo de leche"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_select">Seleccion Minima</Label>
              <Input
                type="number"
                id="min_select"
                value={formData.min_select}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    min_select: parseInt(e.target.value) || 0,
                  }));
                  if (errors.min_select) setErrors(prev => ({ ...prev, min_select: '' }));
                }}
                min="0"
                className={errors.min_select ? 'border-red-500' : ''}
              />
              {errors.min_select && (
                <p className="text-sm text-red-500">{errors.min_select}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                0 = opcional
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_select">Seleccion Maxima</Label>
              <Input
                type="number"
                id="max_select"
                value={formData.max_select}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    max_select: parseInt(e.target.value) || 1,
                  }));
                  if (errors.max_select) setErrors(prev => ({ ...prev, max_select: '' }));
                }}
                min="1"
                className={errors.max_select ? 'border-red-500' : ''}
              />
              {errors.max_select && (
                <p className="text-sm text-red-500">{errors.max_select}</p>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.min_select === 0 && formData.max_select === 1 && (
                'El cliente puede seleccionar hasta 1 opcion (opcional)'
              )}
              {formData.min_select === 1 && formData.max_select === 1 && (
                'El cliente debe seleccionar exactamente 1 opcion (requerido)'
              )}
              {formData.min_select === 0 && formData.max_select > 1 && (
                `El cliente puede seleccionar hasta ${formData.max_select} opciones (opcional)`
              )}
              {formData.min_select > 0 && formData.max_select > 1 && formData.min_select < formData.max_select && (
                `El cliente debe seleccionar entre ${formData.min_select} y ${formData.max_select} opciones`
              )}
              {formData.min_select > 0 && formData.min_select === formData.max_select && formData.max_select > 1 && (
                `El cliente debe seleccionar exactamente ${formData.max_select} opciones`
              )}
            </p>
          </div>

          {selectedGroup && (
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
              <Label htmlFor="active">Grupo Activo</Label>
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
