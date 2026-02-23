from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Player schemas
class PlayerBase(BaseModel):
    name: str
    university: str = "UCT"

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    rating: float
    matches_played: int
    matches_won: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Tournament schemas
class TournamentBase(BaseModel):
    name: str
    location: str = "UCT"
    start_date: datetime
    entry_fee: float = 0.0

class TournamentCreate(TournamentBase):
    pass

class Tournament(TournamentBase):
    id: int
    prize_pool: float
    
    class Config:
        from_attributes = True

# Match schemas
class MatchBase(BaseModel):
    player_1_id: int
    player_2_id: int
    tournament_id: Optional[int] = None
    money_wagered: float = 0.0

class MatchCreate(MatchBase):
    player_1_score: int
    player_2_score: int

class Match(MatchBase):
    id: int
    player_1_score: int
    player_2_score: int
    winner_id: Optional[int]
    played_at: datetime
    
    class Config:
        from_attributes = True
