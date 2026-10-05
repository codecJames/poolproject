from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/teams", tags=["teams"])


def _team_out(team: models.Team) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "league_id": team.league_id,
        "club_id": team.club_id,
        "captain_id": team.captain_id,
        "captain_name": team.captain.full_name if team.captain else None,
        "members": [
            {"user_id": m.user_id, "full_name": m.user.full_name, "joined_at": m.joined_at}
            for m in team.members
        ],
    }


def _get_team(db: Session, team_id: int) -> models.Team:
    team = db.get(models.Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


def _ensure_not_in_league(db: Session, user_id: int, league_id: int) -> None:
    existing = (
        db.query(models.TeamMember)
        .join(models.Team)
        .filter(models.TeamMember.user_id == user_id, models.Team.league_id == league_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You're already in {existing.team.name} in this league; leave it first",
        )


@router.get("", response_model=List[schemas.Team])
def get_teams(league_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Team)
    if league_id is not None:
        query = query.filter(models.Team.league_id == league_id)
    return [_team_out(team) for team in query.order_by(models.Team.name).all()]


@router.get("/{team_id}", response_model=schemas.Team)
def get_team(team_id: int, db: Session = Depends(get_db)):
    return _team_out(_get_team(db, team_id))


@router.post("", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Register a new team in a league; the creator becomes its captain"""
    name = team.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Team name is required")
    if not db.get(models.League, team.league_id):
        raise HTTPException(status_code=404, detail="League not found")
    duplicate = db.query(models.Team).filter(
        models.Team.league_id == team.league_id,
        func.lower(models.Team.name) == name.lower(),
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="That team name is already taken in this league")
    _ensure_not_in_league(db, user.id, team.league_id)

    db_team = models.Team(name=name, league_id=team.league_id, captain_id=user.id)
    db_team.members.append(models.TeamMember(user_id=user.id))
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return _team_out(db_team)


@router.post("/{team_id}/join", response_model=schemas.Team)
def join_team(team_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    team = _get_team(db, team_id)
    _ensure_not_in_league(db, user.id, team.league_id)

    team.members.append(models.TeamMember(user_id=user.id))
    if team.captain_id is None:
        team.captain_id = user.id
    db.commit()
    db.refresh(team)
    return _team_out(team)


@router.post("/{team_id}/leave", response_model=schemas.Team)
def leave_team(team_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    team = _get_team(db, team_id)
    membership = next((m for m in team.members if m.user_id == user.id), None)
    if not membership:
        raise HTTPException(status_code=400, detail="You're not in this team")

    team.members.remove(membership)
    if team.captain_id == user.id:
        # Hand the armband to the longest-serving remaining member, if any
        remaining = sorted(team.members, key=lambda m: m.joined_at)
        team.captain_id = remaining[0].user_id if remaining else None
    db.commit()
    db.refresh(team)
    return _team_out(team)
