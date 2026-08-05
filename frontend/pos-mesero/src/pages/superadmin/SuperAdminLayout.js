import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styles from './SuperAdminLayout.module.css';
import { SuperAdminHeader, SuperAdminFooter } from './SuperAdminHeaderFooter';

const navLinks = [
  { to: '/superadmin/metricas', label: 'Métricas' },
  { to: '/superadmin/clientes', label: 'Clientes' },
  { to: '/superadmin/pagos', label: 'Pagos' },
];

const SuperAdminLayout = () => {
  const location = useLocation();
  // Simulación de usuario, puedes reemplazar por el nombre real del usuario logueado
  const userName = 'Super Admin';
  return (
    <div className={styles.superAdminLayout}>
      <nav className={styles.sidebar}>
        <h2>Super Admin</h2>
        <ul>
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={location.pathname.startsWith(link.to) ? styles.active : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
        <SuperAdminHeader userName={userName} />
        <main className={styles.main} style={{flex: 1}}>
          <Outlet />
        </main>
        <SuperAdminFooter />
      </div>
    </div>
  );
};

export default SuperAdminLayout;
