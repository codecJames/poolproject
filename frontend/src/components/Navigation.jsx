import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

export default function Navigation() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
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
      </div>
    </nav>
  );
}
