import { useState } from 'react';
import '../styles/HomePage.css';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-content">
          <h1>🎱 Welcome to UCT Supa Pool</h1>
          <p className="hero-subtitle">Track your game, dominate the competition</p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowSignupModal(true)}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Quick Stats</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-icon">👥</span>
            <h3>Players</h3>
            <p>Track player statistics and rankings</p>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🏆</span>
            <h3>Tournaments</h3>
            <p>Participate in pool tournaments</p>
          </div>
          <div className="stat-box">
            <span className="stat-icon">📊</span>
            <h3>Leagues</h3>
            <p>Join seasons and climb the ladder</p>
          </div>
          <div className="stat-box">
            <span className="stat-icon">💰</span>
            <h3>Money Match</h3>
            <p>Head-to-head high-stakes games</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>About UCT Supa Pool</h2>
        <p className="about-text">
          UCT Supa Pool is your ultimate pool club management and statistics platform.
          Track player performance, organize tournaments, manage leagues, and compete
          in money matches. All in one place.
        </p>
      </div>

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
