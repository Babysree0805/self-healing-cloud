import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    service_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    status = Column(String, default="HEALTHY") # HEALTHY, DEGRADED, CRITICAL, RECOVERING
    health = Column(Float, default=100.0)      # 0 to 100
    cpu_usage = Column(Float, default=15.0)    # %
    memory_usage = Column(Float, default=25.0) # %
    latency_ms = Column(Float, default=45.0)   # ms
    error_rate = Column(Float, default=0.0)    # %
    request_count = Column(Integer, default=0)
    restart_count = Column(Integer, default=0)
    active_replicas = Column(Integer, default=1)
    target_replicas = Column(Integer, default=1)
    pod_name = Column(String, default="")
    version = Column(String, default="v1.2.0")
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
