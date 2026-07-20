import { useAuth } from '../context/AuthContext';
import styles from './TopBar.module.css';

/**
 * Minimal TopBar — visible on all placeholder dashboard pages.
 * Provides logout capability so auth flow can be tested before real nav is built.
 */
const TopBar = () => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.bar}>
      <span className={styles.greeting}>
        👤 {user?.name} <span className={styles.role}>({user?.role})</span>
      </span>
      <button id="logout-btn" className={styles.logoutBtn} onClick={logout}>
        Logout
      </button>
    </header>
  );
};

export default TopBar;
