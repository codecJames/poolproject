import { useState, useEffect, useRef } from 'react';
import {
  getMoneyMatches,
  getMoneyMatchLeaderboard,
  getPlayers,
  createChallenge,
  getChallengesForPlayer,
  acceptChallenge,
  declineChallenge,
  submitChallengeResult,
  getChallengeResult,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PaymentModal from '../components/PaymentModal';
import '../styles/PageContent.css';

export default function MoneyMatchPage() {
  const { user, userId } = useAuth();
  const { addNotification } = useNotification();
  
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [challengeAmount, setChallengeAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [challengeStage, setChallengeStage] = useState('list'); // list, challenge, payment, results
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [resultScores, setResultScores] = useState({ challenger: 0, challenged: 0 });
  const [confirmingResults, setConfirmingResults] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setError('Please log in to view money matches');
      setLoading(false);
      return;
    }
    fetchAllData();
    startPollingForChallenges();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId]);

  const startPollingForChallenges = () => {
    // Poll for new incoming challenges every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      if (userId) {
        checkForNewChallenges();
      }
    }, 5000);
  };

  const checkForNewChallenges = async () => {
    try {
      const challengesData = await getChallengesForPlayer(userId);
      const incomingPending = challengesData.filter(
        c => c.status === 'pending' && c.challenged_id === userId
      );
      
      // Count new incoming challenges
      const newCount = incomingPending.length;
      if (newCount > notificationCount) {
        const diff = newCount - notificationCount;
        addNotification({
          type: 'info',
          title: '⚡ New Challenge!',
          message: `You received ${diff} challenge${diff > 1 ? 's' : ''}!`,
          duration: 4000,
        });
      }
      setNotificationCount(newCount);
    } catch (err) {
      console.error('Error checking for new challenges:', err);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const [matchesData, leaderboardData, playersData, challengesData] = await Promise.all([
        getMoneyMatches(),
        getMoneyMatchLeaderboard(),
        getPlayers(),
        getChallengesForPlayer(userId),
      ]);
      setMatches(matchesData);
      setLeaderboard(leaderboardData);
      setPlayers(playersData);
      setChallenges(challengesData);
      setError(null);
    } catch (err) {
      setError('Failed to load money match data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeClick = (opponent) => {
    if (!userId) {
      addNotification({
        type: 'error',
        title: 'Please Log In',
        message: 'You must be logged in to challenge other players',
        duration: 3000,
      });
      return;
    }
    setSelectedOpponent(opponent);
    setShowChallengeForm(true);
    setChallengeStage('challenge');
    setFormError('');
  };

  const handleSubmitChallenge = async () => {
    if (!challengeAmount || parseFloat(challengeAmount) <= 0) {
      setFormError('Please enter a valid challenge amount');
      return;
    }

    try {
      const newChallenge = await createChallenge(userId, selectedOpponent.id, parseFloat(challengeAmount));
      setActiveChallenge(newChallenge);
      setShowPaymentModal(true);
      setChallengeAmount('');
      
      addNotification({
        type: 'info',
        title: 'Challenge Created',
        message: `Challenge to ${selectedOpponent.name} for R${parseFloat(challengeAmount).toFixed(2)} created`,
        duration: 3000,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create challenge';
      setFormError(errorMsg);
      addNotification({
        type: 'error',
        title: 'Challenge Failed',
        message: errorMsg,
        duration: 3000,
      });
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setChallengeStage('list');
    setActiveChallenge(null);
    setShowChallengeForm(false);
    setSelectedOpponent(null);

    addNotification({
      type: 'success',
      title: 'Payment Successful',
      message: 'Your challenge is now active and waiting for acceptance',
      duration: 3000,
    });

    await fetchAllData();
  };

  const handleAcceptChallenge = async (challenge) => {
    try {
      await acceptChallenge(challenge.id);
      setActiveChallenge(challenge);
      setChallengeStage('results');

      addNotification({
        type: 'success',
        title: 'Challenge Accepted',
        message: `Ready to play against ${challenge.challenger_name}!`,
        duration: 3000,
      });

      await fetchAllData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to accept challenge';
      addNotification({
        type: 'error',
        title: 'Accept Failed',
        message: errorMsg,
        duration: 3000,
      });
    }
  };

  const handleDeclineChallenge = async (challenge) => {
    try {
      await declineChallenge(challenge.id);

      addNotification({
        type: 'info',
        title: 'Challenge Declined',
        message: `You declined the challenge from ${challenge.challenger_name}`,
        duration: 3000,
      });

      await fetchAllData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to decline challenge';
      addNotification({
        type: 'error',
        title: 'Decline Failed',
        message: errorMsg,
        duration: 3000,
      });
    }
  };

  const handleSubmitResult = async (challenge, playerId) => {
    try {
      const result = await submitChallengeResult(
        challenge.id,
        resultScores.challenger,
        resultScores.challenged,
        playerId
      );
      setConfirmingResults(result);
      setResultScores({ challenger: 0, challenged: 0 });

      addNotification({
        type: 'success',
        title: 'Results Submitted',
        message: 'Waiting for opponent to confirm the results...',
        duration: 3000,
      });

      await fetchAllData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit results';
      addNotification({
        type: 'error',
        title: 'Submit Failed',
        message: errorMsg,
        duration: 3000,
      });
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading">Loading money match data...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💰 Money Match</h1>
        <p className="page-subtitle">Head-to-head high-stakes games with challenge system</p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.2)',
          border: '1px solid #ff6b6b',
          color: '#ff6b6b',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div className="controls" style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className={activeTab === 'leaderboard' ? 'filter-active' : ''}
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '0.6rem 1.2rem',
            border: activeTab === 'leaderboard' ? '2px solid #646cff' : '2px solid #404040',
            background: activeTab === 'leaderboard' ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
            color: activeTab === 'leaderboard' ? '#646cff' : '#aaa',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          🏆 Leaderboard
        </button>
        <button 
          className={activeTab === 'challenges' ? 'filter-active' : ''}
          onClick={() => setActiveTab('challenges')}
          style={{
            padding: '0.6rem 1.2rem',
            border: activeTab === 'challenges' ? '2px solid #646cff' : '2px solid #404040',
            background: activeTab === 'challenges' ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
            color: activeTab === 'challenges' ? '#646cff' : '#aaa',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          ⚡ Challenges
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
          }}
        >
          📜 History
        </button>
        <button onClick={fetchAllData} className="refresh-btn" style={{ marginLeft: 'auto' }}>🔄 Refresh</button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="content-card">
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">💵</p>
              <h2>No earnings yet</h2>
              <p>Challenge other players to start earning!</p>
            </div>
          ) : (
            <>
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
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Action</th>
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
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleChallengeClick(players.find(p => p.id === entry.player_id))}
                            style={{
                              background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}
                          >
                            ⚡ Challenge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div>
          {/* Pending Challenges */}
          <div className="content-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#646cff', marginTop: 0 }}>📥 Incoming Challenges</h2>
            {challenges.filter(c => c.status === 'pending' && c.challenged_id !== 1).length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p className="empty-icon">📭</p>
                <p>No incoming challenges</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {challenges.filter(c => c.status === 'pending' && c.challenged_id !== 1).map(challenge => (
                  <div
                    key={challenge.id}
                    style={{
                      background: 'rgba(100, 108, 255, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '6px',
                      border: '1px solid #646cff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                          Challenge from <span style={{ color: '#646cff' }}>{challenge.challenger_name}</span>
                        </p>
                        <p style={{ margin: 0, color: '#aaa' }}>
                          Amount: <span style={{ color: '#FFD700', fontWeight: '700' }}>R{challenge.challenge_amount}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => handleAcceptChallenge(challenge)}
                          style={{
                            background: 'linear-gradient(135deg, #51cf66 0%, #2f9e44 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.7rem 1.2rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleDeclineChallenge(challenge)}
                          style={{
                            background: '#404040',
                            color: '#fff',
                            border: 'none',
                            padding: '0.7rem 1.2rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Challenges */}
          <div className="content-card">
            <h2 style={{ color: '#646cff', marginTop: 0 }}>⚡ Active Challenges</h2>
            {challenges.filter(c => c.status === 'accepted').length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p className="empty-icon">🎮</p>
                <p>No active challenges - ready to play!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {challenges.filter(c => c.status === 'accepted').map(challenge => (
                  <div
                    key={challenge.id}
                    style={{
                      background: 'rgba(81, 207, 102, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '6px',
                      border: '1px solid #51cf66'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                          vs <span style={{ color: '#51cf66' }}>
                            {challenge.challenger_id === 1 ? challenge.challenged_name : challenge.challenger_name}
                          </span>
                        </p>
                        <p style={{ margin: 0, color: '#aaa' }}>
                          Wager: <span style={{ color: '#FFD700', fontWeight: '700' }}>R{challenge.challenge_amount}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveChallenge(challenge);
                          setChallengeStage('results');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.7rem 1.2rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        📝 Enter Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="content-card">
          {matches.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📜</p>
              <h2>No match history</h2>
              <p>Completed matches will be recorded here!</p>
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

      {/* Challenge Stage Modals */}
      {showChallengeForm && challengeStage === 'challenge' && selectedOpponent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="content-card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Challenge {selectedOpponent.name}</h2>
            {formError && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{formError}</div>}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Challenge Amount (R)</label>
              <input
                type="number"
                value={challengeAmount}
                onChange={(e) => setChallengeAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  marginTop: '0.5rem',
                  background: '#1a1a1a',
                  border: '2px solid #404040',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowChallengeForm(false);
                  setChallengeStage('list');
                  setSelectedOpponent(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: '#404040',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitChallenge}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Send Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && activeChallenge && selectedOpponent && (
        <PaymentModal
          amount={activeChallenge.challenge_amount}
          playerName={selectedOpponent.name}
          onSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPaymentModal(false);
            setChallengeStage('list');
            setActiveChallenge(null);
            setShowChallengeForm(false);
          }}
        />
      )}

      {activeChallenge && challengeStage === 'results' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div className="content-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem', margin: '2rem 0' }}>
            <h2 style={{ marginTop: 0 }}>📊 Enter Match Results</h2>
            
            <div style={{
              background: 'rgba(100, 108, 255, 0.1)',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#aaa' }}>
                vs <span style={{ color: '#646cff', fontWeight: '600' }}>
                  {activeChallenge.challenger_id === 1 ? activeChallenge.challenged_name : activeChallenge.challenger_name}
                </span> · R{activeChallenge.challenge_amount}
              </p>
            </div>

            {confirmingResults ? (
              <div style={{
                background: 'rgba(81, 207, 102, 0.1)',
                padding: '1.5rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                border: '1px solid #51cf66'
              }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#51cf66' }}>✓ Result Submitted</p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>Your scores:</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                  {resultScores.challenger} - {resultScores.challenged}
                </p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>
                  ⏳ Waiting for opponent to confirm...
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Your Score</label>
                    <input
                      type="number"
                      value={resultScores.challenger}
                      onChange={(e) => setResultScores({ ...resultScores, challenger: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        marginTop: '0.5rem',
                        background: '#1a1a1a',
                        border: '2px solid #646cff',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        fontWeight: '700'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Opponent Score</label>
                    <input
                      type="number"
                      value={resultScores.challenged}
                      onChange={(e) => setResultScores({ ...resultScores, challenged: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        marginTop: '0.5rem',
                        background: '#1a1a1a',
                        border: '2px solid #404040',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        fontWeight: '700'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      setChallengeStage('list');
                      setActiveChallenge(null);
                      setResultScores({ challenger: 0, challenged: 0 });
                    }}
                    style={{
                      flex: 1,
                      padding: '0.8rem',
                      background: '#404040',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitResult(activeChallenge, userId)}
                    style={{
                      flex: 1,
                      padding: '0.8rem',
                      background: 'linear-gradient(135deg, #51cf66 0%, #2f9e44 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Confirm Results
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
