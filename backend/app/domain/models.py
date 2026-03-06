# -*- coding: utf-8 -*-
"""
Database models for YiName application
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    name_records = relationship("NameRecord", back_populates="user")


class NameRecord(Base):
    """Name generation record"""
    __tablename__ = "name_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Input parameters
    name_type = Column(String(50), default="personal")  # personal, baby, business
    gender = Column(String(10), nullable=True)  # male, female
    birth_date = Column(DateTime, nullable=True)
    birth_time = Column(String(10), nullable=True)  # 子时, 丑时, etc.
    description = Column(Text, nullable=True)
    preferences = Column(JSON, nullable=True)  # style, surname, etc.
    
    # Generated results
    generated_names = Column(JSON, nullable=True)  # List of generated names
    
    # Analysis results
    bazi_chart = Column(JSON, nullable=True)  # 八字排盘
    wuxing_analysis = Column(JSON, nullable=True)  # 五行分析
    ai_analysis = Column(Text, nullable=True)  # AI generated analysis
    
    # Metadata
    is_favorite = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="name_records")
