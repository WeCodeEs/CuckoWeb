import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useMenuStore } from '../stores/menuStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useProductStore } from '../stores/productStore';
import { foodIcons, MenuIcon } from '../utils/menuIcons';

interface Props {
  onClose: () => void;
}

export default function MenuModal({ onClose }: Props) {
  const { selectedMenu, menus, createMenu, updateMenu } = useMenuStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchProducts } = useProductStore();
  const [formData, setFormData] = useState({
    name: selectedMenu?.name || '',
    description: selectedMenu?.description || '',
    active: selectedMenu?.active ?? true,
    icon_name: selectedMenu?.icon_name || 'ForkKnife',
    is_default: selectedMenu?.is_default ?? false,
  });
  
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const usedIconsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of menus) {
      if (selectedMenu && m.id === selectedMenu.id) continue;
      if (m.icon_name && !map[m.icon_name]) {
        map[m.icon_name] = m.name;
      }
    }
    return map;
  }, [menus, selectedMenu]);

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon_name: iconName }));
    setIsIconPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedMenu) {
        await updateMenu(selectedMenu.id, formData);
      } else {
        await createMenu(formData);
      }
      await Promise.all([fetchCategories(), fetchProducts()]);
      onClose();
    } catch (error) {
      console.error('Error saving menu:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">
            {selectedMenu ? 'Editar Menú' : 'Crear Nuevo Menú'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3"> 
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 h-10 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div> 
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ícono
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 h-10 rounded-lg border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg"
                >
                  <MenuIcon name={formData.icon_name} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  {isIconPickerOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
            </div>
          </div>

          {isIconPickerOpen && (
            <div className="relative">
              <div className="absolute z-10 -mt-3 w-full bg-white dark:bg-darkbg-darker rounded-md shadow-lg border border-gray-200 dark:border-darkbg">
                <div className="p-2 grid grid-cols-8 gap-1.5 max-h-56 overflow-y-auto">
                  {Object.keys(foodIcons).map(iconName => {
                    const usedByMenu = usedIconsMap[iconName];
                    const isSelected = formData.icon_name === iconName;

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleIconSelect(iconName)}
                        className={`relative flex items-center justify-center p-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary/15 dark:bg-secondary/20 ring-2 ring-primary dark:ring-secondary'
                            : usedByMenu
                              ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                              : 'hover:bg-gray-100 dark:hover:bg-darkbg'
                        }`}
                        title={usedByMenu ? `Usado por "${usedByMenu}"` : iconName}
                      >
                        <MenuIcon
                          name={iconName}
                          className={`w-6 h-6 ${
                            isSelected
                              ? 'text-primary dark:text-secondary'
                              : usedByMenu
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-700 dark:text-gray-300'
                          }`}
                        />
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary dark:bg-secondary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                        {usedByMenu && !isSelected && (
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 dark:bg-amber-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {Object.keys(usedIconsMap).length > 0 && (
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-darkbg">
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-400 dark:bg-amber-500 rounded-full flex-shrink-0" />
                      Los íconos con punto ya están asignados a otro menú
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => {
                  const newActive = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    active: newActive,
                    is_default: newActive ? prev.is_default : false,
                  }));
                }}
                className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Menú Activo
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => {
                  const newDefault = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    is_default: newDefault,
                    active: newDefault ? true : prev.active,
                  }));
                }}
                className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20"
              />
              <label htmlFor="is_default" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span>Menú Predeterminado</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  (Se abrirá por defecto al cargar la app)
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark"
            >
              {selectedMenu ? 'Guardar Cambios' : 'Crear Menú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
