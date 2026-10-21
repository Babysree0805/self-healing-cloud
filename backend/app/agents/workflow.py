import asyncio
import logging
import uuid
import random
from typing import Dict, Any, List, Set
from datetime import datetime, timezone
from langgraph.graph import StateGraph, END
from app.agents.state import SREState
from app.agents.monitoring_agent import run_monitoring_agent
from app.agents.anomaly_agent import run_anomaly_agent
from app.agents.rca_agent import run_rca_agent
from app.agents.planner_agent import run_planner_agent
from app.agents.execution_agent import run_execution_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.knowledge_base import run_knowledge_base_agent
from app.k8s_runtime.k8s_controller import k8s_controller
from app.chaos.chaos_engine import chaos_engine
from app.core.database import SessionLocal
from app.models.incident import Incident
from app.models.service import Service

logger = logging.getLogger("sre_workflow")

# Real-time event queue for SSE / WebSockets stream
live_event_subscribers: List[asyncio.Queue] = []

# Guard to avoid multiple simultaneous healing runs on the same service
active_healing_services: Set[str] = set()

async def broadcast_agent_event(event_type: str, data: dict):
    """Broadcasts live agent step or telemetry event to connected frontend clients."""
    payload = {
        "event_type": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    dead_queues = []
    for q in list(live_event_subscribers):
        try:
            q.put_nowait(payload)
        except Exception:
            dead_queues.append(q)
    for dq in dead_queues:
        if dq in live_event_subscribers:
            live_event_subscribers.remove(dq)

def should_continue_to_anomaly(state: SREState) -> str:
    if state.get("status") == "MONITORING_DONE":
        return "anomaly_detection"
    return END

def should_continue_to_rca(state: SREState) -> str:
    if state.get("status") == "ANOMALY_CONFIRMED":
        return "root_cause_analysis"
    return END

def build_sre_graph():
    """Builds and compiles the LangGraph Multi-Agent StateGraph"""
    workflow = StateGraph(SREState)

    # 1. Define nodes
    workflow.add_node("monitoring", run_monitoring_agent)
    workflow.add_node("anomaly_detection", run_anomaly_agent)
    workflow.add_node("root_cause_analysis", run_rca_agent)
    workflow.add_node("recovery_planner", run_planner_agent)
    workflow.add_node("execution", run_execution_agent)
    workflow.add_node("validation", run_validation_agent)
    workflow.add_node("knowledge_base", run_knowledge_base_agent)

    # 2. Set entry point
    workflow.set_entry_point("monitoring")

    # 3. Add edges
    workflow.add_conditional_edges("monitoring", should_continue_to_anomaly, {
        "anomaly_detection": "anomaly_detection",
        END: END
    })
    workflow.add_conditional_edges("anomaly_detection", should_continue_to_rca, {
        "root_cause_analysis": "root_cause_analysis",
        END: END
    })
    workflow.add_edge("root_cause_analysis", "recovery_planner")
    workflow.add_edge("recovery_planner", "execution")
    workflow.add_edge("execution", "validation")
    workflow.add_edge("validation", "knowledge_base")
    workflow.add_edge("knowledge_base", END)

    return workflow.compile()

# Compile global SRE graph
sre_agent_graph = build_sre_graph()

# In-memory latest agent thoughts stream for UI (capped)
recent_agent_events: List[dict] = []

def record_recent_event(event_dict: dict):
    recent_agent_events.append(event_dict)
    if len(recent_agent_events) > 80:
        recent_agent_events.pop(0)

# Calibrated demonstration healing timings (4s to 10s per fault type)
FAULT_HEAL_TIMINGS = {
    "CPU_SPIKE": {
        "duration": 4.2,
        "step_delay": 0.70, # 6 steps * 0.70s = 4.2s
        "complexity": "EASY",
        "action": "CPU CFS Quota Rebalance & Thread Optimization",
        "description": "Pricing computation thread contention cleared",
    },
    "TRAFFIC_OVERLOAD": {
        "duration": 5.5,
        "step_delay": 0.90, # 6 steps * 0.90s = 5.4s
        "complexity": "EASY-MEDIUM",
        "action": "HPA Horizontal Pod Auto-Scale to 4 Replicas",
        "description": "Bike Taxi fleet rate limit restored, queue cleared",
    },
    "SERVICE_CRASH": {
        "duration": 7.0,
        "step_delay": 1.15, # 6 steps * 1.15s = 6.9s
        "complexity": "MEDIUM",
        "action": "Kubernetes Container Restart & GPS Socket Remount",
        "description": "Location GPS stream & driver radar re-established",
    },
    "NETWORK_PARTITION": {
        "duration": 8.2,
        "step_delay": 1.35, # 6 steps * 1.35s = 8.1s
        "complexity": "MEDIUM-COMPLEX",
        "action": "Calico Network Policy Flush & Envoy Route Reset",
        "description": "Driver dispatch ingress restored, 0% packet drop",
    },
    "DB_BOTTLENECK": {
        "duration": 9.4,
        "step_delay": 1.55, # 6 steps * 1.55s = 9.3s
        "complexity": "COMPLEX",
        "action": "PostgreSQL Zombie Lock Purge & Connection Pool Recycled",
        "description": "Database locks terminated, passenger login unlocked",
    },
    "MEMORY_LEAK": {
        "duration": 10.0,
        "step_delay": 1.65, # 6 steps * 1.65s = 9.9s
        "complexity": "COMPLEX",
        "action": "Canary Rollback to Heap-Safe Revision Image",
        "description": "Heap buffer purged, trip lifecycle transactions healthy",
    },
}

async def execute_self_healing_pipeline(service_name: str, telemetry: dict, incident_id: str = None) -> SREState:
    """Executes the full LangGraph pipeline step by step and emits live events."""
    if service_name in active_healing_services:
        logger.info(f"Self-healing already active for {service_name}, skipping redundant run.")
        return {"status": "ALREADY_HEALING", "service_name": service_name}

    active_healing_services.add(service_name)
    try:
        if not incident_id:
            incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"

        fault = chaos_engine.get_fault_for_service(service_name)
        f_type = fault.get("failure_type", "SERVICE_CRASH") if fault else "SERVICE_CRASH"
        spec = FAULT_HEAL_TIMINGS.get(f_type, {"duration": 6.0, "step_delay": 1.0, "action": "Container Pod Restart"})
        step_delay = spec["step_delay"]

        initial_state: SREState = {
            "incident_id": incident_id,
            "service_name": service_name,
            "telemetry": telemetry,
            "anomalies": [],
            "root_cause": {},
            "recovery_plan": {},
            "execution_result": {},
            "validation": {},
            "knowledge_learned": {},
            "status": "INITIALIZED",
            "step_history": [],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        logger.info(f"===> [LangGraph Workflow] Triggered self-healing run for {service_name} ({f_type}, Target: {spec['duration']}s)")
        
        # 1. Run Monitoring Agent
        state = run_monitoring_agent(initial_state)
        await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
        record_recent_event(state["step_history"][-1])
        await asyncio.sleep(step_delay)

        # 2. Run Anomaly Detection Agent
        if state.get("status") == "MONITORING_DONE":
            state = run_anomaly_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])
            await asyncio.sleep(step_delay)

        # 3. Run RCA Agent
        if state.get("status") == "ANOMALY_CONFIRMED":
            # Create or update Incident record in DB
            db = SessionLocal()
            try:
                inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
                if not inc:
                    inc = Incident(
                        incident_id=incident_id,
                        service_name=service_name,
                        error_type=state["anomalies"][0]["type"] if state.get("anomalies") else "DEGRADATION",
                        severity="HIGH",
                        detected_by="Monitoring Agent",
                        status="ANALYZING"
                    )
                    db.add(inc)
                else:
                    inc.status = "ANALYZING"
                
                # Mark service as DEGRADED / CRITICAL
                srv = db.query(Service).filter(Service.service_name == service_name).first()
                if srv:
                    srv.status = "CRITICAL" if "CRASH" in inc.error_type else "DEGRADED"
                    srv.health = 35.0
                db.commit()
            except Exception as e:
                logger.error(f"Error creating incident in DB: {e}")
                db.rollback()
            finally:
                db.close()

            state = run_rca_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])
            await asyncio.sleep(step_delay)

            # 4. Run Recovery Planner
            state = run_planner_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])
            await asyncio.sleep(step_delay)

            # 5. Run Execution Agent (Executes Kubernetes actions & clears fault)
            state = run_execution_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])
            await asyncio.sleep(step_delay)

            # 6. Run Validation Agent
            state = run_validation_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])
            await asyncio.sleep(max(0.3, step_delay * 0.6))

            # 7. Run Knowledge Base Agent & Emit Final Resolution
            state = run_knowledge_base_agent(state)
            await broadcast_agent_event("AGENT_STEP", state["step_history"][-1])
            record_recent_event(state["step_history"][-1])

            # Reset database service record to pristine HEALTHY status
            try:
                db = SessionLocal()
                srv = db.query(Service).filter(Service.service_name == service_name).first()
                if srv:
                    srv.status = "HEALTHY"
                    srv.health = 100.0
                    srv.cpu_usage = 18.5
                    srv.memory_usage = 28.0
                    srv.latency_ms = 42.0
                    srv.error_rate = 0.0
                    db.commit()
                db.close()
            except Exception as dbe:
                logger.error(f"Error resetting DB service record for {service_name}: {dbe}")

            await broadcast_agent_event("INCIDENT_RESOLVED", {
                "incident_id": incident_id,
                "service_name": service_name,
                "failure_type": f_type,
                "duration_seconds": spec["duration"],
                "remediation_action": spec.get("action"),
                "status": "HEALTHY"
            })

        return state
    finally:
        active_healing_services.discard(service_name)

async def autonomous_monitoring_loop():
    """
    Continuous background daemon that scans cluster metrics, 
    detects anomalies or injected chaos, and orchestrates LangGraph agents.
    """
    logger.info("Starting Autonomous SRE Agent Background Daemon...")
    while True:
        try:
            db = SessionLocal()
            services = db.query(Service).all()
            
            for srv in services:
                if srv.service_name in active_healing_services:
                    continue

                pod = k8s_controller.get_pod_for_service(srv.service_name)
                fault = chaos_engine.get_fault_for_service(srv.service_name)

                # Compute current live telemetry
                if fault:
                    f_type = fault["failure_type"]
                    if f_type == "CPU_SPIKE":
                        srv.cpu_usage = min(99.0, srv.cpu_usage + 35.0)
                        srv.latency_ms = 450.0
                        srv.health = 40.0
                        srv.status = "DEGRADED"
                    elif f_type == "MEMORY_LEAK":
                        srv.memory_usage = min(96.0, srv.memory_usage + 30.0)
                        srv.health = 35.0
                        srv.status = "DEGRADED"
                    elif f_type == "SERVICE_CRASH":
                        srv.status = "CRITICAL"
                        srv.health = 0.0
                        srv.error_rate = 100.0
                    elif f_type == "TRAFFIC_OVERLOAD":
                        srv.cpu_usage = 88.0
                        srv.latency_ms = 1450.0
                        srv.error_rate = 12.5
                        srv.health = 45.0
                        srv.status = "DEGRADED"
                    elif f_type == "DB_BOTTLENECK":
                        srv.latency_ms = 2200.0
                        srv.health = 30.0
                        srv.status = "DEGRADED"
                    elif f_type == "NETWORK_PARTITION":
                        srv.error_rate = 45.0
                        srv.latency_ms = 5000.0
                        srv.health = 20.0
                        srv.status = "CRITICAL"

                    # If degraded or critical, trigger LangGraph healing pipeline!
                    telemetry = {
                        "cpu_usage": srv.cpu_usage,
                        "memory_usage": srv.memory_usage,
                        "latency_ms": srv.latency_ms,
                        "error_rate": srv.error_rate,
                        "pod_status": pod.status if pod else "Unknown"
                    }
                    db.commit()
                    # Trigger async pipeline
                    asyncio.create_task(execute_self_healing_pipeline(srv.service_name, telemetry))
                else:
                    # Normal random small fluctuations around healthy baseline
                    srv.cpu_usage = max(5.0, min(35.0, srv.cpu_usage + random.uniform(-2.0, 2.0)))
                    srv.memory_usage = max(15.0, min(40.0, srv.memory_usage + random.uniform(-1.0, 1.0)))
                    srv.latency_ms = max(20.0, min(80.0, srv.latency_ms + random.uniform(-3.0, 3.0)))
                    srv.error_rate = 0.0
                    if srv.status != "RECOVERING":
                        srv.status = "HEALTHY"
                        srv.health = 100.0
                    srv.request_count += random.randint(15, 60)

                db.commit()

            db.close()
        except Exception as e:
            logger.error(f"Error in autonomous monitoring loop: {e}")

        await asyncio.sleep(4) # Poll every 4 seconds
