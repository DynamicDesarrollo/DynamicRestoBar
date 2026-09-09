import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styles from './SuperAdminLayout.module.css';
import { SuperAdminHeader, SuperAdminFooter } from './SuperAdminHeaderFooter';
import { IconChefHat, IconTrendingUp, IconBuilding, IconWallet } from '../../components/Icons';

const navLinks = [
  { to: '/superadmin/metricas', label: 'Métricas', Icon: IconTrendingUp },
  { to: '/superadmin/clientes', label: 'Clientes', Icon: IconBuilding },
  { to: '/superadmin/pagos', label: 'Pagos', Icon: IconWallet },
];

const SuperAdminLayout = () => {
  const location = useLocation();
  const userName = 'Super Admin';
  return (
    <div className={styles.superAdminLayout}>
      <nav className={styles.sidebar}>
        <h2><IconChefHat /> Super Admin</h2>
        <ul>
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={location.pathname.startsWith(link.to) ? styles.active : ''}
              >
                <link.Icon />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SuperAdminHeader userName={userName} />
        <main className={styles.main} style={{ flex: 1 }}>
          <Outlet />
        </main>
        <SuperAdminFooter />
      </div>
    </div>
  );
};

export default SuperAdminLayout;