import os
import math
import requests

# 8 hardcoded mock traffic signals around Bangalore
SIGNALS = [
    {"id": "sig-001", "name": "Madiwala Junction", "lat": 12.9226, "lng": 77.6174},
    {"id": "sig-002", "name": "Silk Board Junction", "lat": 12.9176, "lng": 77.6238},
    {"id": "sig-003", "name": "Sony World Junction", "lat": 12.9365, "lng": 77.6254},
    {"id": "sig-004", "name": "Domlur Junction", "lat": 12.9569, "lng": 77.6387},
    {"id": "sig-005", "name": "Trinity Circle", "lat": 12.9734, "lng": 77.6165},
    {"id": "sig-006", "name": "Richmond Circle", "lat": 12.9647, "lng": 77.5971},
    {"id": "sig-007", "name": "Corporation Circle", "lat": 12.9658, "lng": 77.5866},
    {"id": "sig-008", "name": "Mekhri Circle", "lat": 13.0152, "lng": 77.5846}
]

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates distance in metres between two GPS points."""
    R = 6371000.0  # Earth radius in metres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
        
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def decode_polyline(polyline_str: str) -> list:
    """Decodes Google's encoded polyline format into a list of lat/lng tuples."""
    index, lat, lng = 0, 0, 0
    coordinates = []
    changes = {'lat': 0, 'lng': 0}

    while index < len(polyline_str):
        for unit in ['lat', 'lng']: 
            shift, result = 0, 0
            while True:
                byte = ord(polyline_str[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if not byte >= 0x20:
                    break
            
            if (result & 1):
                changes[unit] = ~(result >> 1)
            else:
                changes[unit] = (result >> 1)
        
        lat += changes['lat']
        lng += changes['lng']
        
        coordinates.append((lat / 100000.0, lng / 100000.0))
        
    return coordinates

def assign_signal_states(route_coords: list, total_distance: float) -> list:
    AMBULANCE_SPEED_KMPH = 60.0
    speed_mps = AMBULANCE_SPEED_KMPH * (1000.0 / 3600.0)  # ~16.67 m/s
    
    signal_states = []
    
    for signal in SIGNALS:
        min_dist_to_route = float('inf')
        closest_point_idx = 0
        
        # Find the minimum distance from signal to any point on the route
        for idx, coord in enumerate(route_coords):
            dist = haversine_distance(signal["lat"], signal["lng"], coord["lat"], coord["lng"])
            if dist < min_dist_to_route:
                min_dist_to_route = dist
                closest_point_idx = idx
        
        # Check if the signal is within 80m of the route
        if min_dist_to_route <= 80:
            state = "green"
        else:
            state = "red"
            
        # Calculate distance from origin to the closest point on route to this signal
        dist_to_signal_on_route = 0.0
        for i in range(1, closest_point_idx + 1):
            dist_to_signal_on_route += haversine_distance(
                route_coords[i-1]["lat"], route_coords[i-1]["lng"],
                route_coords[i]["lat"], route_coords[i]["lng"]
            )
            
        eta_seconds = dist_to_signal_on_route / speed_mps
        
        # Pre-clear each green signal 30 seconds before ambulance arrives
        # If ETA is less than 30s, pre-clear time will be 0 (clear immediately)
        clear_time_seconds = max(0.0, eta_seconds - 30.0) if state == "green" else None
        
        signal_state = {
            "id": signal["id"],
            "name": signal["name"],
            "lat": signal["lat"],
            "lng": signal["lng"],
            "state": state,
            "eta_seconds": round(eta_seconds, 2),
            "clear_time_seconds": round(clear_time_seconds, 2) if clear_time_seconds is not None else None
        }
        signal_states.append(signal_state)
        
    return signal_states

def generate_corridor(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict:
    api_key = os.environ.get("GOOGLE_API_KEY")
    route_coords = []
    distance_metres = 0.0
    
    # Try Google Directions API
    api_success = False
    if api_key:
        try:
            url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin_lat},{origin_lng}&destination={dest_lat},{dest_lng}&key={api_key}"
            response = requests.get(url, timeout=5)
            data = response.json()
            
            if data.get("status") == "OK":
                polyline_str = data["routes"][0]["overview_polyline"]["points"]
                tuples = decode_polyline(polyline_str)
                # Convert tuples to list of dicts as expected by frontend / state
                route_coords = [{"lat": lat, "lng": lng} for lat, lng in tuples]
                distance_metres = float(data["routes"][0]["legs"][0]["distance"]["value"])
                api_success = True
        except Exception:
            pass
            
    # Fallback to 10 points mock straight line if API fails or no key
    if not api_success:
        num_points = 10
        route_coords = []
        for i in range(num_points):
            fraction = i / (num_points - 1)
            lat = origin_lat + (dest_lat - origin_lat) * fraction
            lng = origin_lng + (dest_lng - origin_lng) * fraction
            route_coords.append({"lat": lat, "lng": lng})
            
        # Total distance for mock route
        distance_metres = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        
    signals = assign_signal_states(route_coords, distance_metres)
    green_count = sum(1 for s in signals if s["state"] == "green")
    
    speed_mps = 60.0 * (1000.0 / 3600.0)
    eta_seconds = distance_metres / speed_mps

    return {
        "route_coords": route_coords,
        "signals": signals,
        "eta_seconds": round(eta_seconds, 2),
        "distance_metres": round(distance_metres, 2),
        "green_count": green_count,
        "corridor_active": True
    }
