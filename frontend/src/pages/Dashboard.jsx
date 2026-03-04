import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getPlayer } from '../services/api';

const quickLinks = [
  { to: '/money-match', title: 'Money Match', subtitle: 'Challenge now' },
  { to: '/players', title: 'Players', subtitle: 'View rankings' },
  { to: '/tournaments', title: 'Tournaments', subtitle: 'Active events' },
  { to: '/leagues', title: 'Leagues', subtitle: 'Season tables' },
];

const features = [
  {
    title: 'Money Match',
    description: 'Set up head-to-head games and track results quickly.',
    to: '/money-match',
    cta: 'Start Playing',
  },
  {
    title: 'Tournaments',
    description: 'Compete in structured events and monitor bracket progress.',
    to: '/tournaments',
    cta: 'View Tournaments',
  },
  {
    title: 'Leagues',
    description: 'Stay on top of the standings across every season.',
    to: '/leagues',
    cta: 'Open Leagues',
  },
];

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
    return (
      <div className="page-container">
        <p className="loading">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-content">
          <span className="header-kicker">Dashboard</span>
          <h1>Welcome back, {user?.full_name}</h1>
          <p className="header-subtitle">Your latest activity, stats, and shortcuts.</p>
        </div>
      </header>

      <div className="dashboard-container">
        <section className="stats-section">
          <article className="profile-card">
            <div className="profile-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
            <h2>{user?.full_name}</h2>
            <p className="profile-email">{user?.email}</p>

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-label">Player ID</span>
                <span className="stat-value">#{userId}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wins</span>
                <span className="stat-value">{playerStats?.wins ?? 0}</span>
              </div>
            </div>
          </article>

          <article className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              {quickLinks.map((item) => (
                <Link key={item.to} to={item.to} className="action-btn">
                  <span className="action-title">{item.title}</span>
                  <span className="action-text">{item.subtitle}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-content">
                <p className="activity-title">Account active</p>
                <p className="activity-time">Welcome to your Supa Pool dashboard.</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-content">
                <p className="activity-title">Tip</p>
                <p className="activity-time">Use Money Match to challenge other players quickly.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="featured-section">
          {features.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link to={item.to} className="btn btn-primary">
                {item.cta}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
