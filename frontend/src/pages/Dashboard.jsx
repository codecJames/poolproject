import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches, getMyChallenges, getMyTournaments } from '../services/api';
import { formatDate, TOURNAMENT_STATUS, winRate } from '../utils/format';
import '../styles/Dashboard.css';

const quickLinks = [
  { to: '/challenges', title: 'Challenges', subtitle: 'Call out a player' },
  { to: '/players', title: 'Rankings', subtitle: 'See where you stand' },
  { to: '/tournaments', title: 'Tournaments', subtitle: 'Enter an event' },
  { to: '/leagues', title: 'Leagues', subtitle: 'Join your team' },
];

export default function Dashboard() {
  const { user, player, playerId, isAuthenticated, refreshPlayer } = useAuth();
  const [matches, setMatches] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !playerId) return;
    Promise.all([getMatches(playerId), getMyChallenges(), getMyTournaments(), refreshPlayer()])
      .then(([matchList, challengeList, tournamentList]) => {
        setMatches(matchList.slice(0, 5));
        setChallenges(challengeList);
        setTournaments(tournamentList.filter((t) => t.status !== 'completed').slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, playerId, refreshPlayer]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const needsAction = challenges.filter(
    (c) =>
      (c.status === 'pending' && c.challenged_id === playerId) ||
      (c.status === 'accepted' && c.reported_by_id && c.reported_by_id !== playerId)
  ).length;
  const openChallenges = challenges.filter((c) => c.status === 'pending' || c.status === 'accepted').length;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-content">
          <span className="header-kicker">Dashboard</span>
          <h1>Welcome back, {user?.full_name?.split(' ')[0]}</h1>
          <p className="header-subtitle">Your record, open challenges and upcoming events.</p>
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
                <span className="stat-label">Rating</span>
                <span className="stat-value">{Math.round(player?.rating ?? 1000)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Win rate</span>
                <span className="stat-value">{player ? winRate(player) : 0}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Played</span>
                <span className="stat-value">{player?.matches_played ?? 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Won</span>
                <span className="stat-value">{player?.matches_won ?? 0}</span>
              </div>
            </div>
          </article>

          <article className="quick-actions">
            <h3>Quick actions</h3>
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

        <section className="featured-section">
          <article className="feature-card">
            <h3>Challenges</h3>
            <p>
              {loading
                ? 'Loading...'
                : needsAction
                  ? `${needsAction} challenge${needsAction > 1 ? 's need' : ' needs'} your reply or confirmation.`
                  : openChallenges
                    ? `${openChallenges} open challenge${openChallenges > 1 ? 's' : ''}, nothing waiting on you.`
                    : 'No open challenges. Call someone out!'}
            </p>
            <Link to="/challenges" className="btn btn-primary">Open challenges</Link>
          </article>

          <article className="feature-card">
            <h3>Your tournaments</h3>
            {loading ? (
              <p>Loading...</p>
            ) : tournaments.length === 0 ? (
              <p>You haven&apos;t entered any upcoming tournaments.</p>
            ) : (
              <ul className="activity-list" style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 1rem' }}>
                {tournaments.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tournaments/${t.id}`}>{t.name}</Link>
                    <span className="muted"> · {TOURNAMENT_STATUS[t.status]?.label}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/tournaments" className="btn btn-primary">Browse tournaments</Link>
          </article>
        </section>

        <section className="activity-section">
          <h3>Recent games</h3>
          <div className="activity-list">
            {loading ? (
              <p>Loading...</p>
            ) : matches.length === 0 ? (
              <div className="activity-item">
                <p className="activity-title">No games yet</p>
                <p className="activity-time">Results from challenges and tournaments will show up here.</p>
              </div>
            ) : (
              matches.map((m) => {
                const won = m.winner_id === playerId;
                const opponent = m.player_1_id === playerId ? m.player_2_name : m.player_1_name;
                const [mine, theirs] = m.player_1_id === playerId ? [m.player_1_score, m.player_2_score] : [m.player_2_score, m.player_1_score];
                return (
                  <div className="activity-item" key={m.id}>
                    <p className="activity-title">
                      <span className={won ? 'text-success' : 'text-error'}>{won ? 'Won' : 'Lost'}</span> {mine}-{theirs} vs {opponent}
                    </p>
                    <p className="activity-time">{formatDate(m.played_at)} · {m.tournament_name || 'Challenge'}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
