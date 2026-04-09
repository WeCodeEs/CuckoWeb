import React, { useState } from 'react';
import { TriangleAlert as AlertTriangle, X, Loader as Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Menu, MenuStats } from '../stores/menuStore';

interface DeleteMenuModalProps {
  menu: Menu;
  stats: MenuStats | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteMenuModal({
  menu,
  stats,
  isLoading,
  onClose,
  onConfirm,
}: DeleteMenuModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [showProducts, setShowProducts] = useState(false);

  const nameMatches = confirmName === menu.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
      />

      <div className="relative bg-white dark:bg-darkbg-lighter rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Eliminar menu
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {stats && (stats.categoryCount > 0 || stats.productCount > 0)
                ? `Esta a punto de eliminar el menu "${menu.name}" junto con ${stats.categoryCount} ${stats.categoryCount === 1 ? 'categoria' : 'categorias'} y ${stats.productCount} ${stats.productCount === 1 ? 'producto' : 'productos'}. Esta accion es irreversible.`
                : `Esta a punto de eliminar el menu "${menu.name}". Esta accion es irreversible.`
              }
            </p>
          </div>
        </div>

        {stats && stats.products.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowProducts(!showProducts)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Ver productos que seran eliminados ({stats.productCount})
            </button>
            {showProducts && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-darkbg divide-y divide-gray-100 dark:divide-darkbg">
                {stats.products.map(product => (
                  <div key={product.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Escribe <span className="font-semibold text-gray-900 dark:text-white">{menu.name}</span> para confirmar
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            disabled={isLoading}
            placeholder={menu.name}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white dark:bg-darkbg text-gray-900 dark:text-white text-sm disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg hover:bg-gray-200 dark:hover:bg-darkbg/80 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!nameMatches || isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Eliminando...' : 'Eliminar menu'}
          </button>
        </div>
      </div>
    </div>
  );
}
