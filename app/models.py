from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator):
    """Timestamps stored in UTC and always read back timezone-aware.

    SQLite drops timezone info, so without this local dev would send naive
    times that browsers misread as local time.
    """
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and value.tzinfo is not None:
            value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value, dialect):
        if value is not None and value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)

    player = relationship("Player", back_populates="user", uselist=False)
    teams_as_captain = relationship("Team", back_populates="captain")
    team_memberships = relationship("TeamMember", back_populates="user")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    location = Column(String, default="UCT")
    description = Column(String, default="")
    created_at = Column(UTCDateTime, default=utcnow)

    teams = relationship("Team", back_populates="club")
    leagues = relationship("League", back_populates="club")


class League(Base):
    __tablename__ = "leagues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    season = Column(String, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)

    club = relationship("Club", back_populates="leagues")
    teams = relationship("Team", back_populates="league")
    results = relationship("LeagueResult", back_populates="league", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (UniqueConstraint("league_id", "name", name="uq_team_name_per_league"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    captain_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)

    captain = relationship("User", back_populates="teams_as_captain")
    club = relationship("Club", back_populates="teams")
    league = relationship("League", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_member"),)

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(UTCDateTime, default=utcnow)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class LeagueResult(Base):
    """A team-vs-team fixture result; standings are computed from these."""
    __tablename__ = "league_results"

    id = Column(Integer, primary_key=True, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    home_score = Column(Integer, nullable=False)
    away_score = Column(Integer, nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    played_at = Column(UTCDateTime, default=utcnow)

    league = relationship("League", back_populates="results")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    recorded_by = relationship("User")


class Player(Base):
    """Ranking profile; every user gets exactly one."""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    name = Column(String, nullable=False)
    university = Column(String, default="UCT")
    rating = Column(Float, default=1000.0)
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    created_at = Column(UTCDateTime, default=utcnow)

    user = relationship("User", back_populates="player")


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rules = Column(Text, default="")
    location = Column(String, default="UCT")
    is_public = Column(Boolean, default=True)
    max_players = Column(Integer, default=32)
    status = Column(String, default="registration")  # registration, in_progress, completed
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)
    start_date = Column(UTCDateTime, nullable=True)
    total_rounds = Column(Integer, nullable=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", foreign_keys=[created_by_id])
    winner = relationship("User", foreign_keys=[winner_id])
    registrations = relationship("TournamentRegistration", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship(
        "TournamentMatch",
        back_populates="tournament",
        cascade="all, delete-orphan",
        order_by="[TournamentMatch.round_number, TournamentMatch.match_position]",
    )


class TournamentRegistration(Base):
    __tablename__ = "tournament_registrations"
    __table_args__ = (UniqueConstraint("tournament_id", "user_id", name="uq_tournament_registration"),)

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    registered_at = Column(UTCDateTime, default=utcnow)

    tournament = relationship("Tournament", back_populates="registrations")
    user = relationship("User")


class TournamentMatch(Base):
    __tablename__ = "tournament_matches"
    # Also stops two simultaneous result reports from both creating the next round
    __table_args__ = (UniqueConstraint("tournament_id", "round_number", "match_position", name="uq_bracket_slot"),)

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    match_position = Column(Integer, nullable=False)
    player1_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    player2_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = bye
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    created_at = Column(UTCDateTime, default=utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])


class Match(Base):
    """A completed head-to-head game between two players (from a challenge or a tournament)."""
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    player_1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player_2_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player_1_score = Column(Integer, default=0)
    player_2_score = Column(Integer, default=0)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    played_at = Column(UTCDateTime, default=utcnow)

    tournament = relationship("Tournament")
    player1 = relationship("Player", foreign_keys=[player_1_id])
    player2 = relationship("Player", foreign_keys=[player_2_id])


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenger_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    challenged_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, declined, cancelled, completed
    created_at = Column(UTCDateTime, default=utcnow)
    accepted_at = Column(UTCDateTime, nullable=True)
    completed_at = Column(UTCDateTime, nullable=True)
    # A score report waits here until the other player confirms it
    reported_challenger_score = Column(Integer, nullable=True)
    reported_challenged_score = Column(Integer, nullable=True)
    reported_by_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)

    challenger = relationship("Player", foreign_keys=[challenger_id])
    challenged = relationship("Player", foreign_keys=[challenged_id])
    match = relationship("Match")
