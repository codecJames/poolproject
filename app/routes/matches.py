from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=List[schemas.Match])
def get_matches(player_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    """Recent completed games from challenges and tournaments"""
    query = db.query(models.Match).options(
        selectinload(models.Match.player1),
        selectinload(models.Match.player2),
        selectinload(models.Match.tournament),
    )
    if player_id is not None:
        query = query.filter((models.Match.player_1_id == player_id) | (models.Match.player_2_id == player_id))
    matches = query.order_by(models.Match.played_at.desc(), models.Match.id.desc()).limit(min(limit, 200)).all()
    return [
        {
            "id": m.id,
            "player_1_id": m.player_1_id,
            "player_1_name": m.player1.name,
            "player_2_id": m.player_2_id,
            "player_2_name": m.player2.name,
            "player_1_score": m.player_1_score,
            "player_2_score": m.player_2_score,
            "winner_id": m.winner_id,
            "tournament_id": m.tournament_id,
            "tournament_name": m.tournament.name if m.tournament else None,
            "played_at": m.played_at,
        }
        for m in matches
    ]
