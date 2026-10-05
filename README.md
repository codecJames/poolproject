# UCT Supa Pool

Club management for the UCT pool club: player rankings, head-to-head challenges, knockout tournaments and a residence league.

- **Frontend:** React 19 + Vite (`frontend/`)
- **API:** FastAPI + SQLAlchemy (`app/`), served under `/api`
- **Database:** Postgres in production (`DATABASE_URL`), SQLite file locally
- **Hosting:** Vercel. The Vite build is served as static files and `api/index.py` runs the FastAPI app as a Python function

## Features

- **Accounts:** sign up or log in; every account gets a ranking profile. Sessions use JWTs (7 days).
- **Rankings:** Elo ratings (start at 1000), wins, games played and win rate, updated after every confirmed game.
- **Challenges:** challenge any player. The opponent accepts, one player reports the score, and it counts once the other player confirms the same score.
- **Tournaments:** single elimination with random seeding. Byes pad the bracket to a power of two. The organiser starts the event; the players or the organiser report results and later rounds are drawn automatically.
- **Leagues:** a seeded Residence League with one team per residence. Join a team (one per league) or register a new one, and record team results. Standings are calculated from results: 3 points for a win, 1 for a draw, ties split by frame difference.
- **Clubs and Shop:** club directory, plus a catalogue with an order list to send to the committee (no online payments).

## Local development

Requires Python 3.11+ and Node 20+.

```bash
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the API on port 8000. API docs are at http://localhost:8000/api/docs.

The API creates `supa_pool.db` on first run and seeds the residence clubs, league and teams.

### Tests

```bash
pytest
```

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | Postgres connection string (set automatically by the Neon integration on Vercel) |
| `SECRET_KEY` | Production | Signs login tokens. Required on Vercel; use a long random string |
| `CORS_ORIGINS` | Optional | Extra comma-separated origins allowed to call the API from another domain |

## Deployment

The repository is linked to a Vercel project. `vercel.json` builds the frontend and routes `/api/*` to the FastAPI function, with every other path served by the single-page app.

```bash
vercel deploy --prod
```

Tables are created and default data is seeded automatically on the first request.
