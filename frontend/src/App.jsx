import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Plans from './pages/Plans';
import Customers from './pages/Customers';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Discounts from './pages/Discounts';
import UsersPage from './pages/Users';
import CustomerPortal from './pages/CustomerPortal';
import './styles/editorial.css';

const ProtectedLayout = () => {
  const { isAuthenticated, loading, isCustomer } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
        Loading Brightloop...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const StaffRoute = ({ children }) => {
  const { isStaff, loading } = useAuth();
  if (loading) return null;
  if (!isStaff) return <Navigate to="/portal" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const HomeRedirect = () => {
  const { isAuthenticated, isCustomer, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isCustomer) return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<StaffRoute><Dashboard /></StaffRoute>} />
            <Route path="/products" element={<StaffRoute><Products /></StaffRoute>} />
            <Route path="/plans" element={<StaffRoute><Plans /></StaffRoute>} />
            <Route path="/customers" element={<StaffRoute><Customers /></StaffRoute>} />
            <Route path="/subscriptions" element={<StaffRoute><Subscriptions /></StaffRoute>} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/discounts" element={<StaffRoute><Discounts /></StaffRoute>} />
            <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/portal" element={<CustomerPortal />} />
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
