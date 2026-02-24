import { useState } from 'react';
import '../styles/MatchResultModal.css';

export default function MatchResultModal({ match, onClose, onSubmit }) {
  const [player1, setPlayer1] = useState(match.player1_score || 0);
  const [player2, setPlayer2] = useState(match.player2_score || 0);
  const [winner, setWinner] = useState(match.winner_id || null);

  const submit = (e) => {
    e.preventDefault();
    const winnerId = parseInt(winner, 10) || (player1 > player2 ? match.player1_id : match.player2_id);
    onSubmit({ player1: parseInt(player1, 10), player2: parseInt(player2, 10), winner: winnerId });
  };

  return (
    <div className="modal-small" onClick={onClose}>
      <div className="modal-small-content" onClick={(e) => e.stopPropagation()}>
        <h3>Submit Match Result</h3>
        <form onSubmit={submit}>
          <div className="score-row">
            <label>{match.player1?.full_name || 'Player 1'}</label>
            <input type="number" value={player1} onChange={(e)=>setPlayer1(e.target.value)} min="0" />
          </div>
          <div className="score-row">
            <label>{match.player2?.full_name || 'Player 2'}</label>
            <input type="number" value={player2} onChange={(e)=>setPlayer2(e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label>Winner (optional)</label>
            <select value={winner || ''} onChange={(e)=>setWinner(e.target.value)}>
              <option value="">Auto (higher score)</option>
              {match.player1_id && <option value={match.player1_id}>{match.player1?.full_name}</option>}
              {match.player2_id && <option value={match.player2_id}>{match.player2?.full_name}</option>}
            </select>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
