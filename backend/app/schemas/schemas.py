from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "sre_engineer"

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    role: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Service Schemas ---
class ServiceBase(BaseModel):
    service_name: str
    display_name: str
    port: int
    status: str
    health: float
    cpu_usage: float
    memory_usage: float
    latency_ms: float
    error_rate: float
    request_count: int
    restart_count: int
    active_replicas: int
    target_replicas: int
    pod_name: Optional[str] = ""
    version: Optional[str] = "v1.2.0"

class ServiceResponse(ServiceBase):
    service_id: str
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ServiceUpdate(BaseModel):
    status: Optional[str] = None
    health: Optional[float] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    latency_ms: Optional[float] = None
    error_rate: Optional[float] = None
    restart_count: Optional[int] = None
    active_replicas: Optional[int] = None

# --- Incident Schemas ---
class IncidentBase(BaseModel):
    service_name: str
    error_type: str
    severity: str = "HIGH"
    detected_by: str = "Monitoring Agent"
    root_cause: Optional[str] = None
    recovery_action: Optional[str] = None
    status: str = "DETECTED"

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    incident_id: str
    mttr_seconds: float
    created_at: datetime
    resolved_at: Optional[datetime] = None
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Agent Log Schemas ---
class AgentLogBase(BaseModel):
    incident_id: Optional[str] = None
    agent_name: str
    action: str
    reasoning: Optional[str] = None
    result: str
    metadata_json: Optional[str] = None

class AgentLogResponse(AgentLogBase):
    log_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Knowledge Base Schemas ---
class KnowledgeBaseEntry(BaseModel):
    entry_id: Optional[str] = None
    issue: str
    service_name: str
    error_signature: str
    root_cause: str
    solution: str
    recovery_action: str
    success_rate: float = 100.0
    times_applied: int = 1
    last_applied_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Chaos Engineering Schemas ---
class ChaosInjectRequest(BaseModel):
    service_name: str
    failure_type: str # CPU_SPIKE, MEMORY_LEAK, SERVICE_CRASH, TRAFFIC_OVERLOAD, DB_BOTTLENECK, NETWORK_PARTITION
    intensity: Optional[float] = 1.0 # 0.1 to 2.0
    duration_seconds: Optional[int] = 60

class ChaosInjectResponse(BaseModel):
    status: str
    service_name: str
    failure_type: str
    message: str
    timestamp: datetime

# --- Cluster Metrics Aggregation ---
class ClusterOverview(BaseModel):
    overall_health: float
    cluster_status: str
    total_services: int
    healthy_services: int
    degraded_services: int
    critical_services: int
    active_incidents: int
    total_pods: int
    avg_cpu_usage: float
    avg_memory_usage: float
    total_requests_per_sec: float
    avg_latency_ms: float
    agent_status: str
