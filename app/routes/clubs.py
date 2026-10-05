from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/clubs", tags=["clubs"])


@router.get("", response_model=List[schemas.Club])
def get_clubs(db: Session = Depends(get_db)):
    return db.query(models.Club).order_by(models.Club.name).all()


@router.post("", response_model=schemas.Club)
def create_club(
    club: schemas.ClubCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    name = club.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Club name is required")
    if db.query(models.Club).filter(func.lower(models.Club.name) == name.lower()).first():
        raise HTTPException(status_code=400, detail="A club with that name already exists")

    db_club = models.Club(
        name=name,
        location=club.location.strip() or "UCT",
        description=club.description.strip(),
    )
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club


@router.get("/{club_id}", response_model=schemas.Club)
def get_club(club_id: int, db: Session = Depends(get_db)):
    club = db.get(models.Club, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club
