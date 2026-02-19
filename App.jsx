import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerRepartos from './pages/owner/Repartos';
import OwnerRepartoDetalle from './pages/owner/RepartoDetalle';
import OwnerProductos from './pages/owner/Productos';
import OwnerFactura from './pages/owner/Factura';
import OwnerUsuarios from './pages/owner/Usuarios';
import VendedorClientes from './pages/vendedor/Clientes';
import VendedorClienteDetalle from './pages/vendedor/ClienteDetalle';
import VendedorProductos from './pages/vendedor/Productos';
import VendedorPedido from './pages/vendedor/NuevoPedido';
import VendedorPedidos from './pages/vendedor/Pedidos';

function PrivateRoute({ children, requireOwner }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireOwner && user.role !== 'owner') return <Navigate to="/clientes" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'owner' ? '/dashboard' : '/clientes'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<PrivateRoute requireOwner><OwnerDashboard /></PrivateRoute>} />
        <Route path="repartos" element={<PrivateRoute requireOwner><OwnerRepartos /></PrivateRoute>} />
        <Route path="repartos/:id" element={<PrivateRoute requireOwner><OwnerRepartoDetalle /></PrivateRoute>} />
        <Route path="productos" element={<PrivateRoute requireOwner><OwnerProductos /></PrivateRoute>} />
        <Route path="factura" element={<PrivateRoute requireOwner><OwnerFactura /></PrivateRoute>} />
        <Route path="usuarios" element={<PrivateRoute requireOwner><OwnerUsuarios /></PrivateRoute>} />
        <Route path="clientes" element={<VendedorClientes />} />
        <Route path="clientes/:id" element={<VendedorClienteDetalle />} />
        <Route path="catalogo" element={<VendedorProductos />} />
        <Route path="pedido" element={<VendedorPedido />} />
        <Route path="pedidos" element={<VendedorPedidos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
