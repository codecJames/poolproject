from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.auth import ensure_player, get_current_user
from app.database import get_db
from app.utils.ratings import record_match
from app.utils.tournament_utils import first_round_pairings

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


def _summary(t: models.Tournament) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "rules": t.rules or "",
        "location": t.location or "",
        "is_public": t.is_public,
        "max_players": t.max_players,
        "status": t.status,
        "created_by_id": t.created_by_id,
        "creator_name": t.creator.full_name,
        "created_at": t.created_at,
        "start_date": t.start_date,
        "total_rounds": t.total_rounds,
        "winner_id": t.winner_id,
        "winner_name": t.winner.full_name if t.winner else None,
        "registration_count": len(t.registrations),
        "registered_user_ids": [r.user_id for r in t.registrations],
    }


def _detail(t: models.Tournament) -> dict:
    return {
        **_summary(t),
        "registrations": [
            {"user_id": r.user_id, "full_name": r.user.full_name, "registered_at": r.registered_at}
            for r in sorted(t.registrations, key=lambda r: r.registered_at)
        ],
        "matches": [
            {
                "id": m.id,
                "round_number": m.round_number,
                "match_position": m.match_position,
                "player1_id": m.player1_id,
                "player1_name": m.player1.full_name if m.player1 else None,
                "player2_id": m.player2_id,
                "player2_name": m.player2.full_name if m.player2 else None,
                "winner_id": m.winner_id,
                "player1_score": m.player1_score,
                "player2_score": m.player2_score,
                "completed": m.completed,
                "is_bye": m.completed and m.player2_id is None,
            }
            for m in t.matches
        ],
    }


def _get_tournament(db: Session, tournament_id: int) -> models.Tournament:
    tournament = db.get(models.Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


def _advance(db: Session, tournament: models.Tournament, round_number: int) -> None:
    """Once every match in a round is decided, draw the next round or crown the winner."""
    round_matches = sorted(
        (m for m in tournament.matches if m.round_number == round_number),
        key=lambda m: m.match_position,
    )
    if not round_matches or not all(m.completed for m in round_matches):
        return
    if any(m.round_number == round_number + 1 for m in tournament.matches):
        return

    winners = [m.winner_id for m in round_matches]
    if len(winners) == 1:
        tournament.status = "completed"
        tournament.winner_id = winners[0]
        return

    for index in range(0, len(winners), 2):
        tournament.matches.append(
            models.TournamentMatch(
                round_number=round_number + 1,
                match_position=index // 2 + 1,
                player1_id=winners[index],
                player2_id=winners[index + 1],
            )
        )


@router.post("", response_model=schemas.TournamentDetail)
def create_tournament(
    data: schemas.TournamentCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tournament name is required")
    tournament = models.Tournament(
        name=name,
        rules=data.rules.strip(),
        location=data.location.strip() or "UCT",
        is_public=data.is_public,
        max_players=data.max_players,
        start_date=data.start_date,
        status="registration",
        created_by_id=user.id,
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return _detail(tournament)


@router.get("", response_model=List[schemas.TournamentSummary])
def get_tournaments(status: str = None, db: Session = Depends(get_db)):
    """Public tournaments, soonest first"""
    query = (
        db.query(models.Tournament)
        .options(
            selectinload(models.Tournament.registrations),
            selectinload(models.Tournament.creator),
            selectinload(models.Tournament.winner),
        )
        .filter(models.Tournament.is_public.is_(True))
    )
    if status:
        query = query.filter(models.Tournament.status == status)
    tournaments = query.order_by(models.Tournament.created_at.desc()).all()
    return [_summary(t) for t in tournaments]


@router.get("/mine", response_model=List[schemas.TournamentSummary])
def get_my_tournaments(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Tournaments the user created or entered, including private ones"""
    entered = db.query(models.TournamentRegistration.tournament_id).filter(
        models.TournamentRegistration.user_id == user.id
    )
    tournaments = (
        db.query(models.Tournament)
        .filter((models.Tournament.created_by_id == user.id) | models.Tournament.id.in_(entered))
        .order_by(models.Tournament.created_at.desc())
        .all()
    )
    return [_summary(t) for t in tournaments]


@router.get("/{tournament_id}", response_model=schemas.TournamentDetail)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    return _detail(_get_tournament(db, tournament_id))


@router.delete("/{tournament_id}")
def delete_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tournament = _get_tournament(db, tournament_id)
    if tournament.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Only the organiser can delete this tournament")
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="A tournament can't be deleted once it has started")
    db.delete(tournament)
    db.commit()
    return {"message": "Tournament deleted"}


@router.post("/{tournament_id}/register", response_model=schemas.TournamentDetail)
def register_for_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tournament = _get_tournament(db, tournament_id)
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="Registration for this tournament is closed")
    if any(r.user_id == user.id for r in tournament.registrations):
        raise HTTPException(status_code=400, detail="You're already registered")
    if len(tournament.registrations) >= tournament.max_players:
        raise HTTPException(status_code=400, detail="This tournament is full")

    tournament.registrations.append(models.TournamentRegistration(user_id=user.id))
    db.commit()
    db.refresh(tournament)
    return _detail(tournament)


@router.post("/{tournament_id}/unregister", response_model=schemas.TournamentDetail)
def unregister_from_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tournament = _get_tournament(db, tournament_id)
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="You can't withdraw after the tournament has started")
    registration = next((r for r in tournament.registrations if r.user_id == user.id), None)
    if not registration:
        raise HTTPException(status_code=400, detail="You're not registered for this tournament")

    tournament.registrations.remove(registration)
    db.commit()
    db.refresh(tournament)
    return _detail(tournament)


@router.post("/{tournament_id}/start", response_model=schemas.TournamentDetail)
def start_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Close registration and draw the first round"""
    tournament = _get_tournament(db, tournament_id)
    if tournament.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Only the organiser can start the tournament")
    if tournament.status != "registration":
        raise HTTPException(status_code=400, detail="This tournament has already started")
    if len(tournament.registrations) < 2:
        raise HTTPException(status_code=400, detail="At least 2 players need to register first")

    pairs, total_rounds = first_round_pairings([r.user_id for r in tournament.registrations])
    for position, (player1_id, player2_id) in enumerate(pairs, start=1):
        is_bye = player2_id is None
        tournament.matches.append(
            models.TournamentMatch(
                round_number=1,
                match_position=position,
                player1_id=player1_id,
                player2_id=player2_id,
                winner_id=player1_id if is_bye else None,
                completed=is_bye,
            )
        )

    tournament.status = "in_progress"
    tournament.total_rounds = total_rounds
    if tournament.start_date is None:
        tournament.start_date = datetime.now(timezone.utc)
    db.flush()
    _advance(db, tournament, 1)
    db.commit()
    db.refresh(tournament)
    return _detail(tournament)


@router.put("/{tournament_id}/matches/{match_id}", response_model=schemas.TournamentDetail)
def report_match_result(
    tournament_id: int,
    match_id: int,
    result: schemas.TournamentMatchResult,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Record a bracket result; the player with more frames goes through"""
    tournament = _get_tournament(db, tournament_id)
    match = next((m for m in tournament.matches if m.id == match_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if tournament.status != "in_progress":
        raise HTTPException(status_code=400, detail="This tournament isn't in progress")
    if match.completed:
        raise HTTPException(status_code=400, detail="This match already has a result")
    if match.player1_id is None or match.player2_id is None:
        raise HTTPException(status_code=400, detail="This match is still waiting for its players")
    if user.id not in (match.player1_id, match.player2_id, tournament.created_by_id):
        raise HTTPException(status_code=403, detail="Only the two players or the organiser can report this result")
    if result.player1_score == result.player2_score:
        raise HTTPException(status_code=400, detail="Scores can't be level; someone has to win the match")

    match.player1_score = result.player1_score
    match.player2_score = result.player2_score
    match.winner_id = match.player1_id if result.player1_score > result.player2_score else match.player2_id
    match.completed = True

    record_match(
        db,
        ensure_player(db, match.player1),
        ensure_player(db, match.player2),
        result.player1_score,
        result.player2_score,
        tournament_id=tournament.id,
    )
    _advance(db, tournament, match.round_number)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="The bracket changed while you were saving; refresh and try again")
    db.refresh(tournament)
    return _detail(tournament)
