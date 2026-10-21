import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.chaos.chaos_engine import chaos_engine

client = TestClient(app)

def test_velocity_booking_nominal_success():
    chaos_engine.reset_all()
    payload = {
        "rider_id": "test-rider",
        "pickup_location": {"address": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
        "dropoff_location": {"address": "Koramangala", "lat": 12.9352, "lng": 77.6245},
        "ride_type": "BIKE"
    }
    res = client.post("/api/v1/rides/request", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "ride" in data
    assert data["ride"]["ride_type"] == "BIKE"
    assert "captain" in data["ride"]
    assert "otp" in data["ride"]

def test_velocity_booking_real_db_chaos_failure():
    # Inject DB_BOTTLENECK into ride-service (simulating Admin Dashboard chaos spike)
    chaos_engine.inject_failure("ride-service", "DB_BOTTLENECK", 1.0, 60)
    
    payload = {
        "rider_id": "test-rider",
        "pickup_location": {"address": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
        "dropoff_location": {"address": "Koramangala", "lat": 12.9352, "lng": 77.6245},
        "ride_type": "BIKE"
    }
    # This must fail with HTTP 500 (database lock timeout)
    res = client.post("/api/v1/rides/request", json=payload)
    assert res.status_code == 500
    assert "Database lock" in res.json()["detail"]

def test_velocity_booking_pod_crash_failure():
    # Inject SERVICE_CRASH into ride-service
    chaos_engine.inject_failure("ride-service", "SERVICE_CRASH", 1.0, 60)
    
    payload = {
        "rider_id": "test-rider",
        "pickup_location": {"address": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
        "dropoff_location": {"address": "Koramangala", "lat": 12.9352, "lng": 77.6245},
        "ride_type": "AUTO"
    }
    # This must fail with HTTP 503 (CrashLoopBackOff)
    res = client.post("/api/v1/rides/request", json=payload)
    assert res.status_code == 503
    assert "CrashLoopBackOff" in res.json()["detail"]

def test_velocity_booking_recovery_after_healing():
    # Simulate Autonomous AI SRE clearing the fault / restarting pod
    chaos_engine.clear_fault("ride-service")
    chaos_engine.clear_fault("trip-service")
    
    payload = {
        "rider_id": "test-rider",
        "pickup_location": {"address": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
        "dropoff_location": {"address": "Koramangala", "lat": 12.9352, "lng": 77.6245},
        "ride_type": "CAB_PREMIUM"
    }
    # Once healed, booking succeeds immediately
    res = client.post("/api/v1/rides/request", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["ride"]["ride_type"] == "CAB_PREMIUM"
    assert data["ride"]["captain"]["name"] is not None
