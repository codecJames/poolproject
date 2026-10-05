from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models

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

DEFAULT_LEAGUE_NAME = "Residence League"


def seed_defaults(db: Session) -> None:
    """Create the residence clubs and a league with one team per residence, once."""
    try:
        existing = {(name or "").strip().lower() for (name,) in db.query(models.Club.name).all()}
        db.add_all(
            models.Club(name=name)
            for name in DEFAULT_CLUB_NAMES
            if name.lower() not in existing
        )
        db.flush()

        if db.query(models.League).count() == 0:
            league = models.League(
                name=DEFAULT_LEAGUE_NAME,
                season=str(datetime.now(timezone.utc).year),
            )
            db.add(league)
            db.flush()
            clubs = db.query(models.Club).filter(models.Club.name.in_(DEFAULT_CLUB_NAMES)).all()
            db.add_all(
                models.Team(name=club.name, club_id=club.id, league_id=league.id)
                for club in clubs
            )
        db.commit()
    except IntegrityError:
        # Another instance seeded at the same moment
        db.rollback()
