import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from app.core.database import Base

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    entry_id = Column(String, primary_key=True, default=lambda: f"KB-{uuid.uuid4().hex[:6].upper()}")
    issue = Column(String, nullable=False) # e.g. "Trip Service High Memory Leak"
    service_name = Column(String, index=True, nullable=False)
    error_signature = Column(String, nullable=False) # e.g. "OOM_APPROACHING_HEAP_ALLOC"
    root_cause = Column(Text, nullable=False)
    solution = Column(Text, nullable=False) # e.g. "Restart Kubernetes Pod & Flush Redis Cache"
    recovery_action = Column(String, nullable=False) # RESTART_POD, SCALE_REPLICAS, ROLLBACK
    success_rate = Column(Float, default=100.0) # Percentage
    times_applied = Column(Integer, default=1)
    last_applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
