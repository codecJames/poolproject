import axios from 'axios';

// Same-origin '/api' in production (Vercel) and in development (Vite proxy)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

// Pull a readable message out of an API error
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, '');
  if (error?.code === 'ERR_NETWORK') return 'Could not reach the server. Check your connection and try again.';
  return fallback;
};

const data = (request) => request.then((response) => response.data);

// Auth
export const signup = (fullName, email, password) =>
  data(apiClient.post('/users/signup', { full_name: fullName, email, password }));
export const login = (email, password) => data(apiClient.post('/users/login', { email, password }));
export const getMe = () => data(apiClient.get('/users/me'));

// Players
export const getPlayers = () => data(apiClient.get('/players'));
export const getPlayer = (playerId) => data(apiClient.get(`/players/${playerId}`));

// Clubs
export const getClubs = () => data(apiClient.get('/clubs'));
export const createClub = (name, location = 'UCT', description = '') =>
  data(apiClient.post('/clubs', { name, location, description }));

// Leagues and teams
export const getLeagues = () => data(apiClient.get('/leagues'));
export const getLeagueStandings = (leagueId) => data(apiClient.get(`/leagues/${leagueId}/standings`));
export const getLeagueResults = (leagueId) => data(apiClient.get(`/leagues/${leagueId}/results`));
export const recordLeagueResult = (leagueId, result) => data(apiClient.post(`/leagues/${leagueId}/results`, result));
export const deleteLeagueResult = (leagueId, resultId) =>
  data(apiClient.delete(`/leagues/${leagueId}/results/${resultId}`));
export const createTeam = (name, leagueId) => data(apiClient.post('/teams', { name, league_id: leagueId }));
export const joinTeam = (teamId) => data(apiClient.post(`/teams/${teamId}/join`));
export const leaveTeam = (teamId) => data(apiClient.post(`/teams/${teamId}/leave`));

// Tournaments
export const getTournaments = () => data(apiClient.get('/tournaments'));
export const getMyTournaments = () => data(apiClient.get('/tournaments/mine'));
export const getTournament = (tournamentId) => data(apiClient.get(`/tournaments/${tournamentId}`));
export const createTournament = (tournament) => data(apiClient.post('/tournaments', tournament));
export const deleteTournament = (tournamentId) => data(apiClient.delete(`/tournaments/${tournamentId}`));
export const registerForTournament = (tournamentId) => data(apiClient.post(`/tournaments/${tournamentId}/register`));
export const unregisterFromTournament = (tournamentId) =>
  data(apiClient.post(`/tournaments/${tournamentId}/unregister`));
export const startTournament = (tournamentId) => data(apiClient.post(`/tournaments/${tournamentId}/start`));
export const reportTournamentMatch = (tournamentId, matchId, player1Score, player2Score) =>
  data(
    apiClient.put(`/tournaments/${tournamentId}/matches/${matchId}`, {
      player1_score: player1Score,
      player2_score: player2Score,
    })
  );

// Challenges and match history
export const getMyChallenges = () => data(apiClient.get('/challenges/mine'));
export const createChallenge = (challengedPlayerId) =>
  data(apiClient.post('/challenges', { challenged_id: challengedPlayerId }));
export const acceptChallenge = (challengeId) => data(apiClient.post(`/challenges/${challengeId}/accept`));
export const declineChallenge = (challengeId) => data(apiClient.post(`/challenges/${challengeId}/decline`));
export const cancelChallenge = (challengeId) => data(apiClient.post(`/challenges/${challengeId}/cancel`));
export const reportChallengeScore = (challengeId, challengerScore, challengedScore) =>
  data(
    apiClient.post(`/challenges/${challengeId}/score`, {
      challenger_score: challengerScore,
      challenged_score: challengedScore,
    })
  );
export const getMatches = (playerId = null) =>
  data(apiClient.get('/matches', { params: playerId ? { player_id: playerId } : {} }));
