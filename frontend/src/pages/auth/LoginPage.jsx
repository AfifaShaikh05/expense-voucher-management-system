import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const { login, isAuthenticated, role, ROLE_DASHBOARD } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, skip the login form entirely
  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DASHBOARD[role]} replace />;
  }

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      setIsLoading(true);
      const user = await login(email, password);
      // Redirect based on role returned from the server
      window.location.href = ROLE_DASHBOARD[user.role] || '/login';
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? 'Network error — please check your connection' : 'An unexpected error occurred');
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Voucher Management</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {serverError && (
            <div className={styles.serverError} role="alert">
              {serverError}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="you@example.com"
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
