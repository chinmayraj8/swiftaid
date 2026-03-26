from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

import nlp_engine
import corridor
import predictor

app = FastAPI(title="SwiftAid")

# Add CORS middleware allowing all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class DispatchRequest(BaseModel):
    text: str

class CorridorRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float

@app.get("/")
def read_root():
    return {"message": "Welcome to SwiftAid API"}

@app.post("/dispatch")
def dispatch(request: DispatchRequest):
    # Calls parse_emergency from nlp_engine
    result = nlp_engine.parse_emergency(request.text)
    return {"result": result}

@app.post("/corridor")
def create_corridor(request: CorridorRequest):
    # Calls generate_corridor from corridor.py
    result = corridor.generate_corridor(
        request.origin_lat, 
        request.origin_lng, 
        request.dest_lat, 
        request.dest_lng
    )
    return {"result": result}

@app.get("/incidents")
def get_incidents():
    # Returns 3 hardcoded mock incidents in Bangalore
    return {
        "incidents": [
            {
                "id": "inc-001",
                "type": "medical",
                "severity": "high",
                "lat": 12.971598,
                "lng": 77.594562,
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": "inc-002",
                "type": "fire",
                "severity": "critical",
                "lat": 12.935192,
                "lng": 77.624480,
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": "inc-003",
                "type": "accident",
                "severity": "medium",
                "lat": 12.914141,
                "lng": 77.584145,
                "timestamp": datetime.now().isoformat()
            }
        ]
    }

@app.get("/hotspots")
def get_hotspots():
    # Calls predict_hotspots from predictor.py and returns top 5 high risk zones
    high_risk_zones = predictor.predict_hotspots()
    return {"hotspots": high_risk_zones[:5]}

@app.post("/voice-dispatch")
def voice_dispatch():
    """Accepts a voice call and processes it as an emergency"""
    result = nlp_engine.process_voice_emergency()
    
    if "error" in result:
        return result
        
    # Get parsed incident coordinates
    dest_lat = result.get("lat", 12.9716)
    dest_lng = result.get("lng", 77.5946)
    
    # 1. Dispatch nearest ambulance
    ambulance = nlp_engine.get_nearest_ambulance(dest_lat, dest_lng)
    
    if ambulance:
        result["ambulance_dispatched"] = ambulance
        
        # 2. Clear corridor path
        corridor_data = corridor.generate_corridor(
            origin_lat=ambulance["lat"],
            origin_lng=ambulance["lng"],
            dest_lat=dest_lat,
            dest_lng=dest_lng
        )
        result["corridor"] = corridor_data
        
    return result
