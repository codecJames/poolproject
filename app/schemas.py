from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    full_name: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Club schemas
class ClubBase(BaseModel):
    name: str
    location: str = "UCT"
    description: str = ""

class ClubCreate(ClubBase):
    pass

class Club(ClubBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# League schemas
class LeagueBase(BaseModel):
    name: str
    season: str
    club_id: int

class LeagueCreate(LeagueBase):
    pass

class League(LeagueBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# TeamMember schemas
class TeamMemberBase(BaseModel):
    user_id: int

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMember(TeamMemberBase):
    id: int
    team_id: int
    joined_at: datetime
    
    class Config:
        from_attributes = True

# Team schemas
class TeamBase(BaseModel):
    name: str
    captain_id: int
    league_id: int

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    wins: int
    draws: int
    losses: int
    points: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TeamWithMembers(Team):
    members: List[TeamMember] = []

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

# Money Match schemas (same as Match but with money focus)
class MoneyMatchCreate(MatchBase):
    player_1_score: int
    player_2_score: int
    money_wagered: float

class MoneyMatch(Match):
    pass

# Challenge schemas
class ChallengeBase(BaseModel):
    challenger_id: int
    challenged_id: int
    challenge_amount: float

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    status: str  # pending, accepted, declined, completed
    created_at: datetime
    accepted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ChallengeWithPlayers(Challenge):
    challenger_name: str
    challenged_name: str

# Challenge Result schemas
class ChallengeResultBase(BaseModel):
    challenge_id: int
    challenger_score: int = 0
    challenged_score: int = 0

class ChallengeResultCreate(ChallengeResultBase):
    pass

class ChallengeResultUpdate(BaseModel):
    challenger_score: Optional[int] = None
    challenged_score: Optional[int] = None
    player_id: int  # ID of player confirming the result

class ChallengeResult(ChallengeResultBase):
    id: int
    challenger_confirmed: bool
    challenged_confirmed: bool
    match_id: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True