import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chaos_injection_cpu():
    response = client.post("/api/v1/chaos/inject", json={
        "service_name": "trip-service",
        "failure_type": "CPU_SPIKE",
        "intensity": 1.5,
        "duration_seconds": 30
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INJECTED"
    assert data["failure_type"] == "CPU_SPIKE"

def test_chaos_injection_memory():
    response = client.post("/api/v1/chaos/inject", json={
        "service_name": "driver-service",
        "failure_type": "MEMORY_LEAK",
        "intensity": 1.0,
        "duration_seconds": 30
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INJECTED"

def test_chaos_clear():
    response = client.post("/api/v1/chaos/clear/trip-service")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CLEARED"

def test_chaos_reset_all():
    response = client.post("/api/v1/chaos/reset-all")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ALL_FAULTS_CLEARED"
