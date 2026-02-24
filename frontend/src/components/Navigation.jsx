import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

export default function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="nav-logo">
          🎱 UCT Supa Pool
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/players"
              className={`nav-link ${isActive('/players') ? 'active' : ''}`}
            >
              👥 Players
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/clubs"
              className={`nav-link ${isActive('/clubs') ? 'active' : ''}`}
            >
              🏛️ Clubs
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/tournaments"
              className={`nav-link ${isActive('/tournaments') ? 'active' : ''}`}
            >
              🏆 Tournaments
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/leagues"
              className={`nav-link ${isActive('/leagues') ? 'active' : ''}`}
            >
              📊 Leagues
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/money-match"
              className={`nav-link ${isActive('/money-match') ? 'active' : ''}`}
            >
              💰 Money Match
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/shop"
              className={`nav-link ${isActive('/shop') ? 'active' : ''}`}
            >
              🛍️ Shop
            </Link>
          </li>
        </ul>

        {/* Profile Section */}
        {isAuthenticated ? (
          <div className="profile-section">
            <button 
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-avatar">
                {user?.full_name?.charAt(0).toUpperCase() || '👤'}
              </span>
              <span className="profile-name">{user?.full_name?.split(' ')[0]}</span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user?.full_name}</p>
                  <p className="dropdown-email">{user?.email}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link 
                  to="/dashboard" 
                  className="dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  📊 Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  👤 Profile
                </Link>
                <Link 
                  to="/settings" 
                  className="dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  ⚙️ Settings
                </Link>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
