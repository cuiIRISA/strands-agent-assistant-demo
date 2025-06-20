import os
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from db_utils import get_db_connection
from strands import Agent
from strands.models import BedrockModel
from calendar_assistant import calendar_assistant
from constants import SESSION_ID

# Initialize FastAPI app
app = FastAPI(title="Personal Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the model
model = BedrockModel(
    model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
)

# Initialize the personal assistant agent
personal_assistant_agent = Agent(
    model=model,
    system_prompt="You are a helpful personal assistant. Please provide the helpful answers for user's requests. You can also use the agents and tools at your disposal to assist the request.",
    tools=[calendar_assistant],
    trace_attributes={"session.id": SESSION_ID},
)

# Pydantic models for request/response
class MessageRequest(BaseModel):
    message: str
    assistant: Optional[str] = "personal"  # Kept for backward compatibility

class MessageResponse(BaseModel):
    response: str

class ErrorResponse(BaseModel):
    error: str

class Appointment(BaseModel):
    id: int
    date: str
    time: str
    location: str
    title: str
    description: str

# Functions to get appointment data
def get_appointments_for_month(year: int, month: int) -> List[Dict[str, Any]]:
    """Get all appointments for a specific month"""
    try:
        # Get database connection using db_utils
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
        if not cursor.fetchone():
            conn.close()
            return []
        
        # Get appointments for the month
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{month+1:02d}-01"
            
        cursor.execute(
            "SELECT id, date, location, title, description FROM appointments WHERE date >= ? AND date < ?",
            (start_date, end_date)
        )
        
        appointments = []
        for row in cursor.fetchall():
            date_parts = row['date'].split(" ")[0] if " " in row['date'] else row['date']
            time_parts = row['date'].split(" ")[1] if " " in row['date'] else "00:00"
            
            appointments.append({
                'id': row['id'],
                'date': date_parts,
                'time': time_parts,
                'location': row['location'],
                'title': row['title'],
                'description': row['description']
            })
            
        conn.close()
        return appointments
    except Exception as e:
        print(f"Error getting appointments: {str(e)}")
        return []

def get_appointments_for_date(date_str: str) -> List[Dict[str, Any]]:
    """Get all appointments for a specific date"""
    try:
        # Get database connection using db_utils
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
        if not cursor.fetchone():
            conn.close()
            return []
        
        # Query appointments for the specific date
        cursor.execute(
            "SELECT id, date, location, title, description FROM appointments WHERE date LIKE ? ORDER BY date",
            (f"{date_str}%",)
        )
        
        appointments = []
        for row in cursor.fetchall():
            time_part = row['date'].split(" ")[1] if " " in row['date'] else "00:00"
            
            appointments.append({
                'id': row['id'],
                'time': time_part,
                'location': row['location'],
                'title': row['title'],
                'description': row['description']
            })
            
        conn.close()
        return appointments
    except Exception as e:
        print(f"Error getting appointments for date: {str(e)}")
        return []

# API Routes
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/api/appointments")
def get_appointments_api(
    year: int = Query(default=datetime.now().year, description="Year for appointments"),
    month: int = Query(default=datetime.now().month, description="Month for appointments")
):
    """Get appointments for a specific month"""
    appointments = get_appointments_for_month(year, month)
    return appointments

@app.get("/api/appointments/day")
def get_day_appointments_api(
    date: str = Query(default=datetime.now().strftime('%Y-%m-%d'), description="Date in YYYY-MM-DD format")
):
    """Get appointments for a specific date"""
    appointments = get_appointments_for_date(date)
    return appointments

@app.post("/api/chat", response_model=MessageResponse)
async def send_message(request: MessageRequest):
    """Send a message to the assistant"""
    message = request.message
    # No need to get assistant_type since we only use personal_assistant_agent
    
    if not message:
        raise HTTPException(status_code=400, detail="No message provided")
    
    try:
        # Always use the personal assistant agent, which can call calendar_assistant as needed
        response = personal_assistant_agent(message)
        
        # Ensure response is a string and not None
        response_text = str(response) if response is not None else ""
        print(f"Response from personal assistant: {response_text[:100]}...")
            
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Initialize the database
from init_db import init_database

if __name__ == '__main__':
    print("=" * 60)
    print("🌐 Starting Personal Assistant Backend API")
    print("=" * 60)
    
    # Initialize the database
    db_initialized = init_database()
    if db_initialized:
        print("✅ Database initialized successfully")
    else:
        print("⚠️ Warning: Database initialization failed, using in-memory database")
    
    print("✅ API initialized with Personal and Calendar Assistants!")
    print("🔗 API available at: http://127.0.0.1:8000")
    print("=" * 60)
    
    # Run the FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=8000)