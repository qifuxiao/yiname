# -*- coding: utf-8 -*-
"""
API Routes for YiName application
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from app.infrastructure.database import get_db
from app.domain.models import User, NameRecord
from app.domain.bazi import calculate_bazi, format_bazi_readable
from app.infrastructure.ai_service import ai_service


# Create router
api_router = APIRouter()


# ============ Pydantic Models ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str]
    full_name: Optional[str]
    is_premium: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class NameGenerateRequest(BaseModel):
    name_type: str = "personal"  # personal, baby, business
    gender: Optional[str] = None  # male, female
    birth_date: Optional[datetime] = None
    birth_time: Optional[str] = None  # 子时, 丑时, etc.
    birth_hour: Optional[int] = None  # 0-23
    surname: str = ""
    description: Optional[str] = None
    style: str = "classical"
    count: int = 10


class NameGenerateResponse(BaseModel):
    names: List[dict]
    bazi_chart: dict
    wuxing_analysis: dict


class NameAnalyzeRequest(BaseModel):
    name: str
    birth_date: Optional[datetime] = None
    birth_hour: Optional[int] = None


class NameRecordResponse(BaseModel):
    id: int
    name_type: str
    gender: Optional[str]
    birth_date: Optional[datetime]
    generated_names: Optional[List[dict]]
    bazi_chart: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Auth Endpoints ============

@api_router.post("/users/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check username if provided
    if user_data.username:
        existing_username = db.query(User).filter(
            User.username == user_data.username
        ).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Hash password (simplified - use proper hashing in production)
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@api_router.post("/users/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    if not pwd_context.verify(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token (simplified)
    import secrets
    token = secrets.token_urlsafe(32)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }


@api_router.get("/users/me", response_model=UserResponse)
async def get_current_user(db: Session = Depends(get_db)):
    """Get current user (simplified - add auth dependency in production)"""
    # In production, get user from JWT token
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============ Name Generation Endpoints ============

@api_router.post("/names/generate", response_model=NameGenerateResponse)
async def generate_names(
    request: NameGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate names based on birth data and preferences"""
    
    # Calculate BaZi if birth date provided
    bazi_data = None
    wuxing_analysis = None
    
    if request.birth_date:
        # Determine hour
        hour = request.birth_hour
        if hour is None and request.birth_time:
            # Parse time branch
            hour_map = {
                "子": 0, "丑": 2, "寅": 4, "卯": 6,
                "辰": 8, "巳": 10, "午": 12, "未": 14,
                "申": 16, "酉": 18, "戌": 20, "亥": 22
            }
            hour = hour_map.get(request.birth_time, 12)
        
        bazi_data = calculate_bazi(request.birth_date, hour)
        wuxing_analysis = bazi_data.get("wuxing", {})
    
    # Generate names with AI
    names = []
    if bazi_data:
        names = await ai_service.generate_names(
            bazi_data=bazi_data,
            gender=request.gender,
            surname=request.surname,
            style=request.style,
            count=request.count
        )
    
    # Save to database (if user is authenticated)
    # In production, get user_id from auth
    record = NameRecord(
        name_type=request.name_type,
        gender=request.gender,
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        description=request.description,
        generated_names=names,
        bazi_chart=bazi_data.get("chart") if bazi_data else None,
        wuxing_analysis=wuxing_analysis
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return NameGenerateResponse(
        names=names,
        bazi_chart=bazi_data.get("chart") if bazi_data else {},
        wuxing_analysis=wuxing_analysis or {}
    )


@api_router.post("/names/analyze")
async def analyze_name(request: NameAnalyzeRequest):
    """Analyze a specific name"""
    
    # Calculate BaZi if birth date provided
    bazi_data = None
    if request.birth_date:
        hour = request.birth_hour or 12
        bazi_data = calculate_bazi(request.birth_date, hour)
    
    # Get AI analysis
    analysis = await ai_service.analyze_name(request.name, bazi_data or {})
    
    return {
        "name": request.name,
        "analysis": analysis,
        "bazi_readable": format_bazi_readable(bazi_data) if bazi_data else None
    }


@api_router.get("/names/history", response_model=List[NameRecordResponse])
async def get_name_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get user's name generation history"""
    records = db.query(NameRecord).order_by(
        NameRecord.created_at.desc()
    ).limit(limit).all()
    
    return records


@api_router.get("/names/{record_id}", response_model=NameRecordResponse)
async def get_name_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific name record"""
    record = db.query(NameRecord).filter(NameRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return record
