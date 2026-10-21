from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime

class SREState(TypedDict, total=False):
    incident_id: str
    service_name: str
    detected_by: str
    telemetry: Dict[str, Any]
    anomalies: List[Dict[str, Any]]
    root_cause: Dict[str, Any]
    recovery_plan: Dict[str, Any]
    execution_result: Dict[str, Any]
    validation: Dict[str, Any]
    knowledge_learned: Dict[str, Any]
    status: str # IDLE, DETECTED, ANOMALY_CONFIRMED, RCA_COMPLETED, PLAN_READY, EXECUTED, VALIDATED, RESOLVED, FAILED
    step_history: List[Dict[str, Any]]
    logs: List[str]
    timestamp: str
