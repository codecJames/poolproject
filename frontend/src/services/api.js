import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

// Auth endpoints
export const signup = async (fullName, email, password) => {
  try {
    const response = await apiClient.post('/users/signup', {
      full_name: fullName,
      email,
      password,
    });
    return response.data; // { token, user }
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    // send as JSON body for clarity
    const response = await apiClient.post('/users/login', { email, password });
    return response.data; // { token, user }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Player endpoints
export const getPlayers = async () => {
  try {
    const response = await apiClient.get('/players');
    return response.data;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const getPlayer = async (playerId) => {
  try {
    const response = await apiClient.get(`/players/${playerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    throw error;
  }
};

export const createPlayer = async (name, university = 'UCT') => {
  try {
    const response = await apiClient.post('/players', {
      name,
      university,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

// Club endpoints
export const getClubs = async () => {
  try {
    const response = await apiClient.get('/clubs');
    return response.data;
  } catch (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }
};

export const createClub = async (name, location = 'UCT', description = '') => {
  try {
    const response = await apiClient.post('/clubs', {
      name,
      location,
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating club:', error);
    throw error;
  }
};

// League endpoints
export const getLeagues = async () => {
  try {
    const response = await apiClient.get('/leagues');
    return response.data;
  } catch (error) {
    console.error('Error fetching leagues:', error);
    throw error;
  }
};

export const getLeagueStandings = async (leagueId) => {
  try {
    const response = await apiClient.get(`/leagues/${leagueId}/standings`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching league ${leagueId} standings:`, error);
    throw error;
  }
};

export const createLeague = async (name, season, clubId) => {
  try {
    const response = await apiClient.post('/leagues', {
      name,
      season,
      club_id: clubId,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating league:', error);
    throw error;
  }
};

// Team endpoints
export const getTeams = async () => {
  try {
    const response = await apiClient.get('/teams');
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const createTeam = async (name, captainId, leagueId) => {
  try {
    const response = await apiClient.post('/teams', {
      name,
      captain_id: captainId,
      league_id: leagueId,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const addTeamMember = async (teamId, userId) => {
  try {
    const response = await apiClient.post(`/teams/${teamId}/members`, {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
};

export const recordTeamResult = async (teamId, wins = 0, draws = 0, losses = 0) => {
  try {
    const response = await apiClient.post(`/teams/${teamId}/record-result`, null, {
      params: { wins, draws, losses }
    });
    return response.data;
  } catch (error) {
    console.error('Error recording team result:', error);
    throw error;
  }
};

// Tournament endpoints

// Money Match endpoints
export const createMoneyMatch = async (player1Id, player2Id, player1Score, player2Score, moneyWagered) => {
  try {
    const response = await apiClient.post('/money-matches', {
      player_1_id: player1Id,
      player_2_id: player2Id,
      player_1_score: player1Score,
      player_2_score: player2Score,
      money_wagered: moneyWagered,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating money match:', error);
    throw error;
  }
};

export const getMoneyMatches = async () => {
  try {
    const response = await apiClient.get('/money-matches');
    return response.data;
  } catch (error) {
    console.error('Error fetching money matches:', error);
    throw error;
  }
};

export const getMoneyMatchLeaderboard = async () => {
  try {
    const response = await apiClient.get('/money-matches/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching money match leaderboard:', error);
    throw error;
  }
};

// Challenge endpoints
export const createChallenge = async (challengerId, challengedId, challengeAmount) => {
  try {
    const response = await apiClient.post('/challenges', {
      challenger_id: challengerId,
      challenged_id: challengedId,
      challenge_amount: challengeAmount,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

export const getChallenges = async (status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await apiClient.get('/challenges', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    throw error;
  }
};

export const getChallengesForPlayer = async (playerId, status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/challenges/for/${playerId}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching challenges for player ${playerId}:`, error);
    throw error;
  }
};

export const getChallenge = async (challengeId) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching challenge ${challengeId}:`, error);
    throw error;
  }
};

export const acceptChallenge = async (challengeId) => {
  try {
    const response = await apiClient.put(`/challenges/${challengeId}/accept`);
    return response.data;
  } catch (error) {
    console.error(`Error accepting challenge ${challengeId}:`, error);
    throw error;
  }
};

export const declineChallenge = async (challengeId) => {
  try {
    const response = await apiClient.put(`/challenges/${challengeId}/decline`);
    return response.data;
  } catch (error) {
    console.error(`Error declining challenge ${challengeId}:`, error);
    throw error;
  }
};

export const submitChallengeResult = async (challengeId, challengerScore, challengedScore, playerId) => {
  try {
    const response = await apiClient.post(`/challenges/${challengeId}/result`, {
      challenger_score: challengerScore,
      challenged_score: challengedScore,
      player_id: playerId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error submitting challenge result for ${challengeId}:`, error);
    throw error;
  }
};

export const getChallengeResult = async (challengeId) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}/result`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching challenge result for ${challengeId}:`, error);
    throw error;
  }
};

// Tournament endpoints
export const createTournament = async (tournamentData, userId) => {
  try {
    const response = await apiClient.post('/tournaments/', tournamentData, {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating tournament:', error);
    throw error;
  }
};

export const getTournaments = async (publicOnly = true, status = null) => {
  try {
    const params = { public_only: publicOnly };
    if (status) params.status = status;
    const response = await apiClient.get('/tournaments/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    throw error;
  }
};

export const getMyTournaments = async (userId) => {
  try {
    const response = await apiClient.get('/tournaments/my', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my tournaments:', error);
    throw error;
  }
};

export const getTournament = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tournament ${tournamentId}:`, error);
    throw error;
  }
};

export const registerForTournament = async (tournamentId, userId) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/register`,
      {},
      { params: { user_id: userId } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error registering for tournament ${tournamentId}:`, error);
    throw error;
  }
};

export const unregisterFromTournament = async (tournamentId, userId) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/unregister`,
      {},
      { params: { user_id: userId } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error unregistering from tournament ${tournamentId}:`, error);
    throw error;
  }
};

export const startTournament = async (tournamentId, userId) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/start`,
      {},
      { params: { user_id: userId } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error starting tournament ${tournamentId}:`, error);
    throw error;
  }
};

export const updateMatchResult = async (tournamentId, matchId, matchData, userId) => {
  try {
    const response = await apiClient.put(
      `/tournaments/${tournamentId}/matches/${matchId}`,
      matchData,
      { params: { user_id: userId } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating match result:`, error);
    throw error;
  }
};

export const getTournamentBrackets = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}/brackets`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tournament brackets:`, error);
    throw error;
  }
};

