import React, { useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, CircleAlert as AlertCircle, Search } from 'lucide-react';
import { useProductStore, Product } from '../stores/productStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductCategoryNameFrequencies, formatProductCategoryName } from '../utils/categoryUtils';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/ui/use-toast';

export default function Products() {
  const {
    products,
    loading,
    error,
    isModalOpen,
    fetchProducts,
    toggleProductStatus,
    deleteProduct,
    setSelectedProduct,
    setIsModalOpen
  } = useProductStore();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'category' | 'created_at'>('category');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.active;

    if (newStatus === true) {
      if (product.category && !product.category.active) {
        toast({
          variant: 'destructive',
          title: 'Acción no permitida',
          description: `No se puede activar el producto "${product.name}" porque la categoría "${product.category.name}" está desactivada.`,
        });
        return;
      }
    }

    try {
      await toggleProductStatus(product.id, newStatus);
    } catch (error) {
      console.error("Error al cambiar el estado del producto:", error);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast({
        title: 'Producto eliminado',
        description: `"${productToDelete.name}" fue eliminado. Los pedidos anteriores conservan su historial.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: err.message || 'No se pudo eliminar el producto.',
      });
    } finally {
      setProductToDelete(null);
    }
  };

  const categoryFrequencies = useMemo(() => {
    return getProductCategoryNameFrequencies(products.map(p => p.category));
  }, [products]);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { key: string; name: string; displayName: string }>();

    for (const product of products) {
      if (!product.category?.name) continue;
      const key = product.category.name + '::' + (product.category.menu?.name || '');
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          key,
          name: product.category.name,
          displayName: formatProductCategoryName(product.category, categoryFrequencies),
        });
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [products, categoryFrequencies]);

  const hasUncategorized = products.some(p => !p.category?.name);

  useEffect(() => {
    if (
      selectedCategory !== 'all' &&
      selectedCategory !== 'uncategorized' &&
      !categories.some(c => c.key === selectedCategory)
    ) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(product => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'uncategorized') return !product.category?.name;
    const productKey = (product.category?.name || '') + '::' + (product.category?.menu?.name || '');
    return productKey === selectedCategory;
  }).sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'category':
        aValue = a.category?.name?.toLowerCase() || 'zzz';
        bValue = b.category?.name?.toLowerCase() || 'zzz';
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar los productos</p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchProducts()}
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
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Productos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los productos del sistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar productos por nombre, categoría o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.key} value={category.key}>
                {category.displayName}
              </option>
            ))}
            {hasUncategorized && (
              <option value="uncategorized">Sin categoría</option>
            )}
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'category' | 'created_at');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
          >
            <option value="category-asc">Categoría A-Z</option>
            <option value="category-desc">Categoría Z-A</option>
            <option value="created_at-desc">Más recientes</option>
            <option value="created_at-asc">Más antiguos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Base
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
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatProductCategoryName(product.category, categoryFrequencies)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(product.base_price)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          product.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={product.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {product.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(product.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
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

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No hay productos que coincidan con la búsqueda' : 'No hay productos registrados'}
              </p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <ProductModal onClose={() => setIsModalOpen(false)} />}

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        message={`Esta accion es permanente. "${productToDelete?.name}" sera eliminado y ya no estara disponible para nuevos pedidos. Los pedidos anteriores que contengan este producto conservaran su historial.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}