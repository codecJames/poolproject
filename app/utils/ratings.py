from typing import Optional

from sqlalchemy.orm import Session

from app import models

ELO_K = 32


def record_match(
    db: Session,
    player1: models.Player,
    player2: models.Player,
    score1: int,
    score2: int,
    tournament_id: Optional[int] = None,
) -> models.Match:
    """Save a finished game and update both players' records and Elo ratings.

    Callers must reject level scores; pool games always have a winner.
    """
    winner, loser = (player1, player2) if score1 > score2 else (player2, player1)

    expected = 1 / (1 + 10 ** ((loser.rating - winner.rating) / 400))
    change = ELO_K * (1 - expected)
    winner.rating += change
    loser.rating -= change

    player1.matches_played += 1
    player2.matches_played += 1
    winner.matches_won += 1

    match = models.Match(
        tournament_id=tournament_id,
        player_1_id=player1.id,
        player_2_id=player2.id,
        player_1_score=score1,
        player_2_score=score2,
        winner_id=winner.id,
    )
    db.add(match)
    db.flush()
    return match
