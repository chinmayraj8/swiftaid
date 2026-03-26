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
    "accident": ["crash", "collision", "accident", "hit", "fall"],
    "fire": ["fire", "burning", "smoke", "flames"],
    "medical": ["heart", "chest", "unconscious", "breathing", "attack", "stroke", "medical", "sick"],
    "crime": ["theft", "robbery", "attack", "shooting"],
    "emergency": ["emergency", "urgent", "help", "save"]
}

SEVERITY_KEYWORDS = {
    "severe": ["serious", "severe", "badly", "injured", "critical", "dying", "unconscious", "not breathing"],
    "medium": ["hurt", "pain", "moderate"],
    "low": ["minor", "small", "scratch", "safe"]
}

import os
import requests

# 12 Mock Bangalore ambulance stations deployed organically
AMBULANCE_STATIONS = [
    {"name": "Malleswaram Gen Hosp Base", "lat": 13.0068, "lng": 77.5702},
    {"name": "St John's Koramangala Base", "lat": 12.9279, "lng": 77.6271},
    {"name": "Manipal Indiranagar Base", "lat": 12.9784, "lng": 77.6408},
    {"name": "Jayanagar Gov Base", "lat": 12.9299, "lng": 77.5824},
    {"name": "Vydehi Whitefield Base", "lat": 12.9698, "lng": 77.7499},
    {"name": "Yelahanka North Base", "lat": 13.1006, "lng": 77.5963},
    {"name": "Banashankari South Base", "lat": 12.9152, "lng": 77.5735},
    {"name": "BTM Layout Station", "lat": 12.9165, "lng": 77.6101},
    {"name": "Hebbal Station", "lat": 13.0354, "lng": 77.5988},
    {"name": "Rajajinagar Station", "lat": 12.9981, "lng": 77.5504},
    {"name": "Electronic City Base", "lat": 12.8399, "lng": 77.6770},
    {"name": "Peenya Base", "lat": 13.0285, "lng": 77.5197}
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
            
    # As per rules: Emergencies, accidents, fires, and medical emergencies are automatically Severe
    if incident_type in ["accident", "fire", "emergency", "medical"]:
        severity = "severe"
        
    # Establish strict fallback Severity logic if exact dict words weren't spoken 
    if severity == "unknown":
        severity = "medium" # Safe default
        
    # Calculate confidence based on number of keywords matched
    # Starts safely at 0.70, maxing out at 0.99
    total_matches = matched_type_keywords + matched_sev_keywords
    confidence = min(0.99, 0.70 + (total_matches * 0.05))
    
    # 3. Extract Location Name using spaCy
    location_name = "Unknown location"
    if nlp is not None:
        doc = nlp(text)
        # Look for GPE (Geopolitical Entity) or LOC (Location) entities
        locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC", "FAC")]
        if locations:
            location_name = locations[0]
            
    # Default fallback to center of Bangalore
    lat = 12.9716
    lng = 77.5946
    
    # Live Geocoding Hook (Google Maps API) natively parsing string strings dynamically!
    api_key = os.environ.get("GOOGLE_API_KEY", "AIzaSyBc1M5w65iTwQN3KjygX67BinOWse4u4-Y")
    
    # Use NLP literal location if found cleanly, else dump the whole text query to Google's semantic parser backend!
    query = location_name if location_name != "Unknown location" else text
    
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={query}+Bangalore&key={api_key}"
        res = requests.get(url, timeout=5).json()
        if res.get("status") == "OK":
            lat = res["results"][0]["geometry"]["location"]["lat"]
            lng = res["results"][0]["geometry"]["location"]["lng"]
            # Extract formatted address bounds perfectly
            if location_name == "Unknown location":
                location_name = res["results"][0]["formatted_address"].split(',')[0] # Grab just literal road segment
    except Exception:
        pass
        
    # Reroute to hospital only for medical and accident cases; Fire/Crime stay on-scene
    requires_hospital = (severity == "severe") and (incident_type not in ["fire", "crime"])
        
    return {
        "incident_type": incident_type,
        "severity": severity,
        "requires_hospital": requires_hospital,
        "location_name": location_name,
        "lat": lat,
        "lng": lng,
        "confidence": round(confidence, 2)
    }

def get_nearest_ambulance(lat: float, lng: float) -> dict:
    """Returns the nearest mock ambulance base calculating true fastest route durations using Google Maps Distance Matrix"""
    if not AMBULANCE_STATIONS: return None
    
    # Calculate Haversine
    def haversine(l1, ln1, l2, ln2):
        dlat = math.radians(l2 - l1)
        dlon = math.radians(ln2 - ln1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(l1)) * math.cos(math.radians(l2)) * math.sin(dlon/2)**2
        return 2 * 6371 * math.asin(math.sqrt(a))
        
    candidates = sorted(AMBULANCE_STATIONS, key=lambda s: haversine(lat, lng, s["lat"], s["lng"]))[:3]
    
    api_key = os.environ.get("GOOGLE_API_KEY", "AIzaSyBc1M5w65iTwQN3KjygX67BinOWse4u4-Y")
    dests = "|".join([f"{c['lat']},{c['lng']}" for c in candidates])
    
    try:
        # Distance Matrix calculating real route time from ambulance to incident coordinate
        url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={dests}&destinations={lat},{lng}&departure_time=now&key={api_key}"
        res = requests.get(url, timeout=5).json()
        
        if res.get("status") == "OK":
            best_amb, min_dur = None, float('inf')
            # Extract across multiple origins pointing to 1 destination
            for i, row in enumerate(res["rows"]):
                el = row["elements"][0]
                if el.get("status") == "OK":
                    val = el.get("duration_in_traffic", el.get("duration", {})).get("value", float('inf'))
                    if val < min_dur:
                        min_dur = val
                        best_amb = candidates[i]
            if best_amb: return best_amb
    except Exception:
        pass
        
    return candidates[0]

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
