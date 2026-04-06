import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrdersHistory from './pages/OrdersHistory';
import Products from './pages/Products';
import Menus from './pages/Menus';
import Categories from './pages/Categories';
import Usuarios from './pages/Usuarios';
import Alumnos from './pages/Students';
import Settings from './pages/Settings';
import OptionLibrary from './pages/adicionales/OptionLibrary';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

function App() {
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="pedidos" element={<Orders />} />
          <Route path="historico" element={<OrdersHistory />} />
          <Route path="productos" element={<Products />} />
          <Route path="menus" element={<Menus />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="adicionales">
            <Route path="opciones" element={<OptionLibrary />} />
          </Route>
          <Route
            path="usuarios"
            element={
              <ProtectedRoute requireAdmin>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="alumnos"
            element={
              <ProtectedRoute requireAdmin>
                <Alumnos />
              </ProtectedRoute>
            }
          />
          <Route
            path="configuracion"
            element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
