import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    return (
        <section className="home">
            <div className="hero">
                <h1 className="hero__title">
                    UCT Supa Pool
                </h1>
                <p className="hero__subtitle">
                    Tournament &amp; player management for the club
                </p>

                <div className="hero__cards">
                    <Link to="/players" className="card">
                        <span className="card__icon">🎱</span>
                        <h2>Players</h2>
                        <p>View and manage player profiles</p>
                    </Link>

                    <Link to="/tournaments" className="card">
                        <span className="card__icon">🏆</span>
                        <h2>Tournaments</h2>
                        <p>Browse upcoming &amp; past tournaments</p>
                    </Link>

                    <Link to="/matches" className="card">
                        <span className="card__icon">📊</span>
                        <h2>Matches</h2>
                        <p>Track match results &amp; stats</p>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default Home;
