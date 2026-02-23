import { useState } from 'react';
import { login } from '../services/api';
import '../styles/AuthModal.css';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }
      
      // Call login API
      const response = await login(email, password);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response));
      
      alert('Login successful!');
      setEmail('');
      setPassword('');
      onClose();
      
      // Optional: refresh the page or update app state
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>Login to UCT Supa Pool</h2>
          <p>Welcome back!</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? 
            <button 
              className="link-btn" 
              onClick={() => {
                setEmail('');
                setPassword('');
                setError('');
                onSwitchToSignup();
              }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
