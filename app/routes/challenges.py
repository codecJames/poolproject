from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_player
from app.database import get_db
from app.utils.ratings import record_match

router = APIRouter(prefix="/challenges", tags=["challenges"])

OPEN_STATUSES = ("pending", "accepted")


def _challenge_out(c: models.Challenge) -> dict:
    return {
        "id": c.id,
        "challenger_id": c.challenger_id,
        "challenger_name": c.challenger.name,
        "challenged_id": c.challenged_id,
        "challenged_name": c.challenged.name,
        "status": c.status,
        "created_at": c.created_at,
        "accepted_at": c.accepted_at,
        "completed_at": c.completed_at,
        "reported_challenger_score": c.reported_challenger_score,
        "reported_challenged_score": c.reported_challenged_score,
        "reported_by_id": c.reported_by_id,
        "match_id": c.match_id,
    }


def _get_own_challenge(db: Session, challenge_id: int, player: models.Player) -> models.Challenge:
    challenge = db.get(models.Challenge, challenge_id)
    if not challenge or player.id not in (challenge.challenger_id, challenge.challenged_id):
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.get("/mine", response_model=List[schemas.Challenge])
def get_my_challenges(db: Session = Depends(get_db), player: models.Player = Depends(get_current_player)):
    challenges = (
        db.query(models.Challenge)
        .filter((models.Challenge.challenger_id == player.id) | (models.Challenge.challenged_id == player.id))
        .order_by(models.Challenge.created_at.desc())
        .limit(100)
        .all()
    )
    return [_challenge_out(c) for c in challenges]


@router.post("", response_model=schemas.Challenge)
def create_challenge(
    data: schemas.ChallengeCreate,
    db: Session = Depends(get_db),
    player: models.Player = Depends(get_current_player),
):
    opponent = db.get(models.Player, data.challenged_id)
    if not opponent:
        raise HTTPException(status_code=404, detail="Player not found")
    if opponent.id == player.id:
        raise HTTPException(status_code=400, detail="You can't challenge yourself")

    already_open = db.query(models.Challenge).filter(
        models.Challenge.status.in_(OPEN_STATUSES),
        ((models.Challenge.challenger_id == player.id) & (models.Challenge.challenged_id == opponent.id))
        | ((models.Challenge.challenger_id == opponent.id) & (models.Challenge.challenged_id == player.id)),
    ).first()
    if already_open:
        raise HTTPException(status_code=400, detail=f"You already have an open challenge with {opponent.name}")

    challenge = models.Challenge(challenger_id=player.id, challenged_id=opponent.id, status="pending")
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return _challenge_out(challenge)


@router.post("/{challenge_id}/accept", response_model=schemas.Challenge)
def accept_challenge(challenge_id: int, db: Session = Depends(get_db), player: models.Player = Depends(get_current_player)):
    challenge = _get_own_challenge(db, challenge_id, player)
    if challenge.challenged_id != player.id:
        raise HTTPException(status_code=403, detail="Only the challenged player can accept")
    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="This challenge is no longer pending")
    challenge.status = "accepted"
    challenge.accepted_at = datetime.now(timezone.utc)
    db.commit()
    return _challenge_out(challenge)


@router.post("/{challenge_id}/decline", response_model=schemas.Challenge)
def decline_challenge(challenge_id: int, db: Session = Depends(get_db), player: models.Player = Depends(get_current_player)):
    challenge = _get_own_challenge(db, challenge_id, player)
    if challenge.challenged_id != player.id:
        raise HTTPException(status_code=403, detail="Only the challenged player can decline")
    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="This challenge is no longer pending")
    challenge.status = "declined"
    db.commit()
    return _challenge_out(challenge)


@router.post("/{challenge_id}/cancel", response_model=schemas.Challenge)
def cancel_challenge(challenge_id: int, db: Session = Depends(get_db), player: models.Player = Depends(get_current_player)):
    """The challenger can withdraw a pending challenge; either player can call off an accepted one"""
    challenge = _get_own_challenge(db, challenge_id, player)
    if challenge.status == "pending" and challenge.challenger_id != player.id:
        raise HTTPException(status_code=403, detail="Decline the challenge instead")
    if challenge.status not in OPEN_STATUSES:
        raise HTTPException(status_code=400, detail="This challenge is already closed")
    challenge.status = "cancelled"
    db.commit()
    return _challenge_out(challenge)


@router.post("/{challenge_id}/score", response_model=schemas.Challenge)
def report_challenge_score(
    challenge_id: int,
    score: schemas.ChallengeScore,
    db: Session = Depends(get_db),
    player: models.Player = Depends(get_current_player),
):
    """One player reports the score; it counts once the other player reports the same score.

    A different score from the other player replaces the report and waits for confirmation again.
    """
    challenge = _get_own_challenge(db, challenge_id, player)
    if challenge.status != "accepted":
        raise HTTPException(status_code=400, detail="Scores can only be reported for an accepted challenge")
    if score.challenger_score == score.challenged_score:
        raise HTTPException(status_code=400, detail="Scores can't be level; someone has to win")

    confirms_report = (
        challenge.reported_by_id is not None
        and challenge.reported_by_id != player.id
        and challenge.reported_challenger_score == score.challenger_score
        and challenge.reported_challenged_score == score.challenged_score
    )

    if confirms_report:
        match = record_match(
            db,
            challenge.challenger,
            challenge.challenged,
            score.challenger_score,
            score.challenged_score,
        )
        challenge.match_id = match.id
        challenge.status = "completed"
        challenge.completed_at = datetime.now(timezone.utc)
    else:
        challenge.reported_challenger_score = score.challenger_score
        challenge.reported_challenged_score = score.challenged_score
        challenge.reported_by_id = player.id

    db.commit()
    return _challenge_out(challenge)
