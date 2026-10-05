import { useState } from 'react';
import { errorMessage, login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/AuthModal.css';

export default function LoginModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authModal, login: startSession, closeAuthModal, openSignup } = useAuth();
  const { addNotification } = useNotification();

  if (authModal !== 'login') return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    reset();
    closeAuthModal();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email.trim(), password);
      startSession(response);
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Logged in as ${response.user.full_name}`,
        duration: 3000,
      });
      handleClose();
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

        <div className="modal-header">
          <h2 id="login-title">Log in to UCT Supa Pool</h2>
          <p>Welcome back!</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?
            <button className="link-btn" onClick={() => { reset(); openSignup(); }}>
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
