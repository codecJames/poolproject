import { useCallback, useEffect, useState } from 'react';
import {
  deleteTournament,
  errorMessage,
  getTournament,
  registerForTournament,
  reportTournamentMatch,
  startTournament,
  unregisterFromTournament,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDateTime, roundName, TOURNAMENT_STATUS } from '../utils/format';
import MatchResultModal from './MatchResultModal';
import '../styles/AuthModal.css';
import '../styles/TournamentDetail.css';

const REFRESH_MS = 10000;

export default function TournamentDetail({ tournamentId, onClose, onChanged }) {
  const { userId, isAuthenticated, openLogin } = useAuth();
  const { addNotification } = useNotification();
  const [tournament, setTournament] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(null);

  const load = useCallback(async () => {
    try {
      setTournament(await getTournament(tournamentId));
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load this tournament'));
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the bracket current while games are being played
  const inProgress = tournament?.status === 'in_progress';
  useEffect(() => {
    if (!inProgress) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [inProgress, load]);

  const run = async (action, successTitle) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setBusy(true);
    try {
      const updated = await action();
      if (updated?.id) setTournament(updated);
      addNotification({ type: 'success', title: successTitle, duration: 3000 });
      onChanged?.();
      return updated;
    } catch (err) {
      addNotification({ type: 'error', title: 'Something went wrong', message: errorMessage(err) });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${tournament.name}"? This can't be undone.`)) return;
    const result = await run(() => deleteTournament(tournament.id), 'Tournament deleted');
    if (result) onClose();
  };

  const handleReport = async (player1Score, player2Score) => {
    try {
      const updated = await reportTournamentMatch(tournament.id, reporting.id, player1Score, player2Score);
      setTournament(updated);
      setReporting(null);
      onChanged?.();
      addNotification({
        type: 'success',
        title: updated.status === 'completed' ? `${updated.winner_name} wins the tournament!` : 'Result saved',
        duration: 4000,
      });
    } catch (err) {
      throw new Error(errorMessage(err, 'Could not save the result'));
    }
  };

  if (!tournament) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          {loadError ? <p className="error-message">{loadError}</p> : <p className="loading">Loading tournament...</p>}
        </div>
      </div>
    );
  }

  const status = TOURNAMENT_STATUS[tournament.status] || TOURNAMENT_STATUS.registration;
  const isOrganiser = userId === tournament.created_by_id;
  const isRegistered = tournament.registered_user_ids.includes(userId);
  const isFull = tournament.registration_count >= tournament.max_players;
  const rounds = [];
  for (const match of tournament.matches) {
    (rounds[match.round_number - 1] ||= []).push(match);
  }
  const canReport = (match) =>
    tournament.status === 'in_progress' &&
    !match.completed &&
    match.player1_id &&
    match.player2_id &&
    (isOrganiser || userId === match.player1_id || userId === match.player2_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="td-header">
          <h2 id="tournament-title">{tournament.name}</h2>
          <span className={`badge ${status.badge}`}>{status.label}</span>
        </div>

        <div className="meta-grid">
          <div>
            <span className="meta-label">Organiser</span>
            <span className="meta-value">{tournament.creator_name}</span>
          </div>
          <div>
            <span className="meta-label">Location</span>
            <span className="meta-value">{tournament.location || 'TBC'}</span>
          </div>
          <div>
            <span className="meta-label">Starts</span>
            <span className="meta-value">{tournament.start_date ? formatDateTime(tournament.start_date) : 'TBC'}</span>
          </div>
          <div>
            <span className="meta-label">Players</span>
            <span className="meta-value">{tournament.registration_count} / {tournament.max_players}</span>
          </div>
        </div>

        {tournament.status === 'completed' && tournament.winner_name && (
          <div className="td-champion">Champion: {tournament.winner_name}</div>
        )}

        {tournament.status === 'registration' && (
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            {isRegistered ? (
              <button className="btn-outline" disabled={busy} onClick={() => run(() => unregisterFromTournament(tournament.id), 'You have withdrawn')}>
                Withdraw
              </button>
            ) : (
              <button disabled={busy || isFull} onClick={() => run(() => registerForTournament(tournament.id), "You're in!")}>
                {isFull ? 'Tournament full' : 'Enter tournament'}
              </button>
            )}
            {isOrganiser && (
              <>
                <button
                  className="btn-secondary"
                  disabled={busy || tournament.registration_count < 2}
                  title={tournament.registration_count < 2 ? 'At least 2 players need to enter first' : undefined}
                  onClick={() => run(() => startTournament(tournament.id), 'Bracket drawn, tournament started')}
                >
                  Start &amp; draw bracket
                </button>
                <button className="btn-danger" disabled={busy} onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>
        )}

        {tournament.rules && (
          <section className="td-section">
            <h3>Rules</h3>
            <p className="td-rules">{tournament.rules}</p>
          </section>
        )}

        {tournament.status === 'registration' ? (
          <section className="td-section">
            <h3>Entrants</h3>
            {tournament.registrations.length === 0 ? (
              <p className="muted">No one has entered yet.</p>
            ) : (
              <ul className="td-entrants">
                {tournament.registrations.map((r) => <li key={r.user_id}>{r.full_name}</li>)}
              </ul>
            )}
          </section>
        ) : (
          <section className="td-section">
            <h3>Bracket</h3>
            <div className="bracket">
              {rounds.map((matches, index) => (
                <div className="bracket-round" key={index}>
                  <h4>{roundName(index + 1, tournament.total_rounds)}</h4>
                  {matches.map((match) => (
                    <div className="bracket-match" key={match.id}>
                      <BracketSlot
                        name={match.player1_name}
                        score={match.player1_score}
                        won={match.completed && match.winner_id === match.player1_id}
                        showScore={match.completed && !match.is_bye}
                      />
                      <BracketSlot
                        name={match.is_bye ? 'Bye' : match.player2_name}
                        score={match.player2_score}
                        won={match.completed && match.winner_id === match.player2_id}
                        showScore={match.completed && !match.is_bye}
                      />
                      {canReport(match) && (
                        <button className="bracket-report" onClick={() => setReporting(match)}>
                          Report result
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {inProgress && <p className="muted" style={{ marginTop: '0.5rem' }}>The bracket refreshes automatically as results come in.</p>}
          </section>
        )}

        {reporting && (
          <MatchResultModal
            title={roundName(reporting.round_number, tournament.total_rounds)}
            player1Name={reporting.player1_name}
            player2Name={reporting.player2_name}
            onClose={() => setReporting(null)}
            onSubmit={handleReport}
          />
        )}
      </div>
    </div>
  );
}

function BracketSlot({ name, score, won, showScore }) {
  return (
    <div className={`bracket-slot ${won ? 'winner' : ''} ${name ? '' : 'empty'}`}>
      <span>{name || 'To be decided'}</span>
      {showScore && <span className="bracket-score">{score}</span>}
    </div>
  );
}
