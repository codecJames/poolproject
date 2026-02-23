from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    """Create a new team"""
    # Verify captain exists
    captain = db.query(models.User).filter(models.User.id == team.captain_id).first()
    if not captain:
        raise HTTPException(status_code=404, detail="Captain not found")
    
    # Verify league exists
    league = db.query(models.League).filter(models.League.id == team.league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    db_team = models.Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("/", response_model=List[schemas.TeamWithMembers])
def get_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all teams"""
    teams = db.query(models.Team).offset(skip).limit(limit).all()
    return teams

@router.get("/{team_id}", response_model=schemas.TeamWithMembers)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Get a specific team by ID"""
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/{team_id}/members")
def add_team_member(team_id: int, member: schemas.TeamMemberCreate, db: Session = Depends(get_db)):
    """Add a member to a team"""
    # Verify team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == member.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a team member")
    
    db_member = models.TeamMember(team_id=team_id, user_id=member.user_id)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@router.post("/{team_id}/record-result")
def record_team_result(team_id: int, wins: int = 0, draws: int = 0, losses: int = 0, db: Session = Depends(get_db)):
    """Record a team's match result"""
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update team stats
    team.wins += wins
    team.draws += draws
    team.losses += losses
    team.points = (team.wins * 3) + (team.draws * 1)
    
    db.commit()
    db.refresh(team)
    return team

@router.put("/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, team: schemas.TeamCreate, db: Session = Depends(get_db)):
    """Update a team"""
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    for key, value in team.dict().items():
        if key != "points":  # Don't allow direct points modification
            setattr(db_team, key, value)
    
    db.commit()
    db.refresh(db_team)
    return db_team

@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    """Delete a team"""
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    db.delete(db_team)
    db.commit()
    return {"message": "Team deleted successfully"}
