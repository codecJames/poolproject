import { useState, useEffect } from 'react';
import { getTeams, createTeam, recordTeamResult, getLeagues } from '../services/api';
import '../styles/LeaguesPage.css';

const PRESET_TEAM_NAMES = [
  'Shooter Specials',
  'Kilindini',
  'Varietas',
  'Forest Hill',
  'Avenue Road',
  'Liesbeek',
  'Medical Res',
  'Groote Schur',
  'Kopano',
  'Obz Square',
];

const mergeTeamsWithPresetNames = (apiTeams) => {
  const existingNames = new Set(
    apiTeams
      .map((team) => team.name?.trim().toLowerCase())
      .filter(Boolean)
  );

  const missingPresetTeams = PRESET_TEAM_NAMES
    .filter((teamName) => !existingNames.has(teamName.toLowerCase()))
    .map((teamName, index) => ({
      id: `preset-${index}`,
      name: teamName,
      members: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    }));

  return [...apiTeams, ...missingPresetTeams];
};

export default function LeaguesPage() {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    teamCaptain: '',
    playersList: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, leaguesData] = await Promise.all([
        getTeams(),
        getLeagues()
      ]);
      setTeams(mergeTeamsWithPresetNames(teamsData));
      setLeagues(leaguesData);
      setError(null);
    } catch (err) {
      setError('Failed to load leagues. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.teamName.trim() || !formData.teamCaptain.trim() || !formData.playersList.trim()) {
      setFormError('Please fill in all fields');
      return;
    }

    const playerList = formData.playersList.split(',').map(p => p.trim()).filter(p => p);
    
    if (playerList.length < 2) {
      setFormError('Please add at least 2 players');
      return;
    }

    try {
      // For now, we'll use a temporary captain ID (1), in a real app this would be the logged-in user
      // And a default league ID (1), in a real app this would be selected
      const newTeam = await createTeam(formData.teamName, 1, 1);

      setTeams((previousTeams) => {
        const normalizedNewName = newTeam.name?.trim().toLowerCase();
        const withoutMatchingPreset = previousTeams.filter((team) => {
          const isPreset = typeof team.id === 'string' && team.id.startsWith('preset-');
          if (!isPreset) {
            return true;
          }

          return team.name?.trim().toLowerCase() !== normalizedNewName;
        });

        return [...withoutMatchingPreset, newTeam];
      });
      setFormData({ teamName: '', teamCaptain: '', playersList: '' });
      setShowRegisterForm(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to register team. Please try again.');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

  if (loading) {
    return <div className="page-container"><p className="loading">Loading leagues...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="error">{error}</p>
        <button onClick={fetchData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Leagues</h1>
        <p className="page-subtitle">Team competition and standings</p>
      </div>

      <div className="leagues-container">
        {/* Register Team Section */}
        <div className="register-team-section">
          <div className="section-header">
            <h2>⚡ Register New Team</h2>
            <button 
              className="toggle-btn"
              onClick={() => setShowRegisterForm(!showRegisterForm)}
            >
              {showRegisterForm ? '✕ Close' : '+ Register Team'}
            </button>
          </div>

          {showRegisterForm && (
            <form onSubmit={handleRegisterTeam} className="register-form">
              {formError && <div className="error-message">{formError}</div>}
              
              <div className="form-group">
                <label htmlFor="teamName">Team Name</label>
                <input
                  id="teamName"
                  name="teamName"
                  type="text"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="e.g., The Breakers"
                />
              </div>

              <div className="form-group">
                <label htmlFor="teamCaptain">Team Captain</label>
                <input
                  id="teamCaptain"
                  name="teamCaptain"
                  type="text"
                  value={formData.teamCaptain}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                />
              </div>

              <div className="form-group">
                <label htmlFor="playersList">Player List (comma-separated)</label>
                <textarea
                  id="playersList"
                  name="playersList"
                  value={formData.playersList}
                  onChange={handleInputChange}
                  placeholder="e.g., Player 1, Player 2, Player 3, Player 4, Player 5"
                  rows="4"
                />
              </div>

              <button type="submit" className="btn-submit">Register Team</button>
            </form>
          )}
        </div>

        {/* League Table Section */}
        <div className="league-table-section">
          <div className="section-header">
            <h2>🏆 League Standings</h2>
            <span className="team-count">{sortedTeams.length} teams</span>
          </div>

          {sortedTeams.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-icon">🎱</p>
                <h2>No teams registered</h2>
                <p>Register a team to get started!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="league-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Team Name</th>
                      <th>Captain</th>
                      <th>Players</th>
                      <th>Wins</th>
                      <th>Draws</th>
                      <th>Losses</th>
                      <th className="points-col">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team, index) => (
                      <tr key={team.id} className={`rank-${index + 1}`}>
                        <td className="position">
                          <span className="medal">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </td>
                        <td className="team-name">{team.name}</td>
                        <td className="captain">Captain</td>
                        <td className="players">{team.members?.length || 0}</td>
                        <td className="wins">{team.wins}</td>
                        <td className="draws">{team.draws}</td>
                        <td className="losses">{team.losses}</td>
                        <td className="points">
                          <span className="points-badge">{team.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="scoring-info">
            <h3>Scoring System</h3>
            <div className="scoring-grid">
              <div className="score-item">
                <span className="score-icon">✓</span>
                <div>
                  <span className="score-label">Win</span>
                  <span className="score-value">3 points</span>
                </div>
              </div>
              <div className="score-item">
                <span className="score-icon">-</span>
                <div>
                  <span className="score-label">Draw</span>
                  <span className="score-value">1 point</span>
                </div>
              </div>
              <div className="score-item">
                <span className="score-icon">✗</span>
                <div>
                  <span className="score-label">Loss</span>
                  <span className="score-value">0 points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
