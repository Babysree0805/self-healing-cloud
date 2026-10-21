from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from app.chaos.chaos_engine import chaos_engine

router = APIRouter(prefix="/trips", tags=["Trip Service"])

class TripCreate(BaseModel):
    ride_id: str
    driver_id: str
    fare_amount: float
    distance_km: float

trips_db = {
    "TRIP-1001": {
        "trip_id": "TRIP-1001",
        "ride_id": "VEL-88A91F",
        "driver_id": "DRV-001",
        "status": "RIDE_STARTED", # REQUESTED -> DRIVER_ASSIGNED -> DRIVER_ARRIVING -> RIDE_STARTED -> COMPLETED
        "fare_amount": 64.0,
        "distance_km": 5.4,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
}

VALID_STATUSES = [
    "REQUESTED",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "RIDE_STARTED",
    "COMPLETED"
]

@router.get("/list", response_model=List[dict])
def list_trips():
    chaos_engine.enforce_chaos("trip-service")
    return list(trips_db.values())

@router.post("/create")
def create_trip(trip_in: TripCreate):
    chaos_engine.enforce_chaos("trip-service")
    trip_id = f"TRIP-{uuid.uuid4().hex[:6].upper()}"
    new_trip = {
        "trip_id": trip_id,
        "ride_id": trip_in.ride_id,
        "driver_id": trip_in.driver_id,
        "status": "REQUESTED",
        "fare_amount": trip_in.fare_amount,
        "distance_km": trip_in.distance_km,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    trips_db[trip_id] = new_trip
    return {"status": "SUCCESS", "trip": new_trip}

@router.put("/{trip_id}/status")
def update_trip_status(trip_id: str, new_status: str):
    chaos_engine.enforce_chaos("trip-service")
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {VALID_STATUSES}")
    
    if trip_id not in trips_db:
        trips_db[trip_id] = {
            "trip_id": trip_id,
            "ride_id": "VEL-AUTO",
            "driver_id": "DRV-001",
            "status": new_status,
            "fare_amount": 49.0,
            "distance_km": 4.5,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        trips_db[trip_id]["status"] = new_status
        trips_db[trip_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        
    return {"status": "UPDATED", "trip": trips_db[trip_id]}
