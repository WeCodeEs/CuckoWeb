import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CircleAlert as AlertCircle } from 'lucide-react';
import { useMenuStore, Menu, MenuStats } from '../stores/menuStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useProductStore } from '../stores/productStore';
import MenuModal from '../components/MenuModal';
import ConfirmationModal from '../components/ConfirmationModal'; // Usamos solo este
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import { useToast } from '../components/ui/use-toast';

export default function Menus() {
  const {
    menus, loading, error, isModalOpen, fetchMenus,
    toggleMenuStatus, deleteMenu, getMenuStats,
    setSelectedMenu, setIsModalOpen
  } = useMenuStore();

  const { fetchCategories } = useCategoryStore();
  const { fetchProducts } = useProductStore();
  const { toast } = useToast();

  // Estados unificados
  const [menuToDeactivate, setMenuToDeactivate] = useState<Menu | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [menuStats, setMenuStats] = useState<MenuStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleEdit = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  // --- LÓGICA DE DESACTIVACIÓN ---
  const handleToggleStatus = (menu: Menu) => {
    const newStatus = !menu.active;
    if (newStatus === false) {
      setMenuToDeactivate(menu);
    } else {
      performToggle(menu, true);
    }
  };

  const performToggle = async (menu: Menu, newStatus: boolean) => {
    try {
      await toggleMenuStatus(menu.id, newStatus);
      await Promise.all([fetchCategories(), fetchProducts()]);
      toast({
        title: newStatus ? 'Menú activado' : 'Menú desactivado',
        description: `"${menu.name}" actualizado correctamente.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setMenuToDeactivate(null);
    }
  };

  // --- LÓGICA DE ELIMINACIÓN ---
  const handleRequestDelete = async (menu: Menu) => {
    try {
      const stats = await getMenuStats(menu.id);
      setMenuStats(stats);
      setMenuToDelete(menu);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo obtener info del menú.', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!menuToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMenu(menuToDelete.id);
      await Promise.all([fetchCategories(), fetchProducts()]);
      toast({ title: 'Menú eliminado', description: `"${menuToDelete.name}" fue borrado.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsDeleting(false);
      setMenuToDelete(null);
      setMenuStats(null);
    }
  };

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menús</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary p-2 text-white rounded-xl">
          <Plus className="w-4 h-4 inline mr-2" /> Nuevo Menú
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={4} hasActions />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl overflow-hidden shadow-soft">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkbg">
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id} className="border-t border-gray-100 dark:border-darkbg">
                  <td className="px-6 py-4">{menu.name}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleToggleStatus(menu)}
                      className={`px-3 py-1 rounded-full text-xs ${menu.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {menu.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(menu)} className="text-primary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleRequestDelete(menu)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALES */}
      {isModalOpen && <MenuModal onClose={() => setIsModalOpen(false)} />}

      {/* Modal para DESACTIVAR */}
      <ConfirmationModal
        isOpen={!!menuToDeactivate}
        onClose={() => setMenuToDeactivate(null)}
        onConfirm={() => menuToDeactivate && performToggle(menuToDeactivate, false)}
        title="Desactivar Menú"
        message={`¿Seguro que quieres desactivar "${menuToDeactivate?.name}"?`}
        confirmText="Desactivar"
      />

      {/* Modal para ELIMINAR (Usando el ConfirmationModal genérico) */}
      <ConfirmationModal
        isOpen={!!menuToDelete}
        onClose={() => setMenuToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="ELIMINAR MENÚ"
        message={`¿Estás seguro? Se borrarán ${menuStats?.categoryCount || 0} categorías y ${menuStats?.productCount || 0} productos.`}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
        variant="danger"
      />
    </div>
  );
}