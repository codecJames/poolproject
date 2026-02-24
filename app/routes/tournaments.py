from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.utils.tournament_utils import generate_bracket
from app.utils.ws_manager import WSManager
from datetime import datetime
import math

# WebSocket manager for tournament updates
ws_manager = WSManager()

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

# generate_bracket moved to app.utils.tournament_utils

@router.post("/", response_model=schemas.Tournament)
def create_tournament(
    tournament: schemas.TournamentCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Create a new tournament"""
    db_tournament = models.Tournament(
        name=tournament.name,
        rules=tournament.rules,
        is_public=tournament.is_public,
        max_players=tournament.max_players,
        status="registration",
        created_by_id=user_id
    )
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@router.get("/", response_model=List[schemas.Tournament])
def get_tournaments(
    public_only: bool = True,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get tournaments (filtered by public status and optional status)"""
    query = db.query(models.Tournament)
    
    if public_only:
        query = query.filter(models.Tournament.is_public == True)
    
    if status:
        query = query.filter(models.Tournament.status == status)
    
    tournaments = query.offset(skip).limit(limit).all()
    return tournaments

@router.get("/my", response_model=List[schemas.Tournament])
def get_my_tournaments(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get tournaments created by the user"""
    tournaments = db.query(models.Tournament).filter(
        models.Tournament.created_by_id == user_id
    ).all()
    return tournaments

@router.get("/{tournament_id}", response_model=schemas.TournamentDetail)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Get a specific tournament with all details"""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    return tournament

@router.post("/{tournament_id}/register")
def register_for_tournament(
    tournament_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Register a user for a tournament"""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="Tournament registration is closed")
    
    # Check if user is already registered
    existing = db.query(models.TournamentRegistration).filter(
        models.TournamentRegistration.tournament_id == tournament_id,
        models.TournamentRegistration.user_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already registered for this tournament")
    
    # Check max players
    registration_count = db.query(models.TournamentRegistration).filter(
        models.TournamentRegistration.tournament_id == tournament_id
    ).count()
    
    if registration_count >= tournament.max_players:
        raise HTTPException(status_code=400, detail="Tournament is full")
    
    registration = models.TournamentRegistration(
        tournament_id=tournament_id,
        user_id=user_id
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    
    return {"message": "Successfully registered for tournament", "registration_id": registration.id}

@router.post("/{tournament_id}/unregister")
def unregister_from_tournament(
    tournament_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Unregister a user from a tournament"""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="Cannot unregister after tournament has started")
    
    registration = db.query(models.TournamentRegistration).filter(
        models.TournamentRegistration.tournament_id == tournament_id,
        models.TournamentRegistration.user_id == user_id
    ).first()
    
    if not registration:
        raise HTTPException(status_code=404, detail="User not registered for this tournament")
    
    db.delete(registration)
    db.commit()
    
    return {"message": "Successfully unregistered from tournament"}

@router.post("/{tournament_id}/start")
def start_tournament(
    tournament_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Start the tournament and generate bracket"""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if tournament.created_by_id != user_id:
        raise HTTPException(status_code=403, detail="Only tournament creator can start the tournament")
    
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="Tournament has already started")
    
    # Get all registered players
    registrations = db.query(models.TournamentRegistration).filter(
        models.TournamentRegistration.tournament_id == tournament_id
    ).all()
    
    if len(registrations) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players to start tournament")
    
    players = [reg.user for reg in registrations]
    
    # Generate bracket (rounds)
    rounds = generate_bracket(players)

    # Create match records from rounds
    for round_num, matches in enumerate(rounds, start=1):
        for pos, m in enumerate(matches, start=1):
            match = models.TournamentMatch(
                tournament_id=tournament_id,
                round_number=round_num,
                match_position=pos,
                player1_id=m.get('player1_id'),
                player2_id=m.get('player2_id'),
                player1_score=0,
                player2_score=0,
                completed=False
            )
            db.add(match)
    
    # Update tournament status
    tournament.status = "in_progress"
    tournament.start_date = datetime.utcnow()
    tournament.bracket_data = {'total_rounds': len(rounds)}
    # notify via websocket
    try:
        import asyncio
        asyncio.create_task(ws_manager.broadcast(tournament_id, {'type': 'tournament_started', 'total_rounds': len(rounds)}))
    except Exception:
        pass
    
    db.commit()
    db.refresh(tournament)
    
    return {"message": "Tournament started successfully", "total_rounds": tournament.bracket_data['total_rounds']}

@router.put("/{tournament_id}/matches/{match_id}")
def update_match_result(
    tournament_id: int,
    match_id: int,
    result: schemas.TournamentMatchUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Update match result"""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    match = db.query(models.TournamentMatch).filter(
        models.TournamentMatch.id == match_id,
        models.TournamentMatch.tournament_id == tournament_id
    ).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is one of the players
    if user_id != match.player1_id and user_id != match.player2_id:
        raise HTTPException(status_code=403, detail="Only match participants can update results")
    
    # Update match
    match.player1_score = result.player1_score
    match.player2_score = result.player2_score
    match.winner_id = result.winner_id
    match.completed = True
    
    db.commit()
    db.refresh(match)
    
    # Check if all matches in current round are completed
    current_round = match.round_number
    all_matches = db.query(models.TournamentMatch).filter(
        models.TournamentMatch.tournament_id == tournament_id,
        models.TournamentMatch.round_number == current_round
    ).all()
    
    if all(m.completed for m in all_matches):
        # Create next round matches
        winners = [m.winner_id for m in all_matches]
        if len(winners) > 1 and current_round < tournament.bracket_data.get('total_rounds', 10):
            # Generate next round
            next_round_matches = []
            for i in range(0, len(winners), 2):
                if i + 1 < len(winners):
                    next_match = {
                        'tournament_id': tournament_id,
                        'round_number': current_round + 1,
                        'match_position': len(next_round_matches) + 1,
                        'player1_id': winners[i],
                        'player2_id': winners[i + 1],
                        'completed': False
                    }
                    next_round_matches.append(next_match)
                elif len(winners) == 1:
                    # Tournament complete
                    tournament.status = "completed"
                    tournament.bracket_data['winner_id'] = winners[0]
            
            for match_data in next_round_matches:
                next_match = models.TournamentMatch(**match_data)
                db.add(next_match)
            
            db.commit()
            # Broadcast that new matches were created for next round
            try:
                import asyncio
                asyncio.create_task(ws_manager.broadcast(tournament_id, {
                    'type': 'new_round',
                    'round': current_round + 1
                }))
            except Exception:
                pass
    
    return {"message": "Match result updated successfully"}

@router.get("/{tournament_id}/brackets")
def get_tournament_brackets(tournament_id: int, db: Session = Depends(get_db)):
    """Get all bracket matches for a tournament"""
    matches = db.query(models.TournamentMatch).filter(
        models.TournamentMatch.tournament_id == tournament_id
    ).order_by(
        models.TournamentMatch.round_number,
        models.TournamentMatch.match_position
    ).all()
    
    if not matches:
        raise HTTPException(status_code=404, detail="No matches found for this tournament")
    
    # Organize by round
    brackets = {}
    for match in matches:
        round_num = match.round_number
        if round_num not in brackets:
            brackets[round_num] = []
        brackets[round_num].append(match)
    
    return brackets


@router.websocket('/ws/{tournament_id}')
async def tournament_ws(websocket, tournament_id: int):
    """WebSocket endpoint for tournament updates"""
    try:
        await ws_manager.connect(int(tournament_id), websocket)
        while True:
            # keep connection alive; server will push updates
            data = await websocket.receive_text()
            # ignore incoming messages
    except Exception:
        pass
    finally:
        try:
            await ws_manager.disconnect(int(tournament_id), websocket)
        except Exception:
            pass
