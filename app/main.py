from fastapi import FastAPI
from app.database import engine, Base
from app.routes import players, tournaments, matches, auth

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="UCT Supa Pool API",
    description="Pool club tournament and player management system",
    version="1.0.0"
)

# Include routers
app.include_router(auth.router)
app.include_router(players.router)
app.include_router(tournaments.router)
app.include_router(matches.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to UCT Supa Pool API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
