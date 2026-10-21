from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import math
from app.chaos.chaos_engine import chaos_engine

router = APIRouter(prefix="/location", tags=["Location Service"])

class Coordinate(BaseModel):
    entity_id: str
    entity_type: str # DRIVER or RIDER
    lat: float
    lng: float
    heading: float = 0.0
    speed_kmh: float = 0.0

# In-memory fast spatial store for Bangalore fleet
live_locations = {
    "DRV-001": {"lat": 12.9716, "lng": 77.5946, "speed": 34.0, "type": "DRIVER", "heading": 90},
    "DRV-002": {"lat": 12.9352, "lng": 77.6245, "speed": 22.0, "type": "DRIVER", "heading": 180},
    "DRV-003": {"lat": 12.9784, "lng": 77.6408, "speed": 40.0, "type": "DRIVER", "heading": 45},
    "DRV-004": {"lat": 12.9279, "lng": 77.6271, "speed": 28.0, "type": "DRIVER", "heading": 270},
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@router.post("/update")
def update_coordinates(coord: Coordinate):
    chaos_engine.enforce_chaos("location-service")
    live_locations[coord.entity_id] = {
        "lat": coord.lat,
        "lng": coord.lng,
        "speed": coord.speed_kmh,
        "type": coord.entity_type,
        "heading": coord.heading
    }
    return {"status": "SUCCESS", "entity_id": coord.entity_id}

@router.get("/nearby")
def find_nearby_drivers(lat: float = 12.9716, lng: float = 77.5946, radius_km: float = 8.0):
    chaos_engine.enforce_chaos("location-service")
    results = []
    for entity_id, loc in live_locations.items():
        if loc["type"] == "DRIVER":
            dist = haversine_distance(lat, lng, loc["lat"], loc["lng"])
            if dist <= radius_km:
                results.append({
                    "driver_id": entity_id,
                    "distance_km": dist,
                    "location": {"lat": loc["lat"], "lng": loc["lng"]},
                    "heading": loc.get("heading", 0),
                    "speed": loc.get("speed", 30)
                })
    return {"count": len(results), "drivers": sorted(results, key=lambda x: x["distance_km"])}

