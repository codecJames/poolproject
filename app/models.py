from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teams_as_captain = relationship("Team", foreign_keys="Team.captain_id", back_populates="captain")
    team_memberships = relationship("TeamMember", back_populates="user")


class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, default="UCT")
    description = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teams = relationship("Team", back_populates="club")
    leagues = relationship("League", back_populates="club")


class League(Base):
    __tablename__ = "leagues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    season = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    club = relationship("Club", back_populates="leagues")
    teams = relationship("Team", back_populates="league")


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    captain_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    captain = relationship("User", foreign_keys=[captain_id], back_populates="teams_as_captain")
    club = relationship("Club", back_populates="teams")
    league = relationship("League", back_populates="teams")
    members = relationship("TeamMember", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    university = Column(String, default="UCT")
    rating = Column(Float, default=1000.0)
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    matches_as_player1 = relationship("Match", foreign_keys="Match.player_1_id", back_populates="player1")
    matches_as_player2 = relationship("Match", foreign_keys="Match.player_2_id", back_populates="player2")


class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, default="UCT")
    start_date = Column(DateTime, nullable=False)
    entry_fee = Column(Float, default=0.0)
    prize_pool = Column(Float, default=0.0)
    
    # Relationships
    matches = relationship("Match", back_populates="tournament")


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    player_1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player_2_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player_1_score = Column(Integer, default=0)
    player_2_score = Column(Integer, default=0)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    money_wagered = Column(Float, default=0.0)
    played_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("Player", foreign_keys=[player_1_id], back_populates="matches_as_player1")
    player2 = relationship("Player", foreign_keys=[player_2_id], back_populates="matches_as_player2")
