import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"

def test_auth_service():
    response = client.post("/api/v1/auth/login", json={
        "username": "sre_lead",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] in ["admin", "sre_engineer"]

def test_ride_service():
    response = client.post("/api/v1/rides/request", json={
        "rider_id": "usr-test-1",
        "pickup_location": {"address": "100 Market St", "lat": 37.77, "lng": -122.41},
        "dropoff_location": {"address": "500 Howard St", "lat": 37.78, "lng": -122.40},
        "ride_type": "PREMIUM"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "ride_id" in data["ride"]

def test_driver_service():
    response = client.get("/api/v1/drivers/list")
    assert response.status_code == 200
    drivers = response.json()
    assert len(drivers) > 0

def test_trip_service():
    response = client.get("/api/v1/trips/list")
    assert response.status_code == 200
    trips = response.json()
    assert len(trips) > 0

def test_pricing_service():
    response = client.post("/api/v1/pricing/estimate", json={
        "distance_km": 10.5,
        "estimated_duration_min": 18.0,
        "ride_type": "STANDARD",
        "demand_multiplier": 1.2
    })
    assert response.status_code == 200
    data = response.json()
    assert data["estimated_total_fare"] > 0

def test_location_service():
    response = client.get("/api/v1/location/nearby?lat=37.7749&lng=-122.4194&radius_km=10.0")
    assert response.status_code == 200
    data = response.json()
    assert "drivers" in data

def test_notification_service():
    response = client.post("/api/v1/notifications/send", json={
        "title": "Test SRE Alert",
        "message": "Testing alert bus dispatch",
        "channel": "SLACK",
        "severity": "INFO"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DELIVERED"
