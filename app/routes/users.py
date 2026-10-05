from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import create_token, ensure_player, get_current_user, hash_password, verify_password
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


def _normalise_email(email: str) -> str:
    return email.strip().lower()


def _auth_response(db: Session, user: models.User) -> dict:
    player = ensure_player(db, user)
    db.commit()
    return {"token": create_token(user.id), "user": user, "player": player}


@router.post("/signup", response_model=schemas.AuthResponse)
def signup(data: schemas.SignupRequest, db: Session = Depends(get_db)):
    email = _normalise_email(data.email)
    full_name = data.full_name.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email")
    if not full_name:
        raise HTTPException(status_code=400, detail="Please enter your name")
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(full_name=full_name, email=email, password=hash_password(data.password))
    db.add(user)
    db.flush()
    return _auth_response(db, user)


@router.post("/login", response_model=schemas.AuthResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == _normalise_email(data.email)).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _auth_response(db, user)


@router.get("/me", response_model=schemas.Me)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    player = ensure_player(db, user)
    db.commit()
    return {"user": user, "player": player}
