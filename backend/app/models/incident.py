import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(String, primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:6].upper()}")
    service_name = Column(String, index=True, nullable=False)
    error_type = Column(String, nullable=False) # CPU_SPIKE, MEMORY_LEAK, SERVICE_CRASH, TRAFFIC_OVERLOAD, DB_BOTTLENECK, NETWORK_PARTITION
    severity = Column(String, default="HIGH")   # LOW, MEDIUM, HIGH, CRITICAL
    detected_by = Column(String, default="Monitoring Agent")
    root_cause = Column(Text, nullable=True)
    recovery_action = Column(Text, nullable=True)
    status = Column(String, default="DETECTED") # DETECTED, ANALYZING, RECOVERING, VALIDATING, RESOLVED, FAILED
    mttr_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
