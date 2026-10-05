import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  declineChallenge,
  errorMessage,
  getMatches,
  getMyChallenges,
  getPlayers,
  reportChallengeScore,
} from '../services/api';
import { formatDate, formatDateTime, winRate } from '../utils/format';
import MatchResultModal from '../components/MatchResultModal';

const POLL_MS = 15000;

export default function ChallengesPage() {
  const { isAuthenticated, playerId, openLogin, refreshPlayer } = useAuth();
  const { addNotification } = useNotification();

  const [tab, setTab] = useState(isAuthenticated ? 'mine' : 'players');
  const [players, setPlayers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [scoring, setScoring] = useState(null);
  const seenIncoming = useRef(null);

  const loadChallenges = useCallback(async () => {
    if (!isAuthenticated) return;
    const mine = await getMyChallenges();
    setChallenges(mine);

    // Let the user know when someone new challenges them
    const incoming = new Set(mine.filter((c) => c.status === 'pending' && c.challenged_id === playerId).map((c) => c.id));
    if (seenIncoming.current) {
      const fresh = [...incoming].filter((id) => !seenIncoming.current.has(id)).length;
      if (fresh) {
        addNotification({ type: 'info', title: 'New challenge', message: `You have ${fresh} new challenge${fresh > 1 ? 's' : ''}`, duration: 5000 });
      }
    }
    seenIncoming.current = incoming;
  }, [isAuthenticated, playerId, addNotification]);

  const loadAll = useCallback(async () => {
    try {
      const [playerList, matchList] = await Promise.all([getPlayers(), getMatches(), loadChallenges()]);
      setPlayers(playerList);
      setMatches(matchList);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load challenges.'));
    } finally {
      setLoading(false);
    }
  }, [loadChallenges]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadChallenges().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, loadChallenges]);

  const act = async (id, action, successTitle) => {
    setBusyId(id);
    try {
      await action();
      addNotification({ type: 'success', title: successTitle, duration: 3000 });
      await loadChallenges();
      return true;
    } catch (err) {
      addNotification({ type: 'error', title: 'Something went wrong', message: errorMessage(err) });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleChallenge = (opponent) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    act(`p${opponent.id}`, () => createChallenge(opponent.id), `Challenge sent to ${opponent.name}`).then((sent) => {
      if (sent) setTab('mine');
    });
  };

  const handleScore = async (challengerScore, challengedScore) => {
    try {
      const updated = await reportChallengeScore(scoring.id, challengerScore, challengedScore);
      setScoring(null);
      if (updated.status === 'completed') {
        addNotification({ type: 'success', title: 'Result confirmed', message: 'Rankings have been updated', duration: 4000 });
        const [matchList] = await Promise.all([getMatches(), getPlayers().then(setPlayers), refreshPlayer()]);
        setMatches(matchList);
      } else {
        addNotification({ type: 'info', title: 'Score reported', message: 'Waiting for your opponent to confirm it', duration: 4000 });
      }
      await loadChallenges();
    } catch (err) {
      throw new Error(errorMessage(err, 'Could not save the score'));
    }
  };

  const incoming = challenges.filter((c) => c.status === 'pending' && c.challenged_id === playerId);
  const outgoing = challenges.filter((c) => c.status === 'pending' && c.challenger_id === playerId);
  const active = challenges.filter((c) => c.status === 'accepted');
  const openWith = new Set(
    challenges
      .filter((c) => c.status === 'pending' || c.status === 'accepted')
      .map((c) => (c.challenger_id === playerId ? c.challenged_id : c.challenger_id))
  );
  const actionCount = incoming.length + active.filter((c) => c.reported_by_id && c.reported_by_id !== playerId).length;

  const q = query.trim().toLowerCase();
  const opponents = players.filter((p) => p.id !== playerId && (!q || p.name.toLowerCase().includes(q)));

  const opponentName = (c) => (c.challenger_id === playerId ? c.challenged_name : c.challenger_name);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Challenges</h1>
        <p className="page-subtitle">Call out any player for a head-to-head game. Results count towards the rankings.</p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {isAuthenticated && (
            <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              My challenges{actionCount > 0 && <span className="tab-count">{actionCount}</span>}
            </button>
          )}
          <button className={`tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>
            Find an opponent
          </button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            Recent results
          </button>
        </div>
        <span className="spacer" />
        <button className="btn-outline" onClick={loadAll}>Refresh</button>
      </div>

      {!isAuthenticated && (
        <div className="notice" style={{ marginBottom: '1.5rem' }}>
          <button className="link-btn" style={{ marginLeft: 0 }} onClick={openLogin}>Log in</button> to challenge players and see your challenges.
        </div>
      )}

      {loading ? (
        <p className="loading">Loading challenges...</p>
      ) : error ? (
        <div className="panel empty-note">
          <p className="error-message">{error}</p>
          <button onClick={loadAll}>Retry</button>
        </div>
      ) : (
        <>
          {tab === 'mine' && isAuthenticated && (
            <>
              <section className="panel">
                <h2 className="panel-title">Waiting for you</h2>
                {incoming.length === 0 && active.length === 0 ? (
                  <p className="muted">Nothing to do right now. Find an opponent and send a challenge.</p>
                ) : (
                  <div className="list">
                    {incoming.map((c) => (
                      <div className="list-row" key={c.id}>
                        <div className="list-row-main">
                          <span className="list-row-title">{c.challenger_name} challenged you</span>
                          <span className="muted">{formatDateTime(c.created_at)}</span>
                        </div>
                        <div className="row-actions">
                          <button className="btn-success btn-small" disabled={busyId === c.id} onClick={() => act(c.id, () => acceptChallenge(c.id), 'Challenge accepted')}>
                            Accept
                          </button>
                          <button className="btn-outline btn-small" disabled={busyId === c.id} onClick={() => act(c.id, () => declineChallenge(c.id), 'Challenge declined')}>
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                    {active.map((c) => {
                      const awaitingMe = c.reported_by_id && c.reported_by_id !== playerId;
                      const awaitingThem = c.reported_by_id === playerId;
                      return (
                        <div className="list-row" key={c.id}>
                          <div className="list-row-main">
                            <span className="list-row-title">vs {opponentName(c)}</span>
                            <span className="muted">
                              {awaitingMe
                                ? `${opponentName(c)} reported ${c.challenger_name} ${c.reported_challenger_score} - ${c.reported_challenged_score} ${c.challenged_name}. Confirm or correct it.`
                                : awaitingThem
                                  ? `You reported ${c.reported_challenger_score} - ${c.reported_challenged_score}. Waiting for ${opponentName(c)} to confirm.`
                                  : 'Accepted. Play your game, then report the score.'}
                            </span>
                          </div>
                          <div className="row-actions">
                            <button className="btn-small" onClick={() => setScoring(c)}>
                              {awaitingMe ? 'Confirm score' : awaitingThem ? 'Change score' : 'Report score'}
                            </button>
                            <button
                              className="btn-outline btn-small"
                              disabled={busyId === c.id}
                              onClick={() => window.confirm(`Call off your game against ${opponentName(c)}?`) && act(c.id, () => cancelChallenge(c.id), 'Challenge called off')}
                            >
                              Call off
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="panel">
                <h2 className="panel-title">Sent by you</h2>
                {outgoing.length === 0 ? (
                  <p className="muted">No challenges waiting on a reply.</p>
                ) : (
                  <div className="list">
                    {outgoing.map((c) => (
                      <div className="list-row" key={c.id}>
                        <div className="list-row-main">
                          <span className="list-row-title">You challenged {c.challenged_name}</span>
                          <span className="muted">Sent {formatDateTime(c.created_at)}. Waiting for a reply.</span>
                        </div>
                        <button className="btn-outline btn-small" disabled={busyId === c.id} onClick={() => act(c.id, () => cancelChallenge(c.id), 'Challenge withdrawn')}>
                          Withdraw
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <h2 className="panel-title">Finished</h2>
                {challenges.filter((c) => !['pending', 'accepted'].includes(c.status)).length === 0 ? (
                  <p className="muted">Your completed, declined and cancelled challenges will show here.</p>
                ) : (
                  <div className="list">
                    {challenges
                      .filter((c) => !['pending', 'accepted'].includes(c.status))
                      .slice(0, 20)
                      .map((c) => (
                        <div className="list-row" key={c.id}>
                          <div className="list-row-main">
                            <span className="list-row-title">
                              {c.challenger_name} vs {c.challenged_name}
                              {c.status === 'completed' && ` · ${c.reported_challenger_score} - ${c.reported_challenged_score}`}
                            </span>
                            <span className="muted">{formatDate(c.completed_at || c.created_at)}</span>
                          </div>
                          <span className={`badge ${c.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          )}

          {tab === 'players' && (
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Players</h2>
                <div className="field" style={{ minWidth: 'min(260px, 100%)' }}>
                  <input placeholder="Search players..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search players" />
                </div>
              </div>
              {opponents.length === 0 ? (
                <p className="muted">{players.length <= 1 ? 'No other players have signed up yet.' : 'No players match your search.'}</p>
              ) : (
                <div className="list">
                  {opponents.map((p) => (
                    <div className="list-row" key={p.id}>
                      <div className="list-row-main">
                        <span className="list-row-title">{p.name}</span>
                        <span className="muted">
                          Rating {Math.round(p.rating)} · {p.matches_won}W / {p.matches_played - p.matches_won}L · {winRate(p)}% win rate
                        </span>
                      </div>
                      {openWith.has(p.id) ? (
                        <span className="badge badge-warning">Challenge open</span>
                      ) : (
                        <button className="btn-small" disabled={busyId === `p${p.id}`} onClick={() => handleChallenge(p)}>
                          Challenge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'history' && (
            <section className="panel">
              <h2 className="panel-title">Recent results</h2>
              {matches.length === 0 ? (
                <p className="muted">No games have been played yet.</p>
              ) : (
                <div className="list">
                  {matches.map((m) => (
                    <div className="list-row" key={m.id}>
                      <div className="list-row-main">
                        <span className="list-row-title">
                          <span className={m.winner_id === m.player_1_id ? 'text-primary' : ''}>{m.player_1_name}</span>
                          {` ${m.player_1_score} - ${m.player_2_score} `}
                          <span className={m.winner_id === m.player_2_id ? 'text-primary' : ''}>{m.player_2_name}</span>
                        </span>
                        <span className="muted">{formatDate(m.played_at)}{m.tournament_name ? ` · ${m.tournament_name}` : ' · Challenge'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {scoring && (
        <MatchResultModal
          title={`${scoring.challenger_name} vs ${scoring.challenged_name}`}
          player1Name={scoring.challenger_name}
          player2Name={scoring.challenged_name}
          initialScores={
            scoring.reported_by_id ? [scoring.reported_challenger_score, scoring.reported_challenged_score] : [0, 0]
          }
          note="Your opponent confirms the score by entering the same numbers. If they enter a different score, you'll be asked to confirm theirs."
          submitLabel={scoring.reported_by_id && scoring.reported_by_id !== playerId ? 'Confirm score' : 'Report score'}
          onClose={() => setScoring(null)}
          onSubmit={handleScore}
        />
      )}
    </div>
  );
}
