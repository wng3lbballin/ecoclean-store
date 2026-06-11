import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Employees from './pages/Employees';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/cambiar-password"
              element={<ChangePassword />}
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute roles={['admin', 'gerente', 'programador']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <ProtectedRoute roles={['admin', 'revisor', 'gerente', 'programador']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categorias"
              element={
                <ProtectedRoute roles={['admin', 'gerente', 'programador']}>
                  <Categories />
                </ProtectedRoute>
              }
            />

            <Route
              path="/productos"
              element={
                <ProtectedRoute roles={['admin', 'vendedor', 'revisor', 'gerente', 'programador']}>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ventas"
              element={
                <ProtectedRoute roles={['admin', 'vendedor', 'revisor', 'gerente', 'programador']}>
                  <Sales />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clientes"
              element={
                <ProtectedRoute roles={['admin', 'vendedor', 'revisor', 'gerente', 'programador']}>
                  <Clients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/proveedores"
              element={
                <ProtectedRoute roles={['admin', 'vendedor', 'revisor', 'gerente', 'programador']}>
                  <Suppliers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/empleados"
              element={
                <ProtectedRoute roles={['admin', 'gerente', 'programador']}>
                  <Employees />
                </ProtectedRoute>
              }
            />

            <Route
              path="/compras"
              element={
                <ProtectedRoute roles={['admin', 'gerente', 'programador']}>
                  <Purchases />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
