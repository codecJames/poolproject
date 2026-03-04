import { useState } from 'react';
import '../styles/HomePage.css';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';

const highlights = [
  {
    title: 'Players',
    description: 'Track rankings, records, and current form across the club.',
  },
  {
    title: 'Tournaments',
    description: 'Run knockout events with clear fixtures and results.',
  },
  {
    title: 'Leagues',
    description: 'Follow seasonal progress and compete for top spots.',
  },
  {
    title: 'Money Match',
    description: 'Challenge opponents and settle scores in head-to-head games.',
  },
];

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kicker">Pool Club Management</span>
          <h1>UCT Supa Pool</h1>
          <p className="hero-subtitle">
            A modern home for fixtures, results, league tables, and player progression.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
            <button className="btn btn-secondary" onClick={() => setShowSignupModal(true)}>
              Create Account
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Everything in one place</h2>
          <p>Built to make club operations and competition management straightforward.</p>
        </div>
        <div className="stats-grid">
          {highlights.map((item, index) => (
            <article key={item.title} className="stat-box">
              <span className="stat-index">0{index + 1}</span>
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

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
