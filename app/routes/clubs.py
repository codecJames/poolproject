from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/clubs", tags=["clubs"])

DEFAULT_CLUB_NAMES = [
    "Shooter Specials",
    "Kilindini",
    "Varietas",
    "Forest Hill",
    "Avenue Road",
    "Liesbeek",
    "Medical Res",
    "Groote Schur",
    "Kopano",
    "Obz Square",
]


def ensure_default_clubs(db: Session):
    existing_names = {
        (club_name or "").strip().lower()
        for (club_name,) in db.query(models.Club.name).all()
    }

    clubs_to_add = [
        models.Club(name=club_name)
        for club_name in DEFAULT_CLUB_NAMES
        if club_name.lower() not in existing_names
    ]

    if clubs_to_add:
        db.add_all(clubs_to_add)
        db.commit()

@router.post("/", response_model=schemas.Club)
def create_club(club: schemas.ClubCreate, db: Session = Depends(get_db)):
    """Create a new club"""
    db_club = models.Club(**club.dict())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club

@router.get("/", response_model=List[schemas.Club])
def get_clubs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all clubs"""
    ensure_default_clubs(db)
    clubs = db.query(models.Club).offset(skip).limit(limit).all()
    return clubs

@router.get("/{club_id}", response_model=schemas.Club)
def get_club(club_id: int, db: Session = Depends(get_db)):
    """Get a specific club by ID"""
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club

@router.put("/{club_id}", response_model=schemas.Club)
def update_club(club_id: int, club: schemas.ClubCreate, db: Session = Depends(get_db)):
    """Update a club"""
    db_club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not db_club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    for key, value in club.dict().items():
        setattr(db_club, key, value)
    
    db.commit()
    db.refresh(db_club)
    return db_club

@router.delete("/{club_id}")
def delete_club(club_id: int, db: Session = Depends(get_db)):
    """Delete a club"""
    db_club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not db_club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    db.delete(db_club)
    db.commit()
    return {"message": "Club deleted successfully"}
