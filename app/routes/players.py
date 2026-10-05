from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=List[schemas.Player])
def get_players(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """All players, highest rated first"""
    return (
        db.query(models.Player)
        .order_by(models.Player.rating.desc(), models.Player.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{player_id}", response_model=schemas.Player)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(models.Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player
