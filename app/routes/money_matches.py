from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/money-matches", tags=["money-matches"])

@router.post("/", response_model=schemas.MoneyMatch)
def create_money_match(match: schemas.MoneyMatchCreate, db: Session = Depends(get_db)):
    """Create a new money match"""
    # Verify both players exist
    player1 = db.query(models.Player).filter(models.Player.id == match.player_1_id).first()
    player2 = db.query(models.Player).filter(models.Player.id == match.player_2_id).first()
    
    if not player1 or not player2:
        raise HTTPException(status_code=404, detail="One or both players not found")
    
    # Determine winner
    winner_id = None
    if match.player_1_score > match.player_2_score:
        winner_id = match.player_1_id
    elif match.player_2_score > match.player_1_score:
        winner_id = match.player_2_id
    
    # Create match
    db_match = models.Match(
        player_1_id=match.player_1_id,
        player_2_id=match.player_2_id,
        player_1_score=match.player_1_score,
        player_2_score=match.player_2_score,
        money_wagered=match.money_wagered,
        winner_id=winner_id,
        tournament_id=None
    )
    db.add(db_match)
    
    # Update player stats
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

@router.get("/", response_model=List[schemas.MoneyMatch])
def get_money_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all money matches"""
    matches = db.query(models.Match).filter(
        models.Match.tournament_id == None,
        models.Match.money_wagered > 0
    ).offset(skip).limit(limit).all()
    return matches

@router.get("/{match_id}", response_model=schemas.MoneyMatch)
def get_money_match(match_id: int, db: Session = Depends(get_db)):
    """Get a specific money match by ID"""
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Money match not found")
    return match

@router.get("/leaderboard")
def get_money_match_leaderboard(db: Session = Depends(get_db)):
    """Get money match leaderboard - top earners"""
    # Get all money matches
    matches = db.query(models.Match).filter(
        models.Match.money_wagered > 0
    ).all()
    
    # Calculate earnings per player
    earnings = {}
    for match in matches:
        if match.winner_id not in earnings:
            earnings[match.winner_id] = 0
        earnings[match.winner_id] += match.money_wagered
    
    # Get player details and sort by earnings
    leaderboard = []
    for player_id, money in sorted(earnings.items(), key=lambda x: x[1], reverse=True):
        player = db.query(models.Player).filter(models.Player.id == player_id).first()
        if player:
            leaderboard.append({
                "player_id": player.id,
                "player_name": player.name,
                "total_winnings": money,
                "matches_won": sum(1 for m in matches if m.winner_id == player_id)
            })
    
    return leaderboard
