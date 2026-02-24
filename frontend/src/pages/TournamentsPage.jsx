import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getTournaments, createTournament, registerForTournament, unregisterFromTournament, getTournament, startTournament } from '../services/api';
import '../styles/PageContent.css';

export default function TournamentsPage() {
  const { user, userId, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    location: 'UCT',
    entryFee: '0',
    rules: '',
    isPublic: true,
    maxPlayers: 32,
    prizePool: 0,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await getTournaments(true, null);
      setTournaments(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load tournaments. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isAuthenticated || !userId) {
      setFormError('You must be logged in to create a tournament');
      return;
    }

    if (!formData.name.trim() || !formData.startDate) {
      setFormError('Tournament name and start date are required');
      return;
    }

    try {
      const tournamentPayload = {
        name: formData.name,
        rules: formData.rules,
        is_public: !!formData.isPublic,
        max_players: parseInt(formData.maxPlayers || formData.maxPlayers === 0 ? formData.maxPlayers : formData.maxPlayers) || parseInt(formData.maxPlayers) || 32,
        start_date: new Date(formData.startDate).toISOString(),
        prize_pool: parseFloat(formData.prizePool) || 0.0,
      };

      const newTournament = await createTournament(tournamentPayload, userId);

      addNotification({ type: 'success', title: 'Tournament Created', message: `${newTournament.name} created successfully` });

      setTournaments(prev => [...prev, newTournament]);
      setFormData({ name: '', startDate: '', location: 'UCT', entryFee: '0', rules: '', isPublic: true, maxPlayers: 32, prizePool: 0 });
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create tournament. Please try again.');
    }
  };

  const handleRegisterTournament = async (tournamentId) => {
    if (!isAuthenticated || !userId) {
      addNotification({ type: 'error', title: 'Please log in', message: 'You must log in to register for a tournament' });
      return;
    }

    try {
      await registerForTournament(tournamentId, userId);
      addNotification({ type: 'success', title: 'Registered', message: 'Successfully registered for the tournament' });
      fetchTournaments();
    } catch (err) {
      addNotification({ type: 'error', title: 'Registration Failed', message: err.response?.data?.detail || 'Could not register' });
    }
  };

  const handleUnregisterTournament = async (tournamentId) => {
    try {
      await unregisterFromTournament(tournamentId, userId);
      addNotification({ type: 'success', title: 'Unregistered', message: 'You have been unregistered' });
      fetchTournaments();
    } catch (err) {
      addNotification({ type: 'error', title: 'Unregister Failed', message: err.response?.data?.detail || 'Could not unregister' });
    }
  };

  const handleStartTournament = async (tournamentId) => {
    try {
      await startTournament(tournamentId, userId);
      addNotification({ type: 'success', title: 'Tournament Started', message: 'Bracket has been generated' });
      fetchTournaments();
    } catch (err) {
      addNotification({ type: 'error', title: 'Start Failed', message: err.response?.data?.detail || 'Could not start tournament' });
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading">Loading tournaments...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="error">{error}</p>
        <button onClick={fetchTournaments} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏆 Tournaments</h1>
        <p className="page-subtitle">Upcoming and past tournaments</p>
      </div>

      <div className="controls" style={{ marginBottom: '2rem' }}>
        <button 
          className="refresh-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close' : '+ Create Tournament'}
        </button>
        <button onClick={fetchTournaments} className="refresh-btn">🔄 Refresh</button>
      </div>

      {showForm && (
        <div className="content-card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleCreateTournament} style={{ padding: '1.5rem' }}>
            {formError && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{formError}</div>}
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="name">Tournament Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Spring Championship"
                style={{
                  padding: '0.75rem',
                  border: '2px solid #404040',
                  borderRadius: '6px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  width: '100%'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleInputChange}
                style={{
                  padding: '0.75rem',
                  border: '2px solid #404040',
                  borderRadius: '6px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  width: '100%'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., UCT"
                style={{
                  padding: '0.75rem',
                  border: '2px solid #404040',
                  borderRadius: '6px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  width: '100%'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="entryFee">Entry Fee</label>
              <input
                id="entryFee"
                name="entryFee"
                type="number"
                value={formData.entryFee}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                style={{
                  padding: '0.75rem',
                  border: '2px solid #404040',
                  borderRadius: '6px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  width: '100%'
                }}
              />
            </div>

            <button 
              type="submit" 
              style={{
                padding: '0.9rem 1.5rem',
                background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                width: '100%'
              }}
            >
              Create Tournament
            </button>
          </form>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <p className="empty-icon">📋</p>
            <h2>No tournaments yet</h2>
            <p>Create a tournament to get started!</p>
          </div>
        </div>
      ) : (
        <div className="tournaments-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {tournaments.map(tournament => (
            <div key={tournament.id} className="content-card" style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#646cff', marginTop: 0 }}>{tournament.name}</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{ color: '#aaa', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Location</p>
                  <p style={{ color: '#fff', margin: 0, fontWeight: '600' }}>{tournament.location}</p>
                </div>
                <div>
                  <p style={{ color: '#aaa', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Entry Fee</p>
                  <p style={{ color: '#fff', margin: 0, fontWeight: '600' }}>R{tournament.entry_fee.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p style={{ color: '#aaa', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Start Date</p>
                <p style={{ color: '#fff', margin: 0 }}>
                  {new Date(tournament.start_date).toLocaleDateString()} at {new Date(tournament.start_date).toLocaleTimeString()}
                </p>
              </div>
              <p style={{ color: '#999', fontSize: '0.85rem', margin: '1rem 0 0 0' }}>
                Prize Pool: R{tournament.prize_pool.toFixed(2)}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // open tournament details (could be expanded later)
                    window.location.href = `/tournaments/${tournament.id}`;
                  }}
                >
                  👁️ View Details
                </button>

                {isAuthenticated && tournament.status === 'registration' && (
                  tournament.created_by_id === userId ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleStartTournament(tournament.id)}
                    >
                      🎮 Start Tournament
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleRegisterTournament(tournament.id)}
                    >
                      ✋ Register
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
