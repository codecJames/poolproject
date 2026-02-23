import { useState, useEffect } from 'react';
import { getClubs, createClub } from '../services/api';
import '../styles/PageContent.css';

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: 'UCT',
    description: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const data = await getClubs();
      setClubs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load clubs. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Club name is required');
      return;
    }

    try {
      await createClub(formData.name, formData.location, formData.description);
      setFormData({ name: '', location: 'UCT', description: '' });
      setShowForm(false);
      fetchClubs();
    } catch (err) {
      setFormError('Failed to create club. Please try again.');
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading">Loading clubs...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="error">{error}</p>
        <button onClick={fetchClubs} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏛️ Clubs</h1>
        <p className="page-subtitle">Pool clubs and venues</p>
      </div>

      <div className="controls" style={{ marginBottom: '2rem' }}>
        <button 
          className="refresh-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close' : '+ Add Club'}
        </button>
        <button onClick={fetchClubs} className="refresh-btn">🔄 Refresh</button>
      </div>

      {showForm && (
        <div className="content-card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleCreateClub} style={{ padding: '1.5rem' }}>
            {formError && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{formError}</div>}
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="name">Club Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., UCT Supa Pool"
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
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Club description..."
                rows="3"
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
              Create Club
            </button>
          </form>
        </div>
      )}

      {clubs.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <p className="empty-icon">🎱</p>
            <h2>No clubs yet</h2>
            <p>Create the first club to get started!</p>
          </div>
        </div>
      ) : (
        <div className="clubs-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {clubs.map(club => (
            <div key={club.id} className="content-card" style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#646cff', marginTop: 0 }}>{club.name}</h3>
              <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>
                <strong>Location:</strong> {club.location}
              </p>
              {club.description && (
                <p style={{ color: '#bbb', marginBottom: '1rem' }}>
                  {club.description}
                </p>
              )}
              <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                Created: {new Date(club.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
