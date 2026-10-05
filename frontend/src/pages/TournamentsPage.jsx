import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { createTournament, errorMessage, getTournaments, registerForTournament } from '../services/api';
import { formatDateTime, TOURNAMENT_STATUS } from '../utils/format';
import TournamentDetail from '../components/TournamentDetail';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'registration', label: 'Open for entries' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const EMPTY_FORM = { name: '', startDate: '', location: 'UCT', maxPlayers: '16', isPublic: true, rules: '' };

export default function TournamentsPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { userId, isAuthenticated, openLogin } = useAuth();
  const { addNotification } = useNotification();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTournaments = useCallback(async () => {
    try {
      setTournaments(await getTournaments());
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load tournaments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Give the tournament a name');
      return;
    }
    setSaving(true);
    try {
      const created = await createTournament({
        name: form.name.trim(),
        rules: form.rules.trim(),
        location: form.location.trim(),
        is_public: form.isPublic,
        max_players: Number(form.maxPlayers),
        start_date: form.startDate ? new Date(form.startDate).toISOString() : null,
      });
      addNotification({ type: 'success', title: 'Tournament created', message: `${created.name} is open for entries`, duration: 3000 });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchTournaments();
      navigate(`/tournaments/${created.id}`);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create the tournament.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEnter = async (tournament) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    try {
      await registerForTournament(tournament.id);
      addNotification({ type: 'success', title: "You're in!", message: `Entered ${tournament.name}`, duration: 3000 });
      fetchTournaments();
    } catch (err) {
      addNotification({ type: 'error', title: 'Could not enter', message: errorMessage(err) });
    }
  };

  const visible = filter === 'all' ? tournaments : tournaments.filter((t) => t.status === filter);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tournaments</h1>
        <p className="page-subtitle">Knockout events with live brackets</p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="spacer" />
        {isAuthenticated ? (
          <button onClick={() => setShowForm((open) => !open)}>{showForm ? 'Close form' : '+ Create tournament'}</button>
        ) : (
          <button onClick={openLogin}>Log in to create one</button>
        )}
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleCreate} style={{ marginBottom: '1.5rem' }}>
          <h2 className="panel-title">New tournament</h2>
          {formError && <div className="error-message">{formError}</div>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="t-name">Name</label>
              <input id="t-name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Spring Open" maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="t-start">Start (optional)</label>
              <input id="t-start" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="t-location">Location</label>
              <input id="t-location" name="location" value={form.location} onChange={handleChange} maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="t-max">Maximum players</label>
              <select id="t-max" name="maxPlayers" value={form.maxPlayers} onChange={handleChange}>
                {[4, 8, 16, 32, 64].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field span-all">
              <label htmlFor="t-rules">Rules (optional)</label>
              <textarea id="t-rules" name="rules" value={form.rules} onChange={handleChange} placeholder="Format, race length, house rules..." maxLength={2000} />
            </div>
            <div className="field checkbox span-all">
              <input id="t-public" name="isPublic" type="checkbox" checked={form.isPublic} onChange={handleChange} />
              <label htmlFor="t-public">List publicly (unlisted tournaments are only reachable by link)</label>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create tournament'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="loading">Loading tournaments...</p>
      ) : error ? (
        <div className="panel empty-note">
          <p className="error-message">{error}</p>
          <button onClick={fetchTournaments}>Retry</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="panel empty-note">
          <h2>No tournaments here yet</h2>
          <p>{isAuthenticated ? 'Create one to get the club playing.' : 'Log in to create the first one.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {visible.map((t) => {
            const status = TOURNAMENT_STATUS[t.status] || TOURNAMENT_STATUS.registration;
            const entered = t.registered_user_ids.includes(userId);
            const full = t.registration_count >= t.max_players;
            return (
              <article key={t.id} className="item-card">
                <div className="flex-between gap-1">
                  <h3>{t.name}</h3>
                  <span className={`badge ${status.badge}`}>{status.label}</span>
                </div>
                <div className="meta-grid">
                  <div>
                    <span className="meta-label">Starts</span>
                    <span className="meta-value">{t.start_date ? formatDateTime(t.start_date) : 'TBC'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Location</span>
                    <span className="meta-value">{t.location || 'TBC'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Players</span>
                    <span className="meta-value">{t.registration_count} / {t.max_players}</span>
                  </div>
                  <div>
                    <span className="meta-label">{t.status === 'completed' ? 'Champion' : 'Organiser'}</span>
                    <span className="meta-value">{t.status === 'completed' ? t.winner_name : t.creator_name}</span>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn-outline btn-small" onClick={() => navigate(`/tournaments/${t.id}`)}>
                    {t.status === 'registration' ? 'Details' : 'View bracket'}
                  </button>
                  {t.status === 'registration' && (entered ? (
                    <span className="badge badge-success">You&apos;re entered</span>
                  ) : (
                    <button className="btn-small" disabled={full} onClick={() => handleEnter(t)}>
                      {full ? 'Full' : 'Enter'}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tournamentId && (
        <TournamentDetail
          key={tournamentId}
          tournamentId={tournamentId}
          onClose={() => navigate('/tournaments')}
          onChanged={fetchTournaments}
        />
      )}
    </div>
  );
}
