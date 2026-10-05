import os
import sys
import tempfile
from pathlib import Path

import pytest

# Point the app at a throwaway SQLite file before it is imported
_db_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_db_dir) / 'test.db'}"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_defaults  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_defaults(db)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def signup(client):
    """Create an account and return (auth headers, response body)."""
    counter = {"n": 0}

    def _signup(name=None):
        counter["n"] += 1
        name = name or f"Player {counter['n']}"
        response = client.post(
            "/api/users/signup",
            json={"full_name": name, "email": f"p{counter['n']}@example.com", "password": "secret123"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        return {"Authorization": f"Bearer {body['token']}"}, body

    return _signup
