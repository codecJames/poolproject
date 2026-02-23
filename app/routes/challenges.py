from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/challenges", tags=["challenges"])

@router.post("/", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    """Create a new challenge"""
    # Verify both players exist
    challenger = db.query(models.Player).filter(models.Player.id == challenge.challenger_id).first()
    challenged = db.query(models.Player).filter(models.Player.id == challenge.challenged_id).first()
    
    if not challenger or not challenged:
        raise HTTPException(status_code=404, detail="One or both players not found")
    
    if challenger.id == challenged.id:
        raise HTTPException(status_code=400, detail="Cannot challenge yourself")
    
    # Create challenge
    db_challenge = models.Challenge(
        challenger_id=challenge.challenger_id,
        challenged_id=challenge.challenged_id,
        challenge_amount=challenge.challenge_amount,
        status="pending"
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

@router.get("/", response_model=List[schemas.ChallengeWithPlayers])
def get_challenges(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    """Get all challenges, optionally filtered by status"""
    query = db.query(models.Challenge)
    
    if status:
        query = query.filter(models.Challenge.status == status)
    
    challenges = query.offset(skip).limit(limit).all()
    
    # Enrich with player names
    result = []
    for challenge in challenges:
        result.append({
            **schemas.Challenge.from_orm(challenge).dict(),
            "challenger_name": challenge.challenger.name,
            "challenged_name": challenge.challenged.name
        })
    
    return result

@router.get("/for/{player_id}", response_model=List[schemas.ChallengeWithPlayers])
def get_challenges_for_player(player_id: int, status: str = None, db: Session = Depends(get_db)):
    """Get all challenges for a specific player"""
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get challenges where player is either challenger or challenged
    query = db.query(models.Challenge).filter(
        (models.Challenge.challenger_id == player_id) | (models.Challenge.challenged_id == player_id)
    )
    
    if status:
        query = query.filter(models.Challenge.status == status)
    
    challenges = query.all()
    
    # Enrich with player names
    result = []
    for challenge in challenges:
        result.append({
            **schemas.Challenge.from_orm(challenge).dict(),
            "challenger_name": challenge.challenger.name,
            "challenged_name": challenge.challenged.name
        })
    
    return result

@router.get("/{challenge_id}", response_model=schemas.Challenge)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    """Get a specific challenge by ID"""
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.put("/{challenge_id}/accept", response_model=schemas.Challenge)
def accept_challenge(challenge_id: int, db: Session = Depends(get_db)):
    """Accept a challenge"""
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="Challenge is not pending")
    
    challenge.status = "accepted"
    challenge.accepted_at = datetime.utcnow()
    
    # Create a challenge result record to track the match
    result = models.ChallengeResult(
        challenge_id=challenge.id,
        challenger_score=0,
        challenged_score=0,
        challenger_confirmed=False,
        challenged_confirmed=False
    )
    db.add(result)
    
    db.commit()
    db.refresh(challenge)
    return challenge

@router.put("/{challenge_id}/decline", response_model=schemas.Challenge)
def decline_challenge(challenge_id: int, db: Session = Depends(get_db)):
    """Decline a challenge"""
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="Challenge is not pending")
    
    challenge.status = "declined"
    db.commit()
    db.refresh(challenge)
    return challenge

@router.post("/{challenge_id}/result", response_model=schemas.ChallengeResult)
def submit_challenge_result(
    challenge_id: int,
    result_data: schemas.ChallengeResultUpdate,
    db: Session = Depends(get_db)
):
    """Submit challenge result scores"""
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.status != "accepted":
        raise HTTPException(status_code=400, detail="Challenge is not accepted")
    
    # Get or create challenge result
    result = db.query(models.ChallengeResult).filter(
        models.ChallengeResult.challenge_id == challenge_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Challenge result not found")
    
    # Verify the player is part of this challenge
    if result_data.player_id not in [challenge.challenger_id, challenge.challenged_id]:
        raise HTTPException(status_code=400, detail="Player is not part of this challenge")
    
    # Update scores based on which player submitted
    if result_data.player_id == challenge.challenger_id:
        if result_data.challenger_score is not None:
            result.challenger_score = result_data.challenger_score
        result.challenger_confirmed = True
    else:
        if result_data.challenged_score is not None:
            result.challenged_score = result_data.challenged_score
        result.challenged_confirmed = True
    
    # If both players confirmed, create the match
    if result.challenger_confirmed and result.challenged_confirmed:
        challenge.status = "completed"
        result.completed_at = datetime.utcnow()
        
        # Determine winner
        winner_id = None
        if result.challenger_score > result.challenged_score:
            winner_id = challenge.challenger_id
        elif result.challenged_score > result.challenger_score:
            winner_id = challenge.challenged_id
        
        # Create match record
        match = models.Match(
            player_1_id=challenge.challenger_id,
            player_2_id=challenge.challenged_id,
            player_1_score=result.challenger_score,
            player_2_score=result.challenged_score,
            winner_id=winner_id,
            money_wagered=challenge.challenge_amount,
            tournament_id=None
        )
        db.add(match)
        
        # Update player stats
        challenger_player = db.query(models.Player).filter(models.Player.id == challenge.challenger_id).first()
        challenged_player = db.query(models.Player).filter(models.Player.id == challenge.challenged_id).first()
        
        if challenger_player:
            challenger_player.matches_played += 1
            if winner_id == challenger_player.id:
                challenger_player.matches_won += 1
        
        if challenged_player:
            challenged_player.matches_played += 1
            if winner_id == challenged_player.id:
                challenged_player.matches_won += 1
        
        db.flush()
        db.refresh(match)
        result.match_id = match.id
    
    db.commit()
    db.refresh(result)
    return result

@router.get("/{challenge_id}/result", response_model=schemas.ChallengeResult)
def get_challenge_result(challenge_id: int, db: Session = Depends(get_db)):
    """Get challenge result"""
    result = db.query(models.ChallengeResult).filter(
        models.ChallengeResult.challenge_id == challenge_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Challenge result not found")
    
    return result
