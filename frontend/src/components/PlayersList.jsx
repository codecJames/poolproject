import { useState, useEffect } from 'react';
import { getPlayers } from '../services/api';
import '../styles/PlayersList.css';

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('winRate');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getPlayers();
      setPlayers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load players. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWinRate = (player) => {
    if (player.matches_played === 0) return 0;
    return ((player.matches_won / player.matches_played) * 100).toFixed(2);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return calculateWinRate(b) - calculateWinRate(a);
      case 'totalWins':
        return b.matches_won - a.matches_won;
      case 'matchesPlayed':
        return b.matches_played - a.matches_played;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="container"><p className="loading">Loading players...</p></div>;
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
        <button onClick={fetchPlayers} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎱 Pool Players Statistics</h1>
        <p className="subtitle">UCT Supa Pool Club Rankings</p>
      </div>

      <div className="controls">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="winRate">Win Rate (High to Low)</option>
          <option value="totalWins">Total Wins (High to Low)</option>
          <option value="matchesPlayed">Matches Played (High to Low)</option>
          <option value="rating">Rating (High to Low)</option>
          <option value="name">Name (A to Z)</option>
        </select>
        <button onClick={fetchPlayers} className="refresh-btn">🔄 Refresh</button>
      </div>

      {sortedPlayers.length === 0 ? (
        <p className="no-players">No players found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="players-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player Name</th>
                <th>University</th>
                <th>Win Rate</th>
                <th>Total Wins</th>
                <th>Matches Played</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const winRate = calculateWinRate(player);
                return (
                  <tr key={player.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="rank">#{index + 1}</td>
                    <td className="player-name">{player.name}</td>
                    <td className="university">{player.university || 'N/A'}</td>
                    <td className="win-rate">
                      <span className="stat-value">{winRate}%</span>
                      <span className="stat-badge">{player.matches_played > 0 ? '✓' : '-'}</span>
                    </td>
                    <td className="total-wins">
                      <span className="wins-badge">{player.matches_won}</span>
                    </td>
                    <td className="matches-played">{player.matches_played}</td>
                    <td className="rating">
                      <span className="rating-value">{player.rating.toFixed(0)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Total Players</h3>
          <p className="stat-number">{players.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Matches</h3>
          <p className="stat-number">
            {Math.floor(players.reduce((sum, p) => sum + p.matches_played, 0) / 2)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Top Player</h3>
          <p className="stat-text">
            {sortedPlayers.length > 0
              ? `${sortedPlayers[0].name} (${calculateWinRate(sortedPlayers[0])}%)`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
