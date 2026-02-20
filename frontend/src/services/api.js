import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Attach token to every request ────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────
export const authService = {
  login: (data) => api.post('/auth/login', data),

  register: (data) => api.post('/auth/register', data),

  me: (token) =>
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ── Players ──────────────────────────────────────────
export const playerService = {
  getAll: (skip = 0, limit = 100) =>
    api.get('/players/', { params: { skip, limit } }),

  getById: (id) => api.get(`/players/${id}`),

  create: (data) => api.post('/players/', data),
};

// ── Tournaments ──────────────────────────────────────
export const tournamentService = {
  getAll: (skip = 0, limit = 100) =>
    api.get('/tournaments/', { params: { skip, limit } }),

  getById: (id) => api.get(`/tournaments/${id}`),

  create: (data) => api.post('/tournaments/', data),
};

// ── Matches ──────────────────────────────────────────
export const matchService = {
  getAll: (skip = 0, limit = 100) =>
    api.get('/matches/', { params: { skip, limit } }),

  getById: (id) => api.get(`/matches/${id}`),

  create: (data) => api.post('/matches/', data),
};

export default api;
