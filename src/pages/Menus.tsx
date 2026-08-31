import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CircleAlert as AlertCircle, Star } from 'lucide-react';
import { useMenuStore, Menu, MenuStats } from '../stores/menuStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useProductStore } from '../stores/productStore';
import MenuModal from '../components/MenuModal';
import DeleteMenuModal from '../components/DeleteMenuModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import { useToast } from '../components/ui/use-toast';

export default function Menus() {
  const {
    menus,
    loading,
    error,
    isModalOpen,
    fetchMenus,
    toggleMenuStatus,
    deleteMenu,
    getMenuStats,
    setSelectedMenu,
    setIsModalOpen,
    setDefaultMenu,
  } = useMenuStore();

  const { fetchCategories } = useCategoryStore();
  const { fetchProducts } = useProductStore();
  const { toast } = useToast();

  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [menuStats, setMenuStats] = useState<MenuStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuToDeactivate, setMenuToDeactivate] = useState<Menu | null>(null);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleEdit = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleRequestDelete = async (menu: Menu) => {
    try {
      const stats = await getMenuStats(menu.id);
      setMenuStats(stats);
      setMenuToDelete(menu);
    } catch (err) {
      console.error('Error al obtener estadisticas del menu:', err);
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información del menú.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!menuToDelete || !menuStats) return;
    setIsDeleting(true);
    try {
      const name = menuToDelete.name;
      const catCount = menuStats.categoryCount;
      const prodCount = menuStats.productCount;

      await deleteMenu(menuToDelete.id);
      await Promise.all([fetchCategories(), fetchProducts()]);

      toast({
        title: 'Menú eliminado',
        description: catCount > 0 || prodCount > 0
          ? `"${name}" fue eliminado junto con ${catCount} ${catCount === 1 ? 'categoría' : 'categorías'} y ${prodCount} ${prodCount === 1 ? 'producto' : 'productos'}.`
          : `"${name}" fue eliminado.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: err.message || 'No se pudo eliminar el menú.',
      });
    } finally {
      setIsDeleting(false);
      setMenuToDelete(null);
      setMenuStats(null);
    }
  };

  const handleToggleStatus = (menu: Menu) => {
    const newStatus = !menu.active;

    if (newStatus === false) {
      setMenuToDeactivate(menu);
      return;
    }

    confirmToggleStatus(menu, newStatus);
  };

  const confirmToggleStatus = async (menu: Menu, newStatus: boolean) => {
    try {
      await toggleMenuStatus(menu.id, newStatus);
      await Promise.all([fetchMenus(), fetchCategories(), fetchProducts()]);

      toast({
        title: newStatus ? 'Menú activado' : 'Menú desactivado',
        description: `"${menu.name}" fue ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo cambiar el estado del menú.',
      });
    }
  };

  const handleSetDefault = async (menu: Menu) => {
    if (menu.is_default) return;
    try {
      if (!menu.active) {
        await toggleMenuStatus(menu.id, true);
      }
      await setDefaultMenu(menu.id);
      await Promise.all([fetchMenus(), fetchCategories(), fetchProducts()]);
      toast({
        title: 'Menú predeterminado actualizado',
        description: `"${menu.name}" es ahora el menú predeterminado al abrir la app.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo establecer el menú como predeterminado.',
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar los menús</p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchMenus()}
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
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Menús</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona los menús del sistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Menú
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
                    Descripción
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
                {menus.map((menu) => (
                  <tr 
                    key={menu.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{menu.name}</span>
                        {menu.is_default && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"
                            title="Menú predeterminado al abrir la app"
                          >
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Predeterminado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {menu.description || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(menu)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          menu.active
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={menu.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {menu.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(menu.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSetDefault(menu)}
                          disabled={menu.is_default}
                          className={`p-2 rounded-lg transition-colors ${
                            menu.is_default
                              ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 cursor-default'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                          title={menu.is_default ? 'Menú predeterminado actual' : 'Establecer como menú predeterminado al abrir la app'}
                        >
                          <Star className={`w-4 h-4 ${menu.is_default ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(menu)}
                          className="p-2 text-primary dark:text-secondary hover:bg-primary/5 dark:hover:bg-secondary/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(menu)}
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

          {menus.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay menús registrados</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <MenuModal onClose={() => setIsModalOpen(false)} />}

      {menuToDelete && (
        <DeleteMenuModal
          menu={menuToDelete}
          stats={menuStats}
          isLoading={isDeleting}
          onClose={() => { setMenuToDelete(null); setMenuStats(null); }}
          onConfirm={handleConfirmDelete}
        />
      )}

      <ConfirmationModal
        isOpen={!!menuToDeactivate}
        onClose={() => setMenuToDeactivate(null)}
        onConfirm={() => {
          if (menuToDeactivate) {
            confirmToggleStatus(menuToDeactivate, false);
            setMenuToDeactivate(null);
          }
        }}
        title="Desactivar menú"
        message={
          menuToDeactivate?.is_default
            ? `"${menuToDeactivate?.name}" está configurado como menú predeterminado. Al desactivarlo, la app seleccionará otro menú activo como respaldo y todas sus categorías y productos también se desactivarán. ¿Deseas continuar?`
            : `¿Estás seguro de que deseas desactivar el menú "${menuToDeactivate?.name}"? Todas sus categorías y productos también se desactivarán.`
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  );
}