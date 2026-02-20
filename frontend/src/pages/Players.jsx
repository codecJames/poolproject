import { useEffect, useState } from 'react';
import { playerService } from '../services/api';

function Players() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        playerService.getAll()
            .then((res) => setPlayers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="page-message">Loading players…</p>;

    return (
        <section className="page">
            <h1>Players</h1>
            {players.length === 0 ? (
                <p className="page-message">No players found. Add one to get started!</p>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>University</th>
                                <th>Rating</th>
                                <th>Played</th>
                                <th>Won</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.university}</td>
                                    <td>{p.rating}</td>
                                    <td>{p.matches_played}</td>
                                    <td>{p.matches_won}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default Players;
