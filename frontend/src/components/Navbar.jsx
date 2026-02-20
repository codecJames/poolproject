import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar__brand">
                🎱 Supa Pool
            </NavLink>

            <div className="navbar__links">
                <NavLink to="/players">Players</NavLink>
                <NavLink to="/tournaments">Tournaments</NavLink>
                <NavLink to="/matches">Matches</NavLink>

                {user ? (
                    <button className="navbar__user-btn" onClick={handleLogout}>
                        <span className="navbar__avatar">{user.username[0].toUpperCase()}</span>
                        Logout
                    </button>
                ) : (
                    <NavLink to="/login" className="navbar__login">Sign in</NavLink>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
