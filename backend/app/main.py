# -*- coding: utf-8 -*-
"""
YiName Backend - FastAPI Application
AI-powered naming application with Zhouyi周易 analysis
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
 load_dotenv

from dotenv import# Load environment variables
load_dotenv()

from app.interfaces import api_router
from app.infrastructure.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed
    pass


# Create FastAPI app
app = FastAPI(
    title="YiName API",
    description="AI-powered naming application with Zhouyi周易 analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "YiName API is running"}


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "YiName Backend"
    }
