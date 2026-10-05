import os

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routes import challenges, clubs, leagues, matches, players, teams, tournaments, users
from app.seed import seed_defaults

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_defaults(db)

app = FastAPI(
    title="UCT Supa Pool API",
    description="Pool club tournament and player management system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

# The deployed site serves the API from the same origin; these cover local dev servers
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
]
cors_origins += [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
for module in (users, players, clubs, leagues, teams, tournaments, matches, challenges):
    api.include_router(module.router)


@api.get("")
def root():
    return {"message": "Welcome to UCT Supa Pool API", "docs": "/api/docs", "version": "1.0.0"}


@api.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(api)
