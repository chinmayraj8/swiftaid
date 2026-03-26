import spacy
import math

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Handle case where the model hasn't been downloaded yet
    nlp = None

INCIDENT_KEYWORDS = {
    "accident": ["crash", "collision", "accident", "hit"],
    "fire": ["fire", "burning", "smoke", "flames"],
    "medical": ["heart", "unconscious", "breathing", "seizure"],
    "crime": ["theft", "robbery", "attack", "shooting"]
}

SEVERITY_KEYWORDS = {
    "critical": ["unconscious", "critical", "dying", "not breathing"],
    "high": ["serious", "severe", "badly", "injured"],
    "medium": ["hurt", "pain", "moderate"],
    "low": ["minor", "small", "scratch"]
}

# 5 hardcoded Bangalore ambulance stations
AMBULANCE_STATIONS = [
    {"name": "Malleswaram General Hospital Ambulance", "lat": 13.0068, "lng": 77.5702},
    {"name": "St John's Ambulance Service Koramangala", "lat": 12.9279, "lng": 77.6271},
    {"name": "Manipal Hospital Indiranagar Station", "lat": 12.9784, "lng": 77.6408},
    {"name": "Jayanagar Government Hospital Ambulance", "lat": 12.9299, "lng": 77.5824},
    {"name": "Vydehi Whitefield Station", "lat": 12.9698, "lng": 77.7499}
]

def parse_emergency(text: str) -> dict:
    text_lower = text.lower()
    
    # 1. Match Incident Type
    matched_type_keywords = 0
    incident_type = "unknown"
    
    for i_type, keywords in INCIDENT_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        if matches > matched_type_keywords:
            matched_type_keywords = matches
            incident_type = i_type
            
    # 2. Match Severity
    matched_sev_keywords = 0
    severity = "unknown"
    
    for s_level, keywords in SEVERITY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        if matches > matched_sev_keywords:
            matched_sev_keywords = matches
            severity = s_level
            
    # Calculate confidence based on number of keywords matched
    # Starts safely at 0.70, maxing out at 0.99
    total_matches = matched_type_keywords + matched_sev_keywords
    confidence = min(0.99, 0.70 + (total_matches * 0.05))
    
    # 3. Extract Location Name using spaCy
    location_name = "Unknown location"
    if nlp is not None:
        doc = nlp(text)
        # Look for GPE (Geopolitical Entity) or LOC (Location) entities
        locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
        if locations:
            location_name = locations[0]
            
    return {
        "incident_type": incident_type,
        "severity": severity,
        "location_name": location_name,
        "confidence": round(confidence, 2)
    }

def get_nearest_ambulance(lat: float, lng: float) -> dict:
    """Returns the nearest mock ambulance station based on provided coordinates"""
    if not AMBULANCE_STATIONS:
        return None
        
    nearest = None
    min_dist = float('inf')
    
    for station in AMBULANCE_STATIONS:
        # Using simple Euclidean distance for mock functionality
        dist = math.dist((lat, lng), (station["lat"], station["lng"]))
        if dist < min_dist:
            min_dist = dist
            nearest = station
            
    return nearest
