import { useEffect, useState } from 'react';
import { tournamentService } from '../services/api';

function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        tournamentService.getAll()
            .then((res) => setTournaments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="page-message">Loading tournaments…</p>;

    return (
        <section className="page">
            <h1>Tournaments</h1>
            {tournaments.length === 0 ? (
                <p className="page-message">No tournaments yet.</p>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Date</th>
                                <th>Entry Fee</th>
                                <th>Prize Pool</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tournaments.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.name}</td>
                                    <td>{t.location}</td>
                                    <td>{new Date(t.start_date).toLocaleDateString()}</td>
                                    <td>R{t.entry_fee}</td>
                                    <td>R{t.prize_pool}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default Tournaments;
