import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient, { getMe, setAuthToken } from '../services/api';

const AuthContext = createContext();

const readStored = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const hasToken = () => {
  try {
    return !!localStorage.getItem('token');
  } catch {
    return false;
  }
};

// Set before any component mounts: child effects run before this provider's,
// so pages' first requests must already carry the token
try {
  setAuthToken(localStorage.getItem('token'));
} catch {
  // Storage unavailable; the user simply starts logged out
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => (hasToken() ? readStored('user') : null));
  const [player, setPlayer] = useState(() => (hasToken() ? readStored('player') : null));
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null

  const logout = useCallback(() => {
    setUser(null);
    setPlayer(null);
    localStorage.removeItem('user');
    localStorage.removeItem('player');
    localStorage.removeItem('token');
    setAuthToken(null);
  }, []);

  // Restore the session, then confirm it is still valid
  useEffect(() => {
    if (!hasToken()) return;
    getMe()
      .then(({ user: freshUser, player: freshPlayer }) => {
        setUser(freshUser);
        setPlayer(freshPlayer);
        localStorage.setItem('user', JSON.stringify(freshUser));
        localStorage.setItem('player', JSON.stringify(freshPlayer));
      })
      .catch((error) => {
        if (error.response?.status === 401) logout();
      });
  }, [logout]);

  // Any request rejected for an expired session logs the user out
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && hasToken()) logout();
        return Promise.reject(error);
      }
    );
    return () => apiClient.interceptors.response.eject(interceptor);
  }, [logout]);

  const startSession = useCallback(({ token, user: newUser, player: newPlayer }) => {
    setUser(newUser);
    setPlayer(newPlayer);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('player', JSON.stringify(newPlayer));
    localStorage.setItem('token', token);
    setAuthToken(token);
  }, []);

  const refreshPlayer = useCallback(async () => {
    const { player: freshPlayer } = await getMe();
    setPlayer(freshPlayer);
    localStorage.setItem('player', JSON.stringify(freshPlayer));
    return freshPlayer;
  }, []);

  const value = {
    user,
    player,
    userId: user?.id,
    playerId: player?.id,
    isAuthenticated: !!user,
    login: startSession,
    signup: startSession,
    logout,
    refreshPlayer,
    authModal,
    openLogin: () => setAuthModal('login'),
    openSignup: () => setAuthModal('signup'),
    closeAuthModal: () => setAuthModal(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
