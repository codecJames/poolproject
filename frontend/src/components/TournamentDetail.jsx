import { useEffect, useState, useRef } from 'react';
import { getTournament, getTournamentBrackets, updateMatchResult } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import MatchResultModal from './MatchResultModal';
import '../styles/TournamentDetail.css';

export default function TournamentDetail({ tournamentId, onClose }) {
  const { userId, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const [tournament, setTournament] = useState(null);
  const [brackets, setBrackets] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchDetails();
    // open websocket
    const ws = new WebSocket(`ws://localhost:8000/tournaments/ws/${tournamentId}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'new_round') {
          fetchBrackets();
          addNotification({ type: 'info', title: 'Bracket updated', message: `Round ${data.round} created` });
        }
      } catch (err) {
        // ignore
      }
    };
    wsRef.current = ws;
    return () => {
      try { ws.close(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const t = await getTournament(tournamentId);
      setTournament(t);
      await fetchBrackets();
    } catch (err) {
      addNotification({ type: 'error', title: 'Load failed', message: 'Could not load tournament' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrackets = async () => {
    try {
      const data = await getTournamentBrackets(tournamentId);
      setBrackets(data);
    } catch (err) {
      // no brackets yet
      setBrackets({});
    }
  };

  const openMatchModal = (match) => {
    if (!isAuthenticated) {
      addNotification({ type: 'error', title: 'Please log in', message: 'You must log in to submit results' });
      return;
    }
    setSelectedMatch(match);
  };

  const handleSubmitResult = async (matchId, scores) => {
    try {
      const payload = { player1_score: scores.player1, player2_score: scores.player2, winner_id: scores.winner };
      await updateMatchResult(tournamentId, matchId, payload, userId);
      addNotification({ type: 'success', title: 'Result submitted', message: 'Match updated' });
      setSelectedMatch(null);
      fetchBrackets();
    } catch (err) {
      addNotification({ type: 'error', title: 'Submit failed', message: err.response?.data?.detail || 'Could not submit result' });
    }
  };

  if (loading) return <div className="modal"><div className="modal-content">Loading...</div></div>;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{tournament.name}</h2>
        <p className="subtitle">{tournament.rules}</p>

        <div className="bracket-container">
          {Object.keys(brackets).length === 0 ? (
            <p>No bracket yet.</p>
          ) : (
            Object.keys(brackets).sort((a,b)=>a-b).map(roundKey => (
              <div className="bracket-column" key={roundKey}>
                <h3>Round {roundKey}</h3>
                {brackets[roundKey].map(match => (
                  <div key={match.id} className={`bracket-match ${match.completed ? 'completed' : ''}`} onClick={() => openMatchModal(match)}>
                    <div className="player">{match.player1?.full_name || 'TBD'}</div>
                    <div className="vs">vs</div>
                    <div className="player">{match.player2?.full_name || 'TBD'}</div>
                    <div className="score">{match.player1_score} - {match.player2_score}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {selectedMatch && (
          <MatchResultModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onSubmit={(scores) => handleSubmitResult(selectedMatch.id, scores)}
          />
        )}
      </div>
    </div>
  );
}
