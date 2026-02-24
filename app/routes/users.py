from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
import os
import bcrypt
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/users", tags=["users"])

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
JWT_EXP_MINUTES = 60 * 24

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: int):
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

@router.post('/signup')
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='Email already registered')

    hashed_password = hash_password(user.password)
    db_user = models.User(full_name=user.full_name, email=user.email, password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_token(db_user.id)
    return {'token': token, 'user': {'id': db_user.id, 'email': db_user.email, 'full_name': db_user.full_name}}

@router.post('/login')
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_token(user.id)
    return {'token': token, 'user': {'id': user.id, 'email': user.email, 'full_name': user.full_name}}

@router.get("/", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
