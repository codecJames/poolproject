import { useEffect, useState } from 'react';
import { matchService } from '../services/api';

function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        matchService.getAll()
            .then((res) => setMatches(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="page-message">Loading matches…</p>;

    return (
        <section className="page">
            <h1>Matches</h1>
            {matches.length === 0 ? (
                <p className="page-message">No matches recorded yet.</p>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Player 1</th>
                                <th>Score</th>
                                <th>Player 2</th>
                                <th>Score</th>
                                <th>Wagered</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.player_1_id}</td>
                                    <td>{m.player_1_score}</td>
                                    <td>{m.player_2_id}</td>
                                    <td>{m.player_2_score}</td>
                                    <td>R{m.money_wagered}</td>
                                    <td>{new Date(m.played_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default Matches;
