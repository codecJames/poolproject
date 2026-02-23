import { useState, useEffect } from 'react';
import { getMoneyMatches, getMoneyMatchLeaderboard } from '../services/api';
import '../styles/PageContent.css';

export default function MoneyMatchPage() {
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesData, leaderboardData] = await Promise.all([
        getMoneyMatches(),
        getMoneyMatchLeaderboard()
      ]);
      setMatches(matchesData);
      setLeaderboard(leaderboardData);
      setError(null);
    } catch (err) {
      setError('Failed to load money match data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading">Loading money match data...</p></div>;
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
        <h1>💰 Money Match</h1>
        <p className="page-subtitle">Head-to-head high-stakes games</p>
      </div>

      <div className="controls" style={{ marginBottom: '2rem' }}>
        <button 
          className={activeTab === 'leaderboard' ? 'filter-active' : ''}
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '0.6rem 1.2rem',
            marginRight: '0.5rem',
            border: activeTab === 'leaderboard' ? '2px solid #646cff' : '2px solid #404040',
            background: activeTab === 'leaderboard' ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
            color: activeTab === 'leaderboard' ? '#646cff' : '#aaa',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          🏆 Leaderboard
        </button>
        <button 
          className={activeTab === 'history' ? 'filter-active' : ''}
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.6rem 1.2rem',
            border: activeTab === 'history' ? '2px solid #646cff' : '2px solid #404040',
            background: activeTab === 'history' ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
            color: activeTab === 'history' ? '#646cff' : '#aaa',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          📜 History
        </button>
        <button onClick={fetchData} className="refresh-btn" style={{ marginLeft: 'auto' }}>🔄 Refresh</button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="content-card">
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">💵</p>
              <h2>No earnings yet</h2>
              <p>Money matches and earnings will appear here!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#1a1a1a'
              }}>
                <thead style={{
                  background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                  color: 'white'
                }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Player</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Matches Won</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Total Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.player_id} style={{
                      borderBottom: '1px solid #333',
                      background: index < 3 ? `rgba(100, 108, 255, ${0.1 - index * 0.03})` : 'transparent'
                    }}>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#646cff' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{entry.player_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{entry.matches_won}</td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: '#FFD700',
                        fontWeight: '700'
                      }}>
                        R{entry.total_winnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="content-card">
          {matches.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📜</p>
              <h2>No match history</h2>
              <p>Money matches will be recorded here!</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {matches.map((match, index) => (
                <div 
                  key={match.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #333',
                    background: index % 2 === 0 ? 'rgba(100, 108, 255, 0.05)' : 'transparent',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                        Match #{match.id}
                      </p>
                      <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>
                        {new Date(match.played_at).toLocaleDateString()} at {new Date(match.played_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#646cff' }}>
                        Score: {match.player_1_score} - {match.player_2_score}
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#FFD700', fontWeight: '600' }}>
                        Wagered: R{match.money_wagered.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
