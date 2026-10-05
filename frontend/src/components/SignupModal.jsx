import { useState } from 'react';
import { errorMessage, signup } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/AuthModal.css';

const EMPTY_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

export default function SignupModal() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authModal, signup: startSession, closeAuthModal, openLogin } = useAuth();
  const { addNotification } = useNotification();

  if (authModal !== 'signup') return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setFormData(EMPTY_FORM);
    setError('');
  };

  const handleClose = () => {
    reset();
    closeAuthModal();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup(formData.fullName.trim(), formData.email.trim(), formData.password);
      startSession(response);
      addNotification({
        type: 'success',
        title: 'Account created!',
        message: `Welcome to UCT Supa Pool, ${response.user.full_name}!`,
        duration: 3000,
      });
      handleClose();
    } catch (err) {
      setError(errorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="signup-title">
        <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

        <div className="modal-header">
          <h2 id="signup-title">Create your account</h2>
          <p>Join UCT Supa Pool today!</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              name="fullName"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?
            <button className="link-btn" onClick={() => { reset(); openLogin(); }}>
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
