import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/Auth/ResetPasswordPage';

// Main Pages
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ProductsPage } from '../pages/Products/ProductsPage';
import { CategoriesPage } from '../pages/Categories/CategoriesPage';
import { WarehousesPage } from '../pages/Warehouses/WarehousesPage';
import { InventoryPage } from '../pages/Inventory/InventoryPage';
import { TransactionsPage } from '../pages/Transactions/TransactionsPage';
import { PurchaseOrdersPage } from '../pages/PurchaseOrders/PurchaseOrdersPage';
import { SuppliersPage } from '../pages/Suppliers/SuppliersPage';
import { UsersPage } from '../pages/Users/UsersPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';

// Error Pages
import { UnauthorizedPage } from '../pages/Errors/UnauthorizedPage';
import { NotFoundPage } from '../pages/Errors/NotFoundPage';
import { ServerErrorPage } from '../pages/Errors/ServerErrorPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-canvas, #FDFBF7)',
          color: 'var(--text-main, #2C2424)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid #E2D7BE', borderTopColor: 'var(--palette-rosewood, #946D6D)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary, #6B5E5E)', fontSize: '0.875rem', fontWeight: 600 }}>Memverifikasi sesi pengguna...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Role Guard
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.roleCode !== 'ROLE_ADMIN') {
    return <Navigate to="/403" replace />;
  }
  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Error Routes */}
      <Route path="/401" element={<UnauthorizedPage />} />
      <Route path="/403" element={<UnauthorizedPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
