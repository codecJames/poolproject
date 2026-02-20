from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("/", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    """Create a new match and determine winner"""
    # Determine winner
    winner_id = None
    if match.player_1_score > match.player_2_score:
        winner_id = match.player_1_id
    elif match.player_2_score > match.player_1_score:
        winner_id = match.player_2_id
    
    # Create match
    db_match = models.Match(**match.dict(), winner_id=winner_id)
    db.add(db_match)
    
    # Update player stats
    player1 = db.query(models.Player).filter(models.Player.id == match.player_1_id).first()
    player2 = db.query(models.Player).filter(models.Player.id == match.player_2_id).first()
    
    if player1:
        player1.matches_played += 1
        if winner_id == player1.id:
            player1.matches_won += 1
    
    if player2:
        player2.matches_played += 1
        if winner_id == player2.id:
            player2.matches_won += 1
    
    db.commit()
    db.refresh(db_match)
    return db_match

@router.get("/", response_model=List[schemas.Match])
def get_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all matches"""
    matches = db.query(models.Match).offset(skip).limit(limit).all()
    return matches

@router.get("/{match_id}", response_model=schemas.Match)
def get_match(match_id: int, db: Session = Depends(get_db)):
    """Get a specific match by ID"""
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
