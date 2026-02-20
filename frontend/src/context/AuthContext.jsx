import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount, try to restore session from stored token
    useEffect(() => {
        if (token) {
            authService
                .me(token)
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const res = await authService.login(credentials);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);

        const meRes = await authService.me(newToken);
        setUser(meRes.data);
        return meRes.data;
    };

    const register = async (data) => {
        const res = await authService.register(data);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);

        const meRes = await authService.me(newToken);
        setUser(meRes.data);
        return meRes.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
