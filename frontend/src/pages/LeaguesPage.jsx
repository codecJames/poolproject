import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  createTeam,
  deleteLeagueResult,
  errorMessage,
  getLeagueResults,
  getLeagueStandings,
  getLeagues,
  joinTeam,
  leaveTeam,
  recordLeagueResult,
} from '../services/api';
import { formatDate } from '../utils/format';
import '../styles/LeaguesPage.css';

const EMPTY_RESULT = { homeTeamId: '', awayTeamId: '', homeScore: '', awayScore: '' };

export default function LeaguesPage() {
  const { isAuthenticated, userId, openLogin } = useAuth();
  const { addNotification } = useNotification();

  const [leagues, setLeagues] = useState([]);
  const [leagueId, setLeagueId] = useState(null);
  const [standings, setStandings] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [formError, setFormError] = useState('');

  const loadLeague = useCallback(async (id) => {
    const [table, recent] = await Promise.all([getLeagueStandings(id), getLeagueResults(id)]);
    setStandings(table);
    setResults(recent);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const list = await getLeagues();
      setLeagues(list);
      const current = list.find((l) => l.id === leagueId)?.id ?? list[0]?.id ?? null;
      setLeagueId(current);
      if (current) await loadLeague(current);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load leagues.'));
    } finally {
      setLoading(false);
    }
  }, [leagueId, loadLeague]);

  useEffect(() => {
    loadAll();
    // Only on first load; switching leagues calls loadLeague directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchLeague = async (id) => {
    setLeagueId(id);
    setResultForm(EMPTY_RESULT);
    try {
      await loadLeague(id);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load that league.'));
    }
  };

  const run = async (action, successTitle) => {
    setBusy(true);
    setFormError('');
    try {
      await action();
      addNotification({ type: 'success', title: successTitle, duration: 3000 });
      await loadLeague(leagueId);
      return true;
    } catch (err) {
      addNotification({ type: 'error', title: 'Something went wrong', message: errorMessage(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setFormError('Give your team a name');
      return;
    }
    if (await run(() => createTeam(teamName.trim(), leagueId), `${teamName.trim()} registered, you're captain`)) {
      setTeamName('');
    }
  };

  const handleRecordResult = async (e) => {
    e.preventDefault();
    const { homeTeamId, awayTeamId, homeScore, awayScore } = resultForm;
    if (!homeTeamId || !awayTeamId || homeScore === '' || awayScore === '') {
      setFormError('Pick both teams and enter both scores');
      return;
    }
    if (homeTeamId === awayTeamId) {
      setFormError('Pick two different teams');
      return;
    }
    const saved = await run(
      () =>
        recordLeagueResult(leagueId, {
          home_team_id: Number(homeTeamId),
          away_team_id: Number(awayTeamId),
          home_score: Number(homeScore),
          away_score: Number(awayScore),
        }),
      'Result recorded'
    );
    if (saved) setResultForm(EMPTY_RESULT);
  };

  const updateResult = (e) => {
    const { name, value } = e.target;
    setResultForm((prev) => ({ ...prev, [name]: value }));
  };

  const myTeam = standings.find((row) => row.member_ids.includes(userId));
  const league = leagues.find((l) => l.id === leagueId);
  const teamsByName = [...standings].sort((a, b) => a.team_name.localeCompare(b.team_name));

  if (loading) {
    return <div className="page-container"><p className="loading">Loading leagues...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="panel empty-note">
          <p className="error-message">{error}</p>
          <button onClick={loadAll}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Leagues</h1>
        <p className="page-subtitle">{league ? `${league.name} · ${league.season} season` : 'Team competition and standings'}</p>
      </div>

      {leagues.length > 1 && (
        <div className="toolbar">
          <div className="field">
            <label htmlFor="league-select">League</label>
            <select id="league-select" value={leagueId ?? ''} onChange={(e) => switchLeague(Number(e.target.value))}>
              {leagues.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
            </select>
          </div>
        </div>
      )}

      {!league ? (
        <div className="panel empty-note"><h2>No leagues yet</h2></div>
      ) : (
        <div className="leagues-container">
          <section className="league-table-section">
            <div className="section-header">
              <h2>Standings</h2>
              <span className="team-count">{standings.length} teams</span>
            </div>

            {!isAuthenticated ? (
              <div className="notice" style={{ marginBottom: '1rem' }}>
                <button className="link-btn" style={{ marginLeft: 0 }} onClick={openLogin}>Log in</button> to join a team and record results.
              </div>
            ) : myTeam ? (
              <div className="notice notice-warning" style={{ marginBottom: '1rem' }}>
                You play for <strong>{myTeam.team_name}</strong>{myTeam.captain_id === userId ? ' (captain)' : ''}.
              </div>
            ) : (
              <div className="notice" style={{ marginBottom: '1rem' }}>
                Join your residence team below, or register a new team.
              </div>
            )}

            <div className="table-wrapper">
              <table className="league-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>Captain</th>
                    <th className="points-col">P</th>
                    <th className="points-col">W</th>
                    <th className="points-col">D</th>
                    <th className="points-col">L</th>
                    <th className="points-col">Frames</th>
                    <th className="points-col">Pts</th>
                    {isAuthenticated && <th aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => {
                    const mine = row.team_id === myTeam?.team_id;
                    return (
                      <tr key={row.team_id} className={row.played > 0 && index < 3 ? `rank-${index + 1}` : ''}>
                        <td className="position" data-label="Pos">{index + 1}</td>
                        <td className="team-name" data-label="Team">
                          {row.team_name}
                          <span className="muted" style={{ display: 'block', fontFamily: 'inherit', fontWeight: 400, fontSize: '0.8rem' }}>
                            {row.member_ids.length} player{row.member_ids.length === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="captain" data-label="Captain">{row.captain_name || 'Vacant'}</td>
                        <td className="players" data-label="Played">{row.played}</td>
                        <td className="wins" data-label="Won">{row.wins}</td>
                        <td className="draws" data-label="Drawn">{row.draws}</td>
                        <td className="losses" data-label="Lost">{row.losses}</td>
                        <td className="players" data-label="Frames">{row.frames_for}-{row.frames_against}</td>
                        <td className="points" data-label="Points"><span className="points-badge">{row.points}</span></td>
                        {isAuthenticated && (
                          <td data-label="">
                            {mine ? (
                              <button className="btn-outline btn-small" disabled={busy} onClick={() => run(() => leaveTeam(row.team_id), `You left ${row.team_name}`)}>
                                Leave
                              </button>
                            ) : !myTeam ? (
                              <button className="btn-small" disabled={busy} onClick={() => run(() => joinTeam(row.team_id), `You joined ${row.team_name}`)}>
                                Join
                              </button>
                            ) : null}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="scoring-info">
              <h3>Scoring</h3>
              <div className="scoring-grid">
                <div className="score-item">
                  <span className="score-icon">W</span>
                  <div><span className="score-label">Win</span><span className="score-value">3 points</span></div>
                </div>
                <div className="score-item">
                  <span className="score-icon">D</span>
                  <div><span className="score-label">Draw</span><span className="score-value">1 point</span></div>
                </div>
                <div className="score-item">
                  <span className="score-icon">L</span>
                  <div><span className="score-label">Loss</span><span className="score-value">0 points</span></div>
                </div>
              </div>
              <p className="muted" style={{ marginTop: '1rem' }}>Ties on points are split by frame difference, then wins.</p>
            </div>
          </section>

          {isAuthenticated && (
            <div className="grid grid-2">
              <form className="register-team-section" onSubmit={handleRecordResult}>
                <div className="section-header"><h2>Record a result</h2></div>
                {formError && <div className="error-message" style={{ marginBottom: '1rem' }}>{formError}</div>}
                <div className="versus">
                  <div className="field">
                    <label htmlFor="home-team">Home team</label>
                    <select id="home-team" name="homeTeamId" value={resultForm.homeTeamId} onChange={updateResult}>
                      <option value="">Choose...</option>
                      {teamsByName.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                    </select>
                    <input className="score-input" name="homeScore" type="number" min="0" max="99" inputMode="numeric" placeholder="0" value={resultForm.homeScore} onChange={updateResult} aria-label="Home frames" />
                  </div>
                  <span className="versus-sep">vs</span>
                  <div className="field">
                    <label htmlFor="away-team">Away team</label>
                    <select id="away-team" name="awayTeamId" value={resultForm.awayTeamId} onChange={updateResult}>
                      <option value="">Choose...</option>
                      {teamsByName.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                    </select>
                    <input className="score-input" name="awayScore" type="number" min="0" max="99" inputMode="numeric" placeholder="0" value={resultForm.awayScore} onChange={updateResult} aria-label="Away frames" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={busy}>Save result</button>
                </div>
              </form>

              <form className="register-team-section" onSubmit={handleCreateTeam}>
                <div className="section-header"><h2>Register a new team</h2></div>
                <div className="field">
                  <label htmlFor="team-name">Team name</label>
                  <input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Breakers" maxLength={80} disabled={!!myTeam} />
                </div>
                <p className="muted" style={{ marginTop: '0.75rem' }}>
                  {myTeam ? 'Leave your current team first to start a new one.' : "You'll be the captain; other players can join from the table."}
                </p>
                <div className="form-actions">
                  <button type="submit" disabled={busy || !!myTeam}>Register team</button>
                </div>
              </form>
            </div>
          )}

          <section className="league-table-section">
            <div className="section-header"><h2>Recent results</h2></div>
            {results.length === 0 ? (
              <p className="muted">No results recorded yet this season.</p>
            ) : (
              <div className="list">
                {results.map((r) => (
                  <div className="list-row" key={r.id}>
                    <div className="list-row-main">
                      <span className="list-row-title">
                        {r.home_team_name} {r.home_score} - {r.away_score} {r.away_team_name}
                      </span>
                      <span className="muted">{formatDate(r.played_at)} · recorded by {r.recorded_by_name}</span>
                    </div>
                    {r.recorded_by_id === userId && (
                      <button
                        className="btn-outline btn-small"
                        disabled={busy}
                        onClick={() => window.confirm('Remove this result from the table?') && run(() => deleteLeagueResult(leagueId, r.id), 'Result removed')}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
