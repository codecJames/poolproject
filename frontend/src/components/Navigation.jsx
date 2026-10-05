import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

export default function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, logout, openLogin, openSignup } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    closeMenus();
  };

  const navItems = [
    { to: '/players', label: 'Players' },
    { to: '/clubs', label: 'Clubs' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/leagues', label: 'Leagues' },
    { to: '/challenges', label: 'Challenges' },
    { to: '/shop', label: 'Shop' },
  ];

  const closeMenus = () => {
    setMenuOpen(false);
    setShowProfileMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="nav-logo">
          <span className="logo-mark">
            <span className="logo-mark-number">8</span>
          </span>
          <span className="logo-text">UCT Supa Pool</span>
        </Link>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-right ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <Link
                  to={item.to}
                  className={`nav-link ${isActive(item.to) ? 'active' : ''}`}
                  onClick={closeMenus}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {isAuthenticated ? (
            <div className="profile-section" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                aria-expanded={showProfileMenu}
              >
                <span className="profile-avatar">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
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
                    onClick={closeMenus}
                  >
                    Dashboard
                  </Link>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <button className="btn-outline btn-small" onClick={() => { closeMenus(); openLogin(); }}>Log in</button>
              <button className="btn-small" onClick={() => { closeMenus(); openSignup(); }}>Sign up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
