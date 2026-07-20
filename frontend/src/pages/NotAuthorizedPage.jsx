import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotAuthorizedPage = () => {
  const navigate = useNavigate();
  const { role, ROLE_DASHBOARD } = useAuth();

  const handleGoHome = () => {
    if (role && ROLE_DASHBOARD[role]) {
      navigate(ROLE_DASHBOARD[role], { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '0.5rem' }}>403</h1>
      <h2 style={{ fontSize: '1.4rem', color: '#111827', marginBottom: '0.75rem' }}>Not Authorized</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        You do not have permission to view this page.
      </p>
      <button
        onClick={handleGoHome}
        style={{
          padding: '0.65rem 1.5rem',
          background: '#1e3a5f',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.95rem',
          cursor: 'pointer'
        }}
      >
        Go to My Dashboard
      </button>
    </div>
  );
};

export default NotAuthorizedPage;
