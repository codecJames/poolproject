from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

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
