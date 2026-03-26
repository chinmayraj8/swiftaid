import random
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Global model variable to hold the trained RandomForest
_MODEL = None

def generate_mock_data() -> pd.DataFrame:
    """
    Creates a pandas DataFrame of 500 fake Bangalore incidents.
     lat: random between 12.85 and 13.05
     lng: random between 77.5 and 77.7
     hour: 0-23
     day_of_week: 0-6
     incident_type: random choice from accident/fire/medical/crime
     severity_score: random int 1-4
    """
    data = []
    incident_types = ['accident', 'fire', 'medical', 'crime']
    
    for _ in range(500):
        data.append({
            "lat": random.uniform(12.85, 13.05),
            "lng": random.uniform(77.5, 77.7),
            "hour": random.randint(0, 23),
            "day_of_week": random.randint(0, 6),
            "incident_type": random.choice(incident_types),
            "severity_score": random.randint(1, 4)
        })
        
    return pd.DataFrame(data)

def train_hotspot_model():
    """
    Trains a scikit-learn RandomForestClassifier on the mock data
    using lat, lng, hour, day_of_week as features and severity_score as target,
    then saves the model to a variable.
    """
    global _MODEL
    
    # 1. Get the dataset
    df = generate_mock_data()
    
    # 2. Extract features and target
    features = ["lat", "lng", "hour", "day_of_week"]
    target = "severity_score"
    
    X = df[features]
    y = df[target]
    
    # 3. Initialize and fit the classifier
    _MODEL = RandomForestClassifier(n_estimators=100, random_state=42)
    _MODEL.fit(X, y)

def predict_hotspots() -> list:
    """
    Uses the current hour and day, runs predictions across a grid 
    of Bangalore coordinates, and returns the top 5 highest risk lat/lng zones.
    """
    if _MODEL is None:
        return []
        
    # Get current time
    now = datetime.now()
    current_hour = now.hour
    current_day = now.weekday()
    
    # Create a 10x10 coordinate grid spanning the mock Bangalore bounds
    lats = np.linspace(12.85, 13.05, 10)
    lngs = np.linspace(77.5, 77.7, 10)
    
    grid_points = []
    for lat in lats:
        for lng in lngs:
            grid_points.append({
                "lat": lat,
                "lng": lng,
                "hour": current_hour,
                "day_of_week": current_day
            })
            
    X_pred = pd.DataFrame(grid_points)
    
    # Predict probabilities for each severity class
    probabilities = _MODEL.predict_proba(X_pred)
    classes_list = list(_MODEL.classes_)
    
    # Assign risk scores based on the likelihood of critical severity (Scores 3 & 4)
    results = []
    
    mock_zone_names = [
        "Whitefield", "Koramangala", "Indiranagar", "Marathahalli", 
        "HSR Layout", "Electronic City", "Malleswaram", "Jayanagar",
        "Hebbal", "Yelahanka", "BTM Layout", "Domlur"
    ]
    
    for i, point in enumerate(grid_points):
        risk_score = 0.0
        
        # Aggregate the probabilities of class 3 and 4
        for class_idx, class_val in enumerate(classes_list):
            if class_val >= 3:
                risk_score += probabilities[i][class_idx]
                
        # Generate a pseudo-random but localized zone name
        idx_hash = int(point["lat"] * 1000 + point["lng"] * 1000) % len(mock_zone_names)
        zone_name = f"{mock_zone_names[idx_hash]} Sector {(i % 9) + 1}"
        
        results.append({
            "lat": round(point["lat"], 4),
            "lng": round(point["lng"], 4),
            "risk_score": round(risk_score, 2),
            "zone_name": zone_name
        })
        
    # Sort strictly by the highest risk score 
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    
    # Return the top 5 risk zones
    return results[:5]

# Automatically call train sequence when the file is imported
train_hotspot_model()
