import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Menus from './pages/Menus';
import Categories from './pages/Categories';
import Usuarios from './pages/Usuarios';
import VariantOptions from './pages/adicionales/VariantOptions';
import IngredientOptions from './pages/adicionales/IngredientOptions';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';
import VariantModal from './components/adicionales/VariantModal';
import IngredientModal from './components/adicionales/IngredientModal';
import { useVariantOptionStore } from './stores/variantOptionStore';
import { useIngredientOptionStore } from './stores/ingredientOptionStore';

function App() {
  const { isModalOpen: isVariantModalOpen, setIsModalOpen: setVariantModalOpen } = useVariantOptionStore();
  const { isModalOpen: isIngredientModalOpen, setIsModalOpen: setIngredientModalOpen } = useIngredientOptionStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard\" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="pedidos" element={<Orders />} />
          <Route path="productos" element={<Products />} />
          <Route path="menus" element={<Menus />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="adicionales">
            <Route path="variantes" element={<VariantOptions />} />
            <Route path="ingredientes" element={<IngredientOptions />} />
          </Route>
          <Route
            path="usuarios"
            element={
              <ProtectedRoute requireAdmin>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard\" replace />} />
        </Route>
      </Routes>
      <Toaster />
      
      {isVariantModalOpen && (
        <VariantModal onClose={() => setVariantModalOpen(false)} />
      )}
      
      {isIngredientModalOpen && (
        <IngredientModal onClose={() => setIngredientModalOpen(false)} />
      )}
    </BrowserRouter>
  );
}

export default App;