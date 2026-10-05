from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/leagues", tags=["leagues"])

POINTS_FOR_WIN = 3
POINTS_FOR_DRAW = 1


def _get_league(db: Session, league_id: int) -> models.League:
    league = db.get(models.League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    return league


def _result_out(result: models.LeagueResult) -> dict:
    return {
        "id": result.id,
        "league_id": result.league_id,
        "home_team_id": result.home_team_id,
        "home_team_name": result.home_team.name,
        "away_team_id": result.away_team_id,
        "away_team_name": result.away_team.name,
        "home_score": result.home_score,
        "away_score": result.away_score,
        "recorded_by_id": result.recorded_by_id,
        "recorded_by_name": result.recorded_by.full_name,
        "played_at": result.played_at,
    }


@router.get("", response_model=List[schemas.League])
def get_leagues(db: Session = Depends(get_db)):
    return db.query(models.League).order_by(models.League.created_at.desc()).all()


@router.post("", response_model=schemas.League)
def create_league(
    league: schemas.LeagueCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if league.club_id is not None and not db.get(models.Club, league.club_id):
        raise HTTPException(status_code=404, detail="Club not found")
    db_league = models.League(name=league.name.strip(), season=league.season.strip(), club_id=league.club_id)
    db.add(db_league)
    db.commit()
    db.refresh(db_league)
    return db_league


@router.get("/{league_id}", response_model=schemas.League)
def get_league(league_id: int, db: Session = Depends(get_db)):
    return _get_league(db, league_id)


@router.get("/{league_id}/standings", response_model=List[schemas.Standing])
def get_league_standings(league_id: int, db: Session = Depends(get_db)):
    """League table computed from recorded results: 3 points a win, 1 a draw"""
    league = _get_league(db, league_id)

    table = {
        team.id: {
            "team_id": team.id,
            "team_name": team.name,
            "club_name": team.club.name if team.club else None,
            "captain_id": team.captain_id,
            "captain_name": team.captain.full_name if team.captain else None,
            "member_ids": [member.user_id for member in team.members],
            "played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "frames_for": 0,
            "frames_against": 0,
            "points": 0,
        }
        for team in league.teams
    }

    for result in league.results:
        home = table.get(result.home_team_id)
        away = table.get(result.away_team_id)
        if not home or not away:
            continue
        for row, scored, conceded in ((home, result.home_score, result.away_score), (away, result.away_score, result.home_score)):
            row["played"] += 1
            row["frames_for"] += scored
            row["frames_against"] += conceded
            if scored > conceded:
                row["wins"] += 1
                row["points"] += POINTS_FOR_WIN
            elif scored == conceded:
                row["draws"] += 1
                row["points"] += POINTS_FOR_DRAW
            else:
                row["losses"] += 1

    return sorted(
        table.values(),
        key=lambda row: (-row["points"], -(row["frames_for"] - row["frames_against"]), -row["wins"], row["team_name"].lower()),
    )


@router.get("/{league_id}/results", response_model=List[schemas.LeagueResult])
def get_league_results(league_id: int, limit: int = 50, db: Session = Depends(get_db)):
    _get_league(db, league_id)
    results = (
        db.query(models.LeagueResult)
        .filter(models.LeagueResult.league_id == league_id)
        .order_by(models.LeagueResult.played_at.desc())
        .limit(limit)
        .all()
    )
    return [_result_out(result) for result in results]


@router.post("/{league_id}/results", response_model=schemas.LeagueResult)
def record_league_result(
    league_id: int,
    data: schemas.LeagueResultCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _get_league(db, league_id)
    if data.home_team_id == data.away_team_id:
        raise HTTPException(status_code=400, detail="Pick two different teams")

    teams = db.query(models.Team).filter(
        models.Team.id.in_([data.home_team_id, data.away_team_id]),
        models.Team.league_id == league_id,
    ).count()
    if teams != 2:
        raise HTTPException(status_code=400, detail="Both teams must be in this league")

    result = models.LeagueResult(league_id=league_id, recorded_by_id=user.id, **data.model_dump())
    db.add(result)
    db.commit()
    db.refresh(result)
    return _result_out(result)


@router.delete("/{league_id}/results/{result_id}")
def delete_league_result(
    league_id: int,
    result_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    result = db.get(models.LeagueResult, result_id)
    if not result or result.league_id != league_id:
        raise HTTPException(status_code=404, detail="Result not found")
    if result.recorded_by_id != user.id:
        raise HTTPException(status_code=403, detail="Only the person who recorded a result can remove it")
    db.delete(result)
    db.commit()
    return {"message": "Result removed"}
