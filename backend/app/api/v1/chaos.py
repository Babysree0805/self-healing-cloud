import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from datetime import datetime, timezone
from app.chaos.chaos_engine import chaos_engine
from app.schemas.schemas import ChaosInjectRequest, ChaosInjectResponse
from app.core.database import SessionLocal
from app.models.service import Service
from app.agents.workflow import execute_self_healing_pipeline

router = APIRouter(prefix="/chaos", tags=["Chaos & Failure Simulation"])

@router.post("/inject", response_model=ChaosInjectResponse)
async def inject_chaos_fault(req: ChaosInjectRequest, background_tasks: BackgroundTasks):
    valid_types = [
        "CPU_SPIKE", 
        "MEMORY_LEAK", 
        "SERVICE_CRASH", 
        "TRAFFIC_OVERLOAD", 
        "DB_BOTTLENECK", 
        "NETWORK_PARTITION"
    ]
    if req.failure_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid failure type '{req.failure_type}'. Must be one of: {valid_types}"
        )
    
    result = chaos_engine.inject_failure(
        service_name=req.service_name,
        failure_type=req.failure_type,
        intensity=req.intensity or 1.0,
        duration=req.duration_seconds or 60
    )

    # Immediately mark service state in DB
    telemetry = {
        "cpu_usage": 98.0 if req.failure_type == "CPU_SPIKE" else 30.0,
        "memory_usage": 95.0 if req.failure_type == "MEMORY_LEAK" else 35.0,
        "latency_ms": 2200.0 if req.failure_type == "DB_BOTTLENECK" else (1450.0 if req.failure_type == "TRAFFIC_OVERLOAD" else 45.0),
        "error_rate": 100.0 if req.failure_type == "SERVICE_CRASH" else (45.0 if req.failure_type == "NETWORK_PARTITION" else 12.5),
        "pod_status": "CrashLoopBackOff" if req.failure_type == "SERVICE_CRASH" else "Running"
    }

    try:
        db = SessionLocal()
        srv = db.query(Service).filter(Service.service_name == req.service_name).first()
        if srv:
            srv.status = "CRITICAL" if req.failure_type in ["SERVICE_CRASH", "NETWORK_PARTITION"] else "DEGRADED"
            srv.health = 0.0 if req.failure_type == "SERVICE_CRASH" else 35.0
            srv.cpu_usage = telemetry["cpu_usage"]
            srv.memory_usage = telemetry["memory_usage"]
            srv.latency_ms = telemetry["latency_ms"]
            srv.error_rate = telemetry["error_rate"]
            db.commit()
        db.close()
    except Exception:
        pass

    # Immediately dispatch self-healing in background task so demo countdown starts now
    asyncio.create_task(execute_self_healing_pipeline(req.service_name, telemetry))
    
    return ChaosInjectResponse(
        status="INJECTED",
        service_name=req.service_name,
        failure_type=req.failure_type,
        message=f"Fault '{req.failure_type}' successfully injected into '{req.service_name}'. Autonomous LangGraph AI SRE Agents actively remediating.",
        timestamp=datetime.now(timezone.utc)
    )

@router.post("/clear/{service_name}")
def clear_service_chaos(service_name: str):
    return chaos_engine.clear_fault(service_name)

@router.post("/reset-all")
def reset_all_chaos():
    return chaos_engine.reset_all()

@router.get("/active-faults", response_model=List[dict])
def get_active_chaos_faults():
    return chaos_engine.get_all_faults()
