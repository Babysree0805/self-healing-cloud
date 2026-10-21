from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from app.chaos.chaos_engine import chaos_engine

router = APIRouter(prefix="/drivers", tags=["Driver Service"])

class DriverUpdate(BaseModel):
    driver_id: str
    status: str # AVAILABLE, BUSY, OFFLINE
    lat: float
    lng: float

# Initial realistic driver fleet matching Rapido Bangalore operations
drivers_db = {
    "DRV-001": {
        "driver_id": "DRV-001",
        "name": "Ramesh Gowda",
        "service_type": "BIKE",
        "vehicle": "Yamaha FZ-S (Yellow/Black)",
        "plate": "KA 05 EK 4821",
        "rating": 4.92,
        "status": "AVAILABLE",
        "location": {"lat": 12.9716, "lng": 77.5946},
        "total_trips": 1420,
        "today_earnings": 1480.0,
        "today_trips": 12,
        "acceptance_rate": 98.4,
        "duty_hours": 6.5
    },
    "DRV-002": {
        "driver_id": "DRV-002",
        "name": "Manjunath K",
        "service_type": "AUTO",
        "vehicle": "Bajaj Compact RE (Green/Yellow)",
        "plate": "KA 03 AA 9912",
        "rating": 4.86,
        "status": "AVAILABLE",
        "location": {"lat": 12.9352, "lng": 77.6245},
        "total_trips": 3410,
        "today_earnings": 2150.0,
        "today_trips": 16,
        "acceptance_rate": 96.0,
        "duty_hours": 7.8
    },
    "DRV-003": {
        "driver_id": "DRV-003",
        "name": "Sunil Kumar",
        "service_type": "PARCEL",
        "vehicle": "Hero Splendor+ (Express Box)",
        "plate": "KA 03 HY 8192",
        "rating": 4.94,
        "status": "AVAILABLE",
        "location": {"lat": 12.9784, "lng": 77.6408},
        "total_trips": 1820,
        "today_earnings": 1220.0,
        "today_trips": 9,
        "acceptance_rate": 99.1,
        "duty_hours": 5.2
    }
}

@router.get("/list", response_model=List[dict])
def list_drivers():
    chaos_engine.enforce_chaos("driver-service")
    return list(drivers_db.values())

@router.get("/available", response_model=List[dict])
def get_available_drivers():
    chaos_engine.enforce_chaos("driver-service")
    return [d for d in drivers_db.values() if d["status"] == "AVAILABLE"]

@router.get("/{driver_id}/stats")
def get_driver_stats(driver_id: str):
    chaos_engine.enforce_chaos("driver-service")
    driver = drivers_db.get(driver_id, drivers_db["DRV-001"])
    return {
        "driver_id": driver["driver_id"],
        "name": driver["name"],
        "vehicle": driver["vehicle"],
        "plate": driver["plate"],
        "rating": driver["rating"],
        "status": driver["status"],
        "today_earnings": driver.get("today_earnings", 1480.0),
        "today_trips": driver.get("today_trips", 12),
        "acceptance_rate": driver.get("acceptance_rate", 98.4),
        "duty_hours": driver.get("duty_hours", 6.5),
        "incentive_target": 15,
        "incentive_bonus": 300.0,
        "wallet_balance": 3420.50
    }

@router.post("/{driver_id}/duty")
def set_driver_duty(driver_id: str, is_online: bool):
    chaos_engine.enforce_chaos("driver-service")
    status = "AVAILABLE" if is_online else "OFFLINE"
    if driver_id in drivers_db:
        drivers_db[driver_id]["status"] = status
        return {"status": "SUCCESS", "driver_id": driver_id, "duty_status": status}
    return {"status": "SUCCESS", "driver_id": driver_id, "duty_status": status}

@router.post("/{driver_id}/complete-trip")
def driver_complete_trip(driver_id: str, fare_amount: float = 85.0):
    chaos_engine.enforce_chaos("driver-service")
    if driver_id in drivers_db:
        drivers_db[driver_id]["today_earnings"] += fare_amount
        drivers_db[driver_id]["today_trips"] += 1
        return {"status": "SUCCESS", "earnings": drivers_db[driver_id]["today_earnings"]}
    return {"status": "SUCCESS", "earnings": fare_amount}

@router.post("/telemetry")
def update_driver_telemetry(update: DriverUpdate):
    if update.driver_id in drivers_db:
        drivers_db[update.driver_id]["status"] = update.status
        drivers_db[update.driver_id]["location"] = {"lat": update.lat, "lng": update.lng}
        return {"status": "SUCCESS", "driver": drivers_db[update.driver_id]}
    return {"status": "UPDATED", "driver_id": update.driver_id}
