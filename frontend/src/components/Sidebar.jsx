import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  CalendarDays, 
  Users, 
  Repeat, 
  FileText, 
  CreditCard, 
  Tag, 
  UserCheck, 
  LogOut, 
  Zap,
  UserSquare2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout, isAdmin, isCustomer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-badge">HACKATHON MVP</div>
        <div className="brand-title">
          <Zap size={22} color="#C5F36A" fill="#C5F36A" />
          <span>BRIGHTLOOP</span>
        </div>
        <div className="brand-tagline">Revenue in Motion.</div>
      </div>

      <nav className="sidebar-nav">
        {/* If customer, show customer-specific portal items */}
        {isCustomer ? (
          <>
            <div className="nav-section-title">Customer Portal</div>
            <NavLink to="/portal" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserSquare2 size={18} />
              <span>My Subscriptions</span>
            </NavLink>
            <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>My Invoices</span>
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              <span>My Payments</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section-title">Core Operations</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </NavLink>

            <div className="nav-section-title">Catalog & Clients</div>
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>Products</span>
            </NavLink>
            <NavLink to="/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CalendarDays size={18} />
              <span>Plans</span>
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customers</span>
            </NavLink>
            <NavLink to="/subscriptions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Repeat size={18} />
              <span>Subscriptions</span>
            </NavLink>

            <div className="nav-section-title">Billing & Revenue</div>
            <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>Invoices</span>
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              <span>Payments</span>
            </NavLink>
            <NavLink to="/discounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Tag size={18} />
              <span>Discounts</span>
            </NavLink>

            {isAdmin && (
              <>
                <div className="nav-section-title">Administration</div>
                <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <UserCheck size={18} />
                  <span>Staff & Users</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name" title={user?.full_name}>{user?.full_name || user?.email}</div>
            <div className="user-role-badge">{user?.role || 'user'}</div>
          </div>
        </div>
        <button className="btn-icon-logout" onClick={handleLogout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
