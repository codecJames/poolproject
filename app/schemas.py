from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth / users
class SignupRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(ORMModel):
    id: int
    full_name: str
    email: str


class Player(ORMModel):
    id: int
    user_id: Optional[int] = None
    name: str
    university: str
    rating: float
    matches_played: int
    matches_won: int
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserOut
    player: Player


class Me(BaseModel):
    user: UserOut
    player: Player


# Clubs
class ClubCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    location: str = Field("UCT", max_length=80)
    description: str = Field("", max_length=500)


class Club(ORMModel):
    id: int
    name: str
    location: str
    description: str
    created_at: datetime


# Leagues
class LeagueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    season: str = Field(min_length=1, max_length=40)
    club_id: Optional[int] = None


class League(ORMModel):
    id: int
    name: str
    season: str
    club_id: Optional[int] = None
    created_at: datetime


class Standing(BaseModel):
    team_id: int
    team_name: str
    club_name: Optional[str] = None
    captain_id: Optional[int] = None
    captain_name: Optional[str] = None
    member_ids: List[int]
    played: int
    wins: int
    draws: int
    losses: int
    frames_for: int
    frames_against: int
    points: int


class LeagueResultCreate(BaseModel):
    home_team_id: int
    away_team_id: int
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)


class LeagueResult(BaseModel):
    id: int
    league_id: int
    home_team_id: int
    home_team_name: str
    away_team_id: int
    away_team_name: str
    home_score: int
    away_score: int
    recorded_by_id: int
    recorded_by_name: str
    played_at: datetime


# Teams
class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    league_id: int


class TeamMember(BaseModel):
    user_id: int
    full_name: str
    joined_at: datetime


class Team(BaseModel):
    id: int
    name: str
    league_id: int
    club_id: Optional[int] = None
    captain_id: Optional[int] = None
    captain_name: Optional[str] = None
    members: List[TeamMember]


# Tournaments
class TournamentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    rules: str = Field("", max_length=2000)
    location: str = Field("UCT", max_length=80)
    is_public: bool = True
    max_players: int = Field(32, ge=2, le=128)
    start_date: Optional[datetime] = None


class TournamentSummary(BaseModel):
    id: int
    name: str
    rules: str
    location: str
    is_public: bool
    max_players: int
    status: str  # registration, in_progress, completed
    created_by_id: int
    creator_name: str
    created_at: datetime
    start_date: Optional[datetime] = None
    total_rounds: Optional[int] = None
    winner_id: Optional[int] = None
    winner_name: Optional[str] = None
    registration_count: int
    registered_user_ids: List[int]


class TournamentRegistration(BaseModel):
    user_id: int
    full_name: str
    registered_at: datetime


class TournamentMatch(BaseModel):
    id: int
    round_number: int
    match_position: int
    player1_id: Optional[int] = None
    player1_name: Optional[str] = None
    player2_id: Optional[int] = None
    player2_name: Optional[str] = None
    winner_id: Optional[int] = None
    player1_score: int
    player2_score: int
    completed: bool
    is_bye: bool


class TournamentDetail(TournamentSummary):
    registrations: List[TournamentRegistration]
    matches: List[TournamentMatch]


class TournamentMatchResult(BaseModel):
    player1_score: int = Field(ge=0, le=99)
    player2_score: int = Field(ge=0, le=99)


# Challenges
class ChallengeCreate(BaseModel):
    challenged_id: int


class ChallengeScore(BaseModel):
    challenger_score: int = Field(ge=0, le=99)
    challenged_score: int = Field(ge=0, le=99)


class Challenge(BaseModel):
    id: int
    challenger_id: int
    challenger_name: str
    challenged_id: int
    challenged_name: str
    status: str  # pending, accepted, declined, cancelled, completed
    created_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    reported_challenger_score: Optional[int] = None
    reported_challenged_score: Optional[int] = None
    reported_by_id: Optional[int] = None
    match_id: Optional[int] = None


# Match history
class Match(BaseModel):
    id: int
    player_1_id: int
    player_1_name: str
    player_2_id: int
    player_2_name: str
    player_1_score: int
    player_2_score: int
    winner_id: Optional[int] = None
    tournament_id: Optional[int] = None
    tournament_name: Optional[str] = None
    played_at: datetime
