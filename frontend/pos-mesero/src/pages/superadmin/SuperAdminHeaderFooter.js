
import styles from './SuperAdminHeaderFooter.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';

export function SuperAdminHeader({ userName }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <header className={styles.headerBar}>
      <div className={styles.headerTitle}>DynamicRestoBar - Super Admin</div>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{userName}</span>
        <span role="img" aria-label="user">👤</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
}

export function SuperAdminFooter() {
  return (
    <footer className={styles.footer}>
      <span>DynamicSoft S.A.S</span> &nbsp;|&nbsp; Soluciones Inteligentes de Gestión &nbsp;|&nbsp; 2026
    </footer>
  );
}
