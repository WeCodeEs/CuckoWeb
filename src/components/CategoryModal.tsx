import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCategoryStore } from '../stores/categoryStore';
import { useMenuStore } from '../stores/menuStore';
import { useToast } from './ui/use-toast';

interface Props {
  onClose: () => void;
}

export default function CategoryModal({ onClose }: Props) {
  const { selectedCategory, createCategory, updateCategory } = useCategoryStore();
  const { menus, fetchMenus } = useMenuStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: selectedCategory?.name || '',
    menu_id: selectedCategory?.menu_id || 0,
    active: selectedCategory?.active ?? true,
  });

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
        toast({ title: 'Categoría actualizada', description: 'Los cambios se guardaron correctamente.' });
      } else {
        await createCategory(formData);
        toast({ title: 'Categoría creada', description: 'La categoría se creó correctamente.' });
      }
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error?.message || 'No se pudo guardar la categoría.',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="menu_id"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Menú
            </label>
            <select
              id="menu_id"
              value={formData.menu_id}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                menu_id: parseInt(e.target.value)
              }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              <option value="">Seleccionar Menú</option>
              {menus
                .filter(menu => menu.active)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(menu => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/20"
            />
            <label
              htmlFor="active"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Categoría Activa
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              {selectedCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}