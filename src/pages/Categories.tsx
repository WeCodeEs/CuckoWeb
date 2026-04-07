import React, { useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, CircleAlert as AlertCircle } from 'lucide-react';
import { useCategoryStore, Category } from '../stores/categoryStore';
import { useProductStore } from '../stores/productStore';
import CategoryModal from '../components/CategoryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import { getCategoryNameFrequencies, formatCategoryName } from '../utils/categoryUtils';

export default function Categories() {
  const {
    categories,
    loading,
    error,
    isModalOpen,
    fetchCategories,
    toggleCategoryStatus,
    deleteCategory,
    setSelectedCategory,
    setIsModalOpen
  } = useCategoryStore();

  const { deactivateProductsByCategory, fetchProducts } = useProductStore();
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryFrequencies = useMemo(() => {
    return getCategoryNameFrequencies(categories);
  }, [categories]);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (category: Category) => {
    const newStatus = !category.active;

    if (newStatus === true) {
      if (category.menu && !category.menu.active) {
        alert(`No se puede activar la categoría "${category.name}" porque el menú "${category.menu.name}" está desactivado.`);
        return; 
      }
    }
    
    if (newStatus === false) {
      const confirmed = window.confirm(
        `¿Estás seguro de que deseas desactivar la categoría "${category.name}"? \n\nTodos los productos dentro de esta categoría también se desactivarán.`
      );
      if (!confirmed) return;
    }

    try {
      await toggleCategoryStatus(category.id, newStatus);
      
      if (newStatus === false) {
        await deactivateProductsByCategory(category.id);
        fetchProducts(); 
      }
    } catch (err) {
      console.error("Error al cambiar el estado de la categoría:", err);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      fetchProducts();
    } catch (err) {
      console.error('Error al eliminar la categoria:', err);
    } finally {
      setCategoryToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar las categorías</p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchCategories()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Categorías</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona las categorías del sistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={4} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Menú
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                {categories.map((category) => (
                  <tr 
                    key={category.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCategoryName(category, categoryFrequencies)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {category.menu?.name || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          category.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={category.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {category.active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(category.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(category)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay categorías registradas</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CategoryModal onClose={() => setIsModalOpen(false)} />}

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Eliminar categoria"
        message={`Esta accion es permanente. La categoria "${categoryToDelete?.name}" y todos sus productos seran eliminados. Los pedidos anteriores conservaran su historial.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}