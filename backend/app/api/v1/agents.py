import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.agent_log import AgentLog
from app.schemas.schemas import AgentLogResponse
from app.agents.workflow import recent_agent_events, execute_self_healing_pipeline

router = APIRouter(prefix="/agents", tags=["Agent Activity & LangGraph Engine"])

@router.get("/logs", response_model=List[AgentLogResponse])
def get_agent_logs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AgentLog).order_by(AgentLog.timestamp.desc()).limit(limit).all()

@router.get("/live-stream")
def get_live_agent_stream():
    """Returns the latest in-memory agent reasoning stream"""
    return recent_agent_events[-30:]

@router.post("/trigger-heal/{service_name}")
async def trigger_manual_self_heal(service_name: str, background_tasks: BackgroundTasks):
    telemetry = {
        "cpu_usage": 92.0,
        "memory_usage": 88.0,
        "latency_ms": 1200.0,
        "error_rate": 8.0,
        "pod_status": "Running"
    }
    background_tasks.add_task(execute_self_healing_pipeline, service_name, telemetry)
    return {"status": "TRIGGERED", "message": f"Autonomous self-healing initiated for {service_name}"}
