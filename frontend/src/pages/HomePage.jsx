import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/HomePage.css';

const highlights = [
  {
    ball: 1,
    color: 'var(--brass-400)',
    title: 'Players',
    description: 'Track rankings, records, and current form across the club.',
  },
  {
    ball: 2,
    color: 'var(--chalk-500)',
    title: 'Tournaments',
    description: 'Run knockout events with clear fixtures and results.',
  },
  {
    ball: 3,
    color: '#c94a3f',
    title: 'Leagues',
    description: 'Follow seasonal progress and compete for top spots.',
  },
  {
    ball: 8,
    color: '#16110a',
    title: 'Challenges',
    description: 'Call out any player for a head-to-head game; every result moves the rankings.',
  },
];

export default function HomePage() {
  const { isAuthenticated, user, openLogin, openSignup } = useAuth();
  const heroRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--mx', mx.toFixed(3));
    el.style.setProperty('--my', my.toFixed(3));
  };

  const handleMouseLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty('--mx', 0);
    el.style.setProperty('--my', 0);
  };

  return (
    <div className="home-page">
      <section
        className="hero"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="hero-table-lines" aria-hidden="true" />

        <div className="hero-balls" aria-hidden="true">
          <span className="hero-ball" style={{ '--depth': 1.6, '--num': "'1'", background: 'radial-gradient(circle at 35% 30%, #fff 0%, #fff 8%, #f2c14e 10%, #d69a1e 100%)' }} />
          <span className="hero-ball" style={{ '--depth': 0.9, '--num': "'8'", background: 'radial-gradient(circle at 35% 30%, #6a6a6a 0%, #262626 12%, #0a0a0a 100%)' }} />
          <span className="hero-ball" style={{ '--depth': 1.3, '--num': "'3'", background: 'radial-gradient(circle at 35% 30%, #fff 0%, #fff 8%, #e2665a 10%, #a3352b 100%)' }} />
          <span className="hero-ball" style={{ '--depth': 2, '--num': "'9'", background: 'radial-gradient(circle at 35% 30%, #fff 0%, #fff 8%, #f2c14e 10%, #d69a1e 100%)' }} />
          <span className="hero-ball" style={{ '--depth': 1.1, '--num': "'2'", background: 'radial-gradient(circle at 35% 30%, #fff 0%, #fff 8%, #4f86cf 10%, #2c5289 100%)' }} />
        </div>

        <div className="hero-content">
          <span className="hero-kicker">Rack &rsquo;em up</span>
          <h1>UCT Supa Pool</h1>
          <p className="hero-subtitle">
            A modern home for fixtures, results, league tables, and player progression.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                <Link className="btn btn-primary" to="/dashboard">
                  Continue as {user?.full_name?.split(' ')[0]}
                </Link>
                <Link className="btn btn-secondary" to="/challenges">
                  Challenge someone
                </Link>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={openLogin}>
                  Log in
                </button>
                <button className="btn btn-secondary" onClick={openSignup}>
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Everything in one place</h2>
          <p>Built to make club operations and competition management straightforward.</p>
        </div>
        <div className="stats-grid">
          {highlights.map((item) => (
            <article key={item.title} className="stat-box">
              <span className="stat-ball" style={{ '--ball-color': item.color }}>
                <span className="stat-ball-number">{item.ball}</span>
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-section">
        <h2>About UCT Supa Pool</h2>
        <p className="about-text">
          Manage players, clubs, tournaments, and leagues from one clean interface. Whether
          you are organizing events or climbing the rankings, the platform keeps your pool
          journey structured and transparent.
        </p>
      </section>
    </div>
  );
}
