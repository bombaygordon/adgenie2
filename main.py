from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, List
import uvicorn
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AdGenie Dashboard",
    description="Creative Dashboard for Meta, TikTok, and Google Ads",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AdGenie Dashboard API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Add platform-specific routes
@app.get("/api/meta/campaigns")
async def get_meta_campaigns():
    # TODO: Implement Meta/Facebook Ads API integration
    return {"message": "Meta campaigns endpoint"}

@app.get("/api/tiktok/campaigns")
async def get_tiktok_campaigns():
    # TODO: Implement TikTok Ads API integration
    return {"message": "TikTok campaigns endpoint"}

@app.get("/api/google/campaigns")
async def get_google_campaigns():
    # TODO: Implement Google Ads API integration
    return {"message": "Google Ads campaigns endpoint"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 