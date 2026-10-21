from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.chaos.chaos_engine import chaos_engine

router = APIRouter(prefix="/pricing", tags=["Pricing Service"])

class FareEstimateRequest(BaseModel):
    distance_km: float
    estimated_duration_min: float
    ride_type: Optional[str] = "BIKE"
    demand_multiplier: Optional[float] = 1.0

@router.post("/estimate")
def calculate_fare(req: FareEstimateRequest):
    chaos_engine.enforce_chaos("pricing-service")

    base_rates = {"BIKE": 29.0, "AUTO": 49.0, "CAB_ECONOMY": 89.0, "CAB_PREMIUM": 149.0}
    per_km = {"BIKE": 9.0, "AUTO": 15.0, "CAB_ECONOMY": 21.0, "CAB_PREMIUM": 28.0}
    
    ride_type = req.ride_type.upper() if req.ride_type else "BIKE"
    base = base_rates.get(ride_type, 29.0)
    km_rate = per_km.get(ride_type, 9.0)
    
    subtotal = base + (req.distance_km * km_rate)
    final_fare = round(subtotal * (req.demand_multiplier or 1.0), 0)
    
    return {
        "ride_type": ride_type,
        "base_fare": base,
        "distance_km": req.distance_km,
        "estimated_duration_min": req.estimated_duration_min,
        "surge_multiplier": req.demand_multiplier,
        "estimated_total_fare": final_fare,
        "currency": "INR"
    }

@router.get("/categories")
def get_all_categories_estimate(distance_km: float = 6.5, duration_min: float = 18.0):
    chaos_engine.enforce_chaos("pricing-service")

    categories = [
        {
            "id": "BIKE",
            "name": "Velocity Bike",
            "tagline": "Beat the traffic, zero delay",
            "icon": "bike",
            "base_fare": 29.0,
            "fare": round(29.0 + (distance_km * 9.0), 0),
            "eta_mins": 3,
            "duration_mins": max(10, int(duration_min * 0.7)),
            "per_km": 9.0,
            "badge": "FASTEST",
            "helmet_provided": True
        },
        {
            "id": "AUTO",
            "name": "Velocity Auto",
            "tagline": "Doorstep pickup, meter-free",
            "icon": "auto",
            "base_fare": 49.0,
            "fare": round(49.0 + (distance_km * 15.0), 0),
            "eta_mins": 4,
            "duration_mins": int(duration_min),
            "per_km": 15.0,
            "badge": "POPULAR",
            "helmet_provided": False
        },
        {
            "id": "CAB_ECONOMY",
            "name": "Velocity Comfort",
            "tagline": "Air-conditioned compact cab",
            "icon": "car",
            "base_fare": 89.0,
            "fare": round(89.0 + (distance_km * 21.0), 0),
            "eta_mins": 6,
            "duration_mins": int(duration_min * 1.1),
            "per_km": 21.0,
            "badge": "VALUE",
            "helmet_provided": False
        },
        {
            "id": "CAB_PREMIUM",
            "name": "Velocity Prime Sedan",
            "tagline": "Top captains & extra legroom",
            "icon": "sedan",
            "base_fare": 149.0,
            "fare": round(149.0 + (distance_km * 28.0), 0),
            "eta_mins": 8,
            "duration_mins": int(duration_min * 1.1),
            "per_km": 28.0,
            "badge": "PREMIUM",
            "helmet_provided": False
        },
        {
            "id": "PARCEL",
            "name": "Rapido Parcel",
            "tagline": "Doorstep instant package courier",
            "icon": "package",
            "base_fare": 39.0,
            "fare": round(39.0 + (distance_km * 11.0), 0),
            "eta_mins": 5,
            "duration_mins": int(duration_min * 0.9),
            "per_km": 11.0,
            "badge": "EXPRESS",
            "helmet_provided": False
        },
        {
            "id": "RENTALS",
            "name": "Velocity Rentals",
            "tagline": "Hourly packages with multiple stops",
            "icon": "clock",
            "base_fare": 199.0,
            "fare": round(199.0 + (distance_km * 18.0), 0),
            "eta_mins": 7,
            "duration_mins": 60,
            "per_km": 18.0,
            "badge": "HOURLY",
            "helmet_provided": False
        },
        {
            "id": "AIRPORT",
            "name": "Airport Express",
            "tagline": "Direct airport drop with luggage trunk",
            "icon": "plane",
            "base_fare": 499.0,
            "fare": round(499.0 + (distance_km * 22.0), 0),
            "eta_mins": 10,
            "duration_mins": max(45, int(duration_min * 1.8)),
            "per_km": 22.0,
            "badge": "FLAT RATE",
            "helmet_provided": False
        }
    ]

    return {
        "distance_km": distance_km,
        "base_duration_mins": duration_min,
        "currency": "INR",
        "categories": categories
    }

@router.get("/surge-status")
def get_surge_status():
    chaos_engine.enforce_chaos("pricing-service")
    return {
        "zone": "Bangalore Tech Corridor (Outer Ring Road)",
        "current_surge": 1.15,
        "demand_level": "MODERATE",
        "active_riders": 842,
        "available_captains": 312
    }
