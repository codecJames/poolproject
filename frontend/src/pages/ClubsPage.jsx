import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { createClub, errorMessage, getClubs } from '../services/api';

const EMPTY_FORM = { name: '', location: 'UCT', description: '' };

export default function ClubsPage() {
  const { isAuthenticated, openLogin } = useAuth();
  const { addNotification } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchClubs = useCallback(async () => {
    try {
      setClubs(await getClubs());
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load clubs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Club name is required');
      return;
    }
    setSaving(true);
    try {
      const club = await createClub(form.name.trim(), form.location.trim(), form.description.trim());
      addNotification({ type: 'success', title: 'Club added', message: club.name, duration: 3000 });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchClubs();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not add the club.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Clubs</h1>
        <p className="page-subtitle">Residences and venues that play in the club</p>
      </div>

      <div className="toolbar">
        <span className="spacer" />
        {isAuthenticated ? (
          <button onClick={() => setShowForm((open) => !open)}>{showForm ? 'Close form' : '+ Add club'}</button>
        ) : (
          <button onClick={openLogin}>Log in to add a club</button>
        )}
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleCreate} style={{ marginBottom: '1.5rem' }}>
          <h2 className="panel-title">New club</h2>
          {formError && <div className="error-message">{formError}</div>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="club-name">Club name</label>
              <input id="club-name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Tugwell Hall" maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="club-location">Location</label>
              <input id="club-location" name="location" value={form.location} onChange={handleChange} maxLength={80} />
            </div>
            <div className="field span-all">
              <label htmlFor="club-description">Description (optional)</label>
              <textarea id="club-description" name="description" value={form.description} onChange={handleChange} placeholder="Where you play, practice nights..." maxLength={500} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add club'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="loading">Loading clubs...</p>
      ) : error ? (
        <div className="panel empty-note">
          <p className="error-message">{error}</p>
          <button onClick={fetchClubs}>Retry</button>
        </div>
      ) : clubs.length === 0 ? (
        <div className="panel empty-note"><h2>No clubs yet</h2></div>
      ) : (
        <div className="card-grid">
          {clubs.map((club) => (
            <article key={club.id} className="item-card">
              <h3>{club.name}</h3>
              <div>
                <span className="meta-label">Location</span>
                <span className="meta-value">{club.location || 'UCT'}</span>
              </div>
              {club.description && <p>{club.description}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
