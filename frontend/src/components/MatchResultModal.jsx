import { useState } from 'react';
import '../styles/AuthModal.css';

// Score entry for a head-to-head game; the higher score wins
export default function MatchResultModal({
  title = 'Report result',
  player1Name,
  player2Name,
  initialScores = [0, 0],
  note,
  submitLabel = 'Submit result',
  onClose,
  onSubmit,
}) {
  const [score1, setScore1] = useState(String(initialScores[0] ?? 0));
  const [score2, setScore2] = useState(String(initialScores[1] ?? 0));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const first = Number.parseInt(score1, 10);
    const second = Number.parseInt(score2, 10);
    if (Number.isNaN(first) || Number.isNaN(second) || first < 0 || second < 0) {
      setError('Enter both scores');
      return;
    }
    if (first === second) {
      setError("Scores can't be level; someone has to win");
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(first, second);
    } catch (err) {
      setError(err.message || 'Could not save the result');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-header">
          <h2 id="result-title">{title}</h2>
          <p>Frames won by each player</p>
        </div>

        <form onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <div className="versus">
            <div className="field">
              <label htmlFor="score-1">{player1Name}</label>
              <input
                id="score-1"
                className="score-input"
                type="number"
                min="0"
                max="99"
                inputMode="numeric"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                autoFocus
              />
            </div>
            <span className="versus-sep">vs</span>
            <div className="field">
              <label htmlFor="score-2">{player2Name}</label>
              <input
                id="score-2"
                className="score-input"
                type="number"
                min="0"
                max="99"
                inputMode="numeric"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
              />
            </div>
          </div>
          {note && <p className="muted" style={{ marginTop: '1rem' }}>{note}</p>}
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
