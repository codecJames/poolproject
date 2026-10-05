import { useState, useEffect } from 'react';
import { getPlayers } from '../services/api';
import '../styles/PlayersList.css';

const SORT_FIELDS = {
  winRate: { label: 'Win Rate', get: (p) => Number(calculateWinRate(p)), defaultDir: 'desc' },
  totalWins: { label: 'Wins', get: (p) => p.matches_won, defaultDir: 'desc' },
  matchesPlayed: { label: 'Played', get: (p) => p.matches_played, defaultDir: 'desc' },
  rating: { label: 'Rating', get: (p) => p.rating, defaultDir: 'desc' },
  name: { label: 'Player', get: (p) => p.name.toLowerCase(), defaultDir: 'asc' },
};

function calculateWinRate(player) {
  if (player.matches_played === 0) return 0;
  return ((player.matches_won / player.matches_played) * 100).toFixed(2);
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('winRate');
  const [sortDir, setSortDir] = useState('desc');
  const [query, setQuery] = useState('');

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

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(SORT_FIELDS[field].defaultDir);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.university || '').toLowerCase().includes(q);
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const { get } = SORT_FIELDS[sortBy];
    const va = get(a);
    const vb = get(b);
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalMatches = Math.floor(players.reduce((sum, p) => sum + p.matches_played, 0) / 2);
  const playerCount = useCountUp(players.length);
  const matchCount = useCountUp(totalMatches);

  const topPlayer = [...players].sort((a, b) => calculateWinRate(b) - calculateWinRate(a))[0];

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <span className="spinner" />
          <p>Racking up the standings&hellip;</p>
        </div>
      </div>
    );
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
        <h1>Player Rankings</h1>
        <p className="subtitle">UCT Supa Pool Club Standings</p>
      </div>

      <div className="controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search by player or university&hellip;"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={fetchPlayers} className="refresh-btn">Refresh</button>
      </div>

      {sortedPlayers.length === 0 ? (
        <p className="no-players">
          {players.length === 0 ? 'No players found.' : 'No players match your search.'}
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="players-table">
            <thead>
              <tr>
                <th className="col-rank">Rank</th>
                <th>
                  <button className="sort-th" onClick={() => handleSort('name')}>
                    Player <SortArrow active={sortBy === 'name'} dir={sortDir} />
                  </button>
                </th>
                <th>University</th>
                <th>
                  <button className="sort-th" onClick={() => handleSort('winRate')}>
                    Win Rate <SortArrow active={sortBy === 'winRate'} dir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className="sort-th" onClick={() => handleSort('totalWins')}>
                    Wins <SortArrow active={sortBy === 'totalWins'} dir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className="sort-th" onClick={() => handleSort('matchesPlayed')}>
                    Played <SortArrow active={sortBy === 'matchesPlayed'} dir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className="sort-th" onClick={() => handleSort('rating')}>
                    Rating <SortArrow active={sortBy === 'rating'} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const winRate = calculateWinRate(player);
                return (
                  <tr key={player.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="rank" data-label="Rank">
                      {index < 3 ? (
                        <span className={`rank-ball rank-ball-${index + 1}`}>{index + 1}</span>
                      ) : (
                        <span className="rank-plain">#{index + 1}</span>
                      )}
                    </td>
                    <td className="player-name" data-label="Player">{player.name}</td>
                    <td className="university" data-label="University">{player.university || 'N/A'}</td>
                    <td className="win-rate" data-label="Win Rate">
                      <span className="stat-value">{winRate}%</span>
                      <span className="win-rate-track">
                        <span className="win-rate-fill" style={{ width: `${Math.min(winRate, 100)}%` }} />
                      </span>
                    </td>
                    <td className="total-wins" data-label="Wins">
                      <span className="wins-badge">{player.matches_won}</span>
                    </td>
                    <td className="matches-played" data-label="Played">{player.matches_played}</td>
                    <td className="rating" data-label="Rating">
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
          <p className="stat-number">{playerCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Matches</h3>
          <p className="stat-number">{matchCount}</p>
        </div>
        <div className="stat-card">
          <h3>Top Player</h3>
          <p className="stat-text">
            {topPlayer ? `${topPlayer.name} (${calculateWinRate(topPlayer)}%)` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SortArrow({ active, dir }) {
  if (!active) return <span className="sort-arrow idle">↕</span>;
  return <span className="sort-arrow">{dir === 'asc' ? '↑' : '↓'}</span>;
}
