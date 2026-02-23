from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/leagues", tags=["leagues"])

@router.post("/", response_model=schemas.League)
def create_league(league: schemas.LeagueCreate, db: Session = Depends(get_db)):
    """Create a new league"""
    # Verify club exists
    club = db.query(models.Club).filter(models.Club.id == league.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    db_league = models.League(**league.dict())
    db.add(db_league)
    db.commit()
    db.refresh(db_league)
    return db_league

@router.get("/", response_model=List[schemas.League])
def get_leagues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all leagues"""
    leagues = db.query(models.League).offset(skip).limit(limit).all()
    return leagues

@router.get("/{league_id}", response_model=schemas.League)
def get_league(league_id: int, db: Session = Depends(get_db)):
    """Get a specific league by ID"""
    league = db.query(models.League).filter(models.League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    return league

@router.get("/{league_id}/standings", response_model=List[schemas.TeamWithMembers])
def get_league_standings(league_id: int, db: Session = Depends(get_db)):
    """Get league standings (teams sorted by points)"""
    league = db.query(models.League).filter(models.League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    teams = db.query(models.Team).filter(models.Team.league_id == league_id).order_by(models.Team.points.desc()).all()
    return teams

@router.put("/{league_id}", response_model=schemas.League)
def update_league(league_id: int, league: schemas.LeagueCreate, db: Session = Depends(get_db)):
    """Update a league"""
    db_league = db.query(models.League).filter(models.League.id == league_id).first()
    if not db_league:
        raise HTTPException(status_code=404, detail="League not found")
    
    for key, value in league.dict().items():
        setattr(db_league, key, value)
    
    db.commit()
    db.refresh(db_league)
    return db_league

@router.delete("/{league_id}")
def delete_league(league_id: int, db: Session = Depends(get_db)):
    """Delete a league"""
    db_league = db.query(models.League).filter(models.League.id == league_id).first()
    if not db_league:
        raise HTTPException(status_code=404, detail="League not found")
    
    db.delete(db_league)
    db.commit()
    return {"message": "League deleted successfully"}
