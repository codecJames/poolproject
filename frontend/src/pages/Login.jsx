import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Welcome back</h1>
                <p className="auth-form__sub">Sign in to Supa Pool</p>

                {error && <div className="auth-form__error">{error}</div>}

                <label>
                    Username
                    <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        autoFocus
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                </label>

                <button className="btn btn--primary auth-form__btn" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="auth-form__footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </section>
    );
}

export default Login;
