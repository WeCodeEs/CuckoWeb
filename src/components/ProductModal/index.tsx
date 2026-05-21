import { X, Package, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useProductForm } from './useProductForm';
import { useOptionGroupManager } from './useOptionGroupManager';
import BasicInfoTab from './BasicInfoTab';
import OptionsTab from './OptionsTab';
import CreateOptionGroupModal from './CreateOptionGroupModal';
import type { ProductModalProps } from './types';

const tabs = [
  { id: 'basic', label: 'Información Básica', icon: Package },
  { id: 'options', label: 'Opciones', icon: Settings },
] as const;

export default function ProductModal({ onClose }: ProductModalProps) {
  const form = useProductForm(onClose);
  const optionManager = useOptionGroupManager();

  const {
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
  } = form;

  const {
    selectedGroups,
    isGroupModalOpen,
    activeGroupsCount,
  } = optionManager;

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
                    onClick={() => setActiveTab(tab.id as 'basic' | 'options')}
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
            <form
              id="productForm"
              onSubmit={(e) => handleSubmit(e, selectedGroups)}
              className="p-6"
            >
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {activeTab === 'basic' && (
                <BasicInfoTab
                  formData={formData}
                  setFormData={setFormData}
                  categories={categories}
                  imageFile={imageFile}
                  imagePreview={imagePreview}
                  handleImageChange={handleImageChange}
                  clearImage={clearImage}
                />
              )}

              {activeTab === 'options' && (
                <OptionsTab manager={optionManager} />
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

      {isGroupModalOpen && (
        <CreateOptionGroupModal manager={optionManager} />
      )}
    </Dialog>
  );
}
