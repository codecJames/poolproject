import { useState } from 'react';
import '../styles/LeaguesPage.css';

const mockTeams = [
  { id: 1, name: 'The Breakers', captain: 'John Smith', players: 5, wins: 8, draws: 2, losses: 1, points: 26 },
  { id: 2, name: 'Pool Sharks', captain: 'Mike Johnson', players: 5, wins: 7, draws: 1, losses: 2, points: 22 },
  { id: 3, name: 'Cue Masters', captain: 'Sarah Williams', players: 5, wins: 6, draws: 3, losses: 1, points: 21 },
  { id: 4, name: 'Eight Ball Elite', captain: 'Tom Brown', players: 4, wins: 5, draws: 2, losses: 3, points: 17 },
  { id: 5, name: 'Chalk & Cue', captain: 'Lisa Davis', players: 5, wins: 3, draws: 1, losses: 6, points: 10 },
];

export default function LeaguesPage() {
  const [teams, setTeams] = useState(mockTeams);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    teamCaptain: '',
    playersList: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterTeam = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.teamName.trim() || !formData.teamCaptain.trim() || !formData.playersList.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const playerList = formData.playersList.split(',').map(p => p.trim()).filter(p => p);
    
    if (playerList.length < 2) {
      setError('Please add at least 2 players');
      return;
    }

    const newTeam = {
      id: teams.length + 1,
      name: formData.teamName,
      captain: formData.teamCaptain,
      players: playerList.length,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    };

    setTeams([...teams, newTeam]);
    setFormData({ teamName: '', teamCaptain: '', playersList: '' });
    setShowRegisterForm(false);
  };

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

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
              {error && <div className="error-message">{error}</div>}
              
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
                    <td className="captain">{team.captain}</td>
                    <td className="players">{team.players}</td>
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
