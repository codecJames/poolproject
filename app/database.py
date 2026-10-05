import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool


def _database_url() -> str:
    """Postgres in production (DATABASE_URL), a local SQLite file otherwise."""
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        return "sqlite:///./supa_pool.db"
    # Hosted providers hand out postgres:// URLs; SQLAlchemy needs the driver named
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


SQLALCHEMY_DATABASE_URL = _database_url()

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
    )
else:
    # Serverless functions come and go, so don't hold a pool open; the provider's
    # pooler does that. Prepared statements are disabled because transaction-mode
    # poolers can route consecutive statements to different backends.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
