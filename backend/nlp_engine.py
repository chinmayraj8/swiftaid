import spacy
import math
import speech_recognition as sr

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
            
    # Mock hardcoded locations to coordinates for pipeline demo
    DUMMY_LOCATIONS = {
        "koramangala": {"lat": 12.9279, "lng": 77.6271},
        "indiranagar": {"lat": 12.9784, "lng": 77.6408},
        "malleswaram": {"lat": 13.0068, "lng": 77.5702},
        "jayanagar": {"lat": 12.9299, "lng": 77.5824},
        "whitefield": {"lat": 12.9698, "lng": 77.7499},
        "electronic city": {"lat": 12.8452, "lng": 77.6602},
        "hsr layout": {"lat": 12.9121, "lng": 77.6446},
    }
    
    # Default to center of Bangalore
    lat = 12.9716
    lng = 77.5946
    
    # Try text matching for simple dummy mappings
    for loc, coords in DUMMY_LOCATIONS.items():
        if loc in text_lower:
            if location_name == "Unknown location":
                location_name = loc.title()
            lat = coords["lat"]
            lng = coords["lng"]
            break
            
    return {
        "incident_type": incident_type,
        "severity": severity,
        "location_name": location_name,
        "lat": lat,
        "lng": lng,
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

def voice_to_text():
    """Records voice from microphone and converts to text"""
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("Listening for emergency call...")
        # Adjust for background noise
        recognizer.adjust_for_ambient_noise(source, duration=1)
        # Listen for up to 10 seconds
        audio = recognizer.listen(source, timeout=10)
    
    try:
        # Use Google's free speech recognition
        text = recognizer.recognize_google(audio)
        print(f"Heard: {text}")
        return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Speech service unavailable"

def process_voice_emergency():
    """Full pipeline — voice in, structured data out"""
    # Step 1: Convert voice to text
    text = voice_to_text()
    
    if text in ["Could not understand audio", "Speech service unavailable"]:
        return {"error": text, "transcription": text}
    
    # Step 2: Feed into existing NLP engine
    result = parse_emergency(text)
    
    # Step 3: Add the original transcription
    result["transcription"] = text
    
    return result
