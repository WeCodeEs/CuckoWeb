import React, { useState } from 'react';
import { 
  X, ChevronDown, ChevronUp, ForkKnife, Apple, Banana, Beef, Beer, CakeSlice, Candy, Carrot,
  Cherry, Citrus, Coffee, Cookie, Croissant, CupSoda, Egg, Fish, Grape, 
  IceCream, Leaf, Milk, Pizza, Salad, Sandwich, Soup, Wine, Bean, ChefHat, EggFried, Ham, Popcorn, Vegan, Wheat
} from 'lucide-react';
import { useMenuStore } from '../stores/menuStore';

const foodIcons: { [key: string]: React.ElementType } = {
  ForkKnife, ChefHat, Pizza, Sandwich, Soup, Salad, Beef, Fish,
  Ham, Egg, EggFried, Croissant, Cookie, Popcorn, Bean, Wheat,
  CakeSlice, IceCream, Candy, Apple, Banana, Cherry, Citrus,
  Grape, Carrot, Leaf, Vegan, Coffee, CupSoda, Milk, Beer, Wine,
};

const IconRenderer = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const IconComponent = foodIcons[name];
  return IconComponent ? <IconComponent {...props} /> : <ForkKnife {...props} />;
};

interface Props {
  onClose: () => void;
}

export default function MenuModal({ onClose }: Props) {
  const { selectedMenu, createMenu, updateMenu } = useMenuStore();
  const [formData, setFormData] = useState({
    name: selectedMenu?.name || '',
    description: selectedMenu?.description || '',
    active: selectedMenu?.active ?? true,
    icon_name: selectedMenu?.icon_name || 'ForkKnife',
  });
  
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

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
                  <IconRenderer name={formData.icon_name} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  {isIconPickerOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
            </div>
          </div>

          {isIconPickerOpen && (
            <div className="relative">
              <div className="absolute z-10 -mt-3 w-full bg-white dark:bg-darkbg-darker rounded-md shadow-lg border border-gray-200 dark:border-darkbg">
                <div className="p-2 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                  {Object.keys(foodIcons).map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleIconSelect(iconName)}
                      className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-darkbg transition-colors"
                      title={iconName}
                    >
                      <IconRenderer name={iconName} className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                  ))}
                </div>
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
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Menú Activo
            </label>
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