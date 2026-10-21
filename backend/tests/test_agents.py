import pytest
import asyncio
from app.agents.workflow import execute_self_healing_pipeline
from app.agents.monitoring_agent import run_monitoring_agent
from app.agents.anomaly_agent import run_anomaly_agent
from app.agents.rca_agent import run_rca_agent
from app.agents.planner_agent import run_planner_agent
from app.agents.execution_agent import run_execution_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.knowledge_base import run_knowledge_base_agent

@pytest.mark.asyncio
async def test_langgraph_self_healing_pipeline():
    telemetry = {
        "cpu_usage": 94.0,
        "memory_usage": 88.0,
        "latency_ms": 1400.0,
        "error_rate": 6.5,
        "pod_status": "Running"
    }
    
    state = await execute_self_healing_pipeline("trip-service", telemetry, incident_id="INC-TEST-001")
    
    assert state["status"] in ["RESOLVED", "COMPLETED"]
    assert len(state["step_history"]) >= 6
    assert state["validation"]["is_healthy"] is True
    assert "RESTART_POD" in state["recovery_plan"]["action_type"] or "SCALE_REPLICAS" in state["recovery_plan"]["action_type"]

def test_individual_agents():
    initial_state = {
        "incident_id": "INC-TEST-002",
        "service_name": "ride-service",
        "telemetry": {
            "cpu_usage": 95.0,
            "memory_usage": 30.0,
            "latency_ms": 80.0,
            "error_rate": 0.0,
            "pod_status": "Running"
        },
        "anomalies": [],
        "step_history": []
    }

    # Monitoring
    s1 = run_monitoring_agent(initial_state)
    assert s1["status"] == "MONITORING_DONE"

    # Anomaly
    s2 = run_anomaly_agent(s1)
    assert s2["status"] == "ANOMALY_CONFIRMED"
    assert len(s2["anomalies"]) > 0

    # RCA
    s3 = run_rca_agent(s2)
    assert s3["status"] == "RCA_COMPLETED"
    assert "CPU" in s3["root_cause"]["primary_cause"] or "Core" in s3["root_cause"]["primary_cause"]

    # Planner
    s4 = run_planner_agent(s3)
    assert s4["status"] == "PLAN_READY"
    assert s4["recovery_plan"]["action_type"] in ["SCALE_REPLICAS", "RESTART_POD"]

    # Execution
    s5 = run_execution_agent(s4)
    assert s5["status"] == "EXECUTED"

    # Validation
    s6 = run_validation_agent(s5)
    assert s6["status"] == "RESOLVED"
    assert s6["validation"]["is_healthy"] is True
