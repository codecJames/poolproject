import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if os.environ.get("VERCEL"):
        raise RuntimeError("SECRET_KEY must be set in production")
    SECRET_KEY = "dev-secret-key"

JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = 7

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in first")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Your session has expired, please log in again")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Your session has expired, please log in again")
    return user


def ensure_player(db: Session, user: models.User) -> models.Player:
    """Every user has one ranking profile; create it on first use."""
    if user.player:
        return user.player
    player = models.Player(user_id=user.id, name=user.full_name)
    db.add(player)
    db.flush()
    return player


def get_current_player(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Player:
    player = ensure_player(db, user)
    db.commit()
    return player
