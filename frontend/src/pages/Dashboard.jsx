import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getPlayer } from '../services/api';

export default function Dashboard() {
  const { user, userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchPlayerStats = async () => {
      try {
        if (userId) {
          const stats = await getPlayer(userId);
          setPlayerStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch player stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, [userId, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="page-container"><p className="loading">Loading dashboard...</p></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.full_name}! 👋</h1>
          <p className="header-subtitle">Your pool statistics and current standing</p>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Main Stats Card */}
        <div className="stats-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2>{user?.full_name}</h2>
            <p className="profile-email">{user?.email}</p>
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-label">Player ID</span>
                <span className="stat-value">#{userId}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">Feb 2026</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <a href="/money-match" className="action-btn">
                <span className="action-icon">💰</span>
                <span className="action-text">Money Match</span>
              </a>
              <a href="/players" className="action-btn">
                <span className="action-icon">👥</span>
                <span className="action-text">View Players</span>
              </a>
              <a href="/tournaments" className="action-btn">
                <span className="action-icon">🏆</span>
                <span className="action-text">Tournaments</span>
              </a>
              <a href="/leagues" className="action-btn">
                <span className="action-icon">📊</span>
                <span className="action-text">Leagues</span>
              </a>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">🎯</span>
              <div className="activity-content">
                <p className="activity-title">Account Created</p>
                <p className="activity-time">Welcome to UCT Supa Pool!</p>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💡</span>
              <div className="activity-content">
                <p className="activity-title">Tip</p>
                <p className="activity-time">Challenge other players in Money Match to earn rewards!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="featured-section">
          <div className="feature-card">
            <h3>💰 Money Match</h3>
            <p>Challenge other players with wager amounts. Win matches to earn real rewards!</p>
            <a href="/money-match" className="btn btn-primary">Start Playing</a>
          </div>
          
          <div className="feature-card">
            <h3>🏆 Tournaments</h3>
            <p>Participate in exciting pool tournaments and compete for rankings.</p>
            <a href="/tournaments" className="btn btn-primary">View Tournaments</a>
          </div>
          
          <div className="feature-card">
            <h3>📊 Leagues</h3>
            <p>Join leagues and climb the seasonal ladder to prove your skills.</p>
            <a href="/leagues" className="btn btn-primary">Join a League</a>
          </div>
        </div>
      </div>
    </div>
  );
}
