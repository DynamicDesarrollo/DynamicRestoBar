import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', emoji: '📊' },
    { path: '/admin/mesas', label: 'Mesas', emoji: '🪑' },
    { path: '/admin/productos', label: 'Productos', emoji: '🍽️' },
    { path: '/admin/insumos', label: 'Insumos', emoji: '📦' },
    { path: '/admin/recetas', label: 'Recetas', emoji: '🍳' },
    { path: '/admin/inventario', label: 'Inventario', emoji: '📊' },
    { path: '/admin/informes', label: 'Informes', emoji: '📈' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin</h2>
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.emoji}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/caja" className="btn btn-primary btn-sm w-100">
            {sidebarOpen ? '💰 Ir a Caja' : '💰'}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>DynamicRestoBar</h1>
          </div>
          <div className="header-right">
            <span className="user-info">{usuario?.nombre}</span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              🚪 Salir
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
