import { toast } from 'react-toastify';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import logo from '../../image/LogoRestoBar.png';
import {
  IconGrid, IconBuilding, IconTable, IconPlate, IconBox, IconChefHat,
  IconBarChart, IconTrendingUp, IconPrinter, IconUser, IconMenu,
  IconLogout, IconWallet, IconReceipt, IconQrCode,
} from '../../components/Icons';
import './AdminLayout.css';

const IconChevron = ({ collapsed }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const COLLAPSED_SECTIONS_KEY = 'adminSidebarCollapsedSections';

const leerSeccionesColapsadas = () => {
  try {
    const raw = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState(leerSeccionesColapsadas);
  const location = useLocation();

  const toggleSection = (title) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const menuSections = [
    {
      title: 'General',
      items: [
        { path: '/admin', label: 'Dashboard', Icon: IconGrid },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { path: '/admin/productos', label: 'Productos', Icon: IconPlate },
        { path: '/admin/insumos', label: 'Insumos', Icon: IconBox },
        { path: '/admin/recetas', label: 'Recetas', Icon: IconChefHat },
      ],
    },
    {
      title: 'Operación',
      items: [
        { path: '/admin/sedes', label: 'Sedes', Icon: IconBuilding },
        { path: '/admin/mesas', label: 'Mesas', Icon: IconTable },
        { path: '/admin/inventario', label: 'Inventario', Icon: IconBarChart },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { path: '/admin/comprobantes', label: 'Ingresos y Egresos', Icon: IconReceipt },
        { path: '/admin/informes', label: 'Informes', Icon: IconTrendingUp },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { path: '/admin/impresoras', label: 'Impresoras', Icon: IconPrinter },
        { path: '/admin/menu-digital', label: 'Menú Digital', Icon: IconQrCode },
        { path: '/admin/usuarios', label: 'Usuarios', Icon: IconUser },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <div className="sidebar-brand">
              <img src={logo} alt="DynamicRestoBar" className="sidebar-brand__logo" />
              <span className="sidebar-brand__name">Admin</span>
            </div>
          ) : (
            <img src={logo} alt="DynamicRestoBar" className="sidebar-brand__logo" />
          )}
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Alternar menú"
          >
            <IconMenu />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => {
            const isCollapsed = sidebarOpen && collapsedSections.has(section.title);
            return (
              <div className="nav-section" key={section.title}>
                {sidebarOpen && (
                  <button
                    type="button"
                    className="nav-section-title"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={!isCollapsed}
                  >
                    <span>{section.title}</span>
                    <IconChevron collapsed={isCollapsed} />
                  </button>
                )}
                {!isCollapsed && section.items.map(({ path, label, Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`nav-link ${isActive(path) ? 'active' : ''}`}
                    title={!sidebarOpen ? label : undefined}
                  >
                    <span className="nav-icon"><Icon /></span>
                    {sidebarOpen && <span className="nav-label">{label}</span>}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/caja" className="rb-btn rb-btn--primary sidebar-caja-btn">
            <IconWallet /> {sidebarOpen && 'Ir a Caja'}
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
            <span className="user-info">
              <IconUser /> {usuario?.nombre}
            </span>
            <button className="rb-btn rb-btn--ghost" onClick={handleLogout}>
              <IconLogout /> Salir
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