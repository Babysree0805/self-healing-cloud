import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.core.database import Base

class AgentLog(Base):
    __tablename__ = "agent_logs"

    log_id = Column(String, primary_key=True, default=lambda: f"LOG-{uuid.uuid4().hex[:8].upper()}")
    incident_id = Column(String, index=True, nullable=True)
    agent_name = Column(String, index=True, nullable=False) # Monitoring Agent, Anomaly Agent, Root Cause Agent, Recovery Planner, Execution Agent, Validation Agent, Knowledge Base
    action = Column(String, nullable=False)
    reasoning = Column(Text, nullable=True)
    result = Column(String, nullable=False)
    metadata_json = Column(Text, nullable=True) # JSON details
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
