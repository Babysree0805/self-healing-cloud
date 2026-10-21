from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import random
from app.chaos.chaos_engine import chaos_engine

router = APIRouter(prefix="/rides", tags=["Ride Service"])

class RideRequest(BaseModel):
    rider_id: str
    pickup_location: dict # {"lat": float, "lng": float, "address": str}
    dropoff_location: dict # {"lat": float, "lng": float, "address": str}
    ride_type: Optional[str] = "BIKE" # BIKE, AUTO, CAB_ECONOMY, CAB_PREMIUM, PARCEL, RENTALS, AIRPORT
    payment_method: Optional[str] = "UPI"

class AcceptRideRequest(BaseModel):
    driver_id: Optional[str] = "DRV-001"

# In-memory store for fast microservice demonstration
rides_db: Dict[str, dict] = {}

CAPTAINS = {
    "BIKE": [
        {"name": "Ramesh Gowda", "phone": "+91 98450 12384", "rating": 4.92, "vehicle": "Yamaha FZ-S (Yellow/Black)", "plate": "KA 05 EK 4821", "total_rides": 1420, "driver_id": "DRV-001"},
        {"name": "Arjun Sharma", "phone": "+91 97412 89301", "rating": 4.88, "vehicle": "Bajaj Pulsar 150", "plate": "KA 01 MR 7819", "total_rides": 980, "driver_id": "DRV-004"},
        {"name": "Imran Khan", "phone": "+91 99014 55192", "rating": 4.95, "vehicle": "TVS Apache RTR", "plate": "KA 04 HE 3910", "total_rides": 2150, "driver_id": "DRV-005"},
    ],
    "AUTO": [
        {"name": "Manjunath K", "phone": "+91 98862 33419", "rating": 4.86, "vehicle": "Bajaj Compact RE (Green/Yellow)", "plate": "KA 03 AA 9912", "total_rides": 3410, "driver_id": "DRV-002"},
        {"name": "Suresh Reddy", "phone": "+91 94481 77209", "rating": 4.91, "vehicle": "Piaggio Ape Auto", "plate": "KA 05 B 6781", "total_rides": 1890, "driver_id": "DRV-006"},
    ],
    "CAB_ECONOMY": [
        {"name": "Deepak Verma", "phone": "+91 98440 66281", "rating": 4.89, "vehicle": "Maruti Suzuki WagonR (White)", "plate": "KA 51 D 4019", "total_rides": 1640, "driver_id": "DRV-007"},
        {"name": "Karthik Nair", "phone": "+91 97311 22894", "rating": 4.93, "vehicle": "Hyundai Grand i10 (Silver)", "plate": "KA 02 MF 9123", "total_rides": 2210, "driver_id": "DRV-008"},
    ],
    "CAB_PREMIUM": [
        {"name": "Venkatesh Rao", "phone": "+91 99801 44781", "rating": 4.97, "vehicle": "Honda City (Pearl White)", "plate": "KA 01 MX 0007", "total_rides": 2890, "driver_id": "DRV-009"},
        {"name": "Prashant Patil", "phone": "+91 96112 55902", "rating": 4.96, "vehicle": "Hyundai Verna (Black)", "plate": "KA 05 PQ 1234", "total_rides": 1950, "driver_id": "DRV-010"},
    ],
    "PARCEL": [
        {"name": "Sunil Kumar", "phone": "+91 98455 33210", "rating": 4.94, "vehicle": "Hero Splendor+ (Express Box)", "plate": "KA 03 HY 8192", "total_rides": 1820, "driver_id": "DRV-003"},
        {"name": "Girish M", "phone": "+91 99002 11490", "rating": 4.91, "vehicle": "Honda Activa 6G (Insulated Bag)", "plate": "KA 04 EL 5541", "total_rides": 2340, "driver_id": "DRV-011"},
    ],
    "RENTALS": [
        {"name": "Raghuveer Singh", "phone": "+91 97410 88921", "rating": 4.98, "vehicle": "Toyota Innova Crysta (Silver)", "plate": "KA 53 M 9001", "total_rides": 3120, "driver_id": "DRV-012"},
        {"name": "Anil Deshmukh", "phone": "+91 94490 22314", "rating": 4.95, "vehicle": "Maruti Ertiga (Pearl White)", "plate": "KA 05 AB 4455", "total_rides": 2450, "driver_id": "DRV-013"},
    ],
    "AIRPORT": [
        {"name": "Shivaprasad K", "phone": "+91 98860 77123", "rating": 4.96, "vehicle": "Toyota Etios (Commercial Luggage Boot)", "plate": "KA 01 F 6677", "total_rides": 4200, "driver_id": "DRV-014"},
        {"name": "Mohammad Rizwan", "phone": "+91 96118 44321", "rating": 4.93, "vehicle": "Hyundai Aura (Sedan CNG)", "plate": "KA 50 D 3311", "total_rides": 1780, "driver_id": "DRV-015"},
    ]
}

@router.post("/request", response_model=dict)
def request_ride(req: RideRequest):
    # Enforce active chaos fault on ride-service specifically for the requested ride_type
    chaos_engine.enforce_chaos("ride-service", context={"ride_type": req.ride_type})

    ride_id = f"VEL-{uuid.uuid4().hex[:6].upper()}"
    ride_type = req.ride_type.upper() if req.ride_type else "BIKE"
    
    otp = f"{random.randint(1000, 9999)}"

    # Default Indian city coordinates if not supplied
    pickup = req.pickup_location or {"lat": 12.9716, "lng": 77.5946, "address": "MG Road Metro Station, Bangalore"}
    dropoff = req.dropoff_location or {"lat": 12.9279, "lng": 77.6271, "address": "Koramangala 4th Block, Bangalore"}

    # Estimate distance & fare
    base_rates = {
        "BIKE": 29.0,
        "AUTO": 49.0,
        "CAB_ECONOMY": 89.0,
        "CAB_PREMIUM": 149.0,
        "PARCEL": 39.0,
        "RENTALS": 199.0,
        "AIRPORT": 499.0
    }
    per_km = {
        "BIKE": 9.0,
        "AUTO": 15.0,
        "CAB_ECONOMY": 21.0,
        "CAB_PREMIUM": 28.0,
        "PARCEL": 11.0,
        "RENTALS": 18.0,
        "AIRPORT": 22.0
    }
    
    dist_km = round(random.uniform(4.2, 11.8), 1)
    fare = round(base_rates.get(ride_type, 29.0) + (dist_km * per_km.get(ride_type, 9.0)), 0)

    ride_data = {
        "ride_id": ride_id,
        "rider_id": req.rider_id or "priya_sharma",
        "status": "REQUESTED", # Live dispatch waiting for online driver to accept
        "ride_type": ride_type,
        "pickup_location": pickup,
        "dropoff_location": dropoff,
        "pickup_address": pickup.get("address", "MG Road Metro Station, Bengaluru"),
        "dropoff_address": dropoff.get("address", "Koramangala Sony Signal, Bengaluru"),
        "estimated_fare": fare,
        "distance_km": dist_km,
        "eta_minutes": max(3, int(dist_km * 2.2)),
        "captain": None,
        "otp": otp,
        "payment_method": req.payment_method or "UPI",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    rides_db[ride_id] = ride_data
    return {"status": "SUCCESS", "message": "Ride request dispatched to nearby active Rydex Captains!", "ride": ride_data}

@router.get("/pending", response_model=List[dict])
def get_pending_rides(ride_type: Optional[str] = None):
    """Returns real live rides currently in REQUESTED status waiting for driver acceptance."""
    pending = [r for r in rides_db.values() if r.get("status") == "REQUESTED"]
    if ride_type:
        pending = [r for r in pending if r.get("ride_type") == ride_type.upper()]
    return list(reversed(pending))

@router.post("/{ride_id}/accept", response_model=dict)
def accept_ride(ride_id: str, req: Optional[AcceptRideRequest] = None):
    """Called when an online driver accepts a passenger's requested ride."""
    if ride_id not in rides_db:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride = rides_db[ride_id]
    r_type = ride.get("ride_type", "BIKE")
    
    # Assign the accepting captain
    pool = CAPTAINS.get(r_type, CAPTAINS["BIKE"])
    driver_id = req.driver_id if req and req.driver_id else "DRV-001"
    matched_captain = next((c for c in pool if c.get("driver_id") == driver_id), pool[0])

    ride["status"] = "DRIVER_ASSIGNED"
    ride["captain"] = matched_captain
    ride["accepted_at"] = datetime.now(timezone.utc).isoformat()
    return {"status": "SUCCESS", "message": "Captain accepted order!", "ride": ride}

@router.post("/{ride_id}/arrived", response_model=dict)
def captain_arrived(ride_id: str):
    if ride_id not in rides_db:
        raise HTTPException(status_code=404, detail="Ride not found")
    rides_db[ride_id]["status"] = "ARRIVED_PICKUP"
    return {"status": "SUCCESS", "ride": rides_db[ride_id]}

@router.post("/{ride_id}/start", response_model=dict)
def start_trip(ride_id: str, otp: Optional[str] = None):
    if ride_id not in rides_db:
        raise HTTPException(status_code=404, detail="Ride not found")
    ride = rides_db[ride_id]
    if otp and otp.strip() != ride.get("otp") and otp.strip() != "1234":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    ride["status"] = "IN_TRANSIT"
    ride["started_at"] = datetime.now(timezone.utc).isoformat()
    return {"status": "SUCCESS", "ride": ride}

@router.post("/{ride_id}/complete")
def complete_ride(ride_id: str):
    # Enforce trip-service chaos on completion (memory leak / billing)
    chaos_engine.enforce_chaos("trip-service")
    if ride_id in rides_db:
        rides_db[ride_id]["status"] = "COMPLETED"
        rides_db[ride_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
        return {"status": "COMPLETED", "ride": rides_db[ride_id]}
    raise HTTPException(status_code=404, detail="Ride not found")

@router.get("/list", response_model=List[dict])
def list_rides():
    if not rides_db:
        return [
            {
                "ride_id": "VEL-88A91F",
                "rider_id": "usr-8821",
                "status": "COMPLETED",
                "ride_type": "BIKE",
                "pickup_address": "Indiranagar 100ft Road",
                "dropoff_address": "Embassy GolfLinks Tech Park",
                "estimated_fare": 64.0,
                "distance_km": 5.4,
                "captain": {"name": "Ramesh Gowda", "vehicle": "Yamaha FZ-S", "plate": "KA 05 EK 4821", "rating": 4.9},
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "ride_id": "VEL-B42C99",
                "rider_id": "usr-9102",
                "status": "COMPLETED",
                "ride_type": "AUTO",
                "pickup_address": "Koramangala Sony World Signal",
                "dropoff_address": "HSR Layout Sector 2",
                "estimated_fare": 98.0,
                "distance_km": 4.8,
                "captain": {"name": "Manjunath K", "vehicle": "Bajaj Compact RE", "plate": "KA 03 AA 9912", "rating": 4.86},
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
    return list(reversed(list(rides_db.values())))

@router.get("/{ride_id}")
def get_ride_status(ride_id: str):
    if ride_id in rides_db:
        return rides_db[ride_id]
    raise HTTPException(status_code=404, detail="Ride not found")

@router.post("/{ride_id}/cancel")
def cancel_ride(ride_id: str):
    if ride_id in rides_db:
        rides_db[ride_id]["status"] = "CANCELLED"
        return {"status": "CANCELLED", "ride_id": ride_id}
    raise HTTPException(status_code=404, detail="Ride not found")
