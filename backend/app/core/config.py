import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Autonomous Self-Healing Cloud Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "self_healing_cloud_secret_key_jwt_super_secure_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./self_healing_cloud.db"
    )
    
    # Kubernetes / Container Runtime
    K8S_SIMULATION_MODE: bool = os.getenv("K8S_SIMULATION_MODE", "true").lower() == "true"
    K8S_NAMESPACE: str = os.getenv("K8S_NAMESPACE", "ride-hailing-system")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Thresholds for Autonomous SRE Agent
    CPU_THRESHOLD_CRITICAL: float = 85.0    # %
    CPU_THRESHOLD_WARNING: float = 70.0     # %
    MEMORY_THRESHOLD_CRITICAL: float = 85.0 # %
    MEMORY_THRESHOLD_WARNING: float = 70.0  # %
    LATENCY_THRESHOLD_CRITICAL: float = 1200.0  # ms
    LATENCY_THRESHOLD_WARNING: float = 500.0    # ms
    ERROR_RATE_THRESHOLD_CRITICAL: float = 5.0  # %
    
    # Telemetry Polling Interval
    MONITORING_POLL_INTERVAL_SECONDS: int = 3
    
    # Microservices Ports mapping
    SERVICE_PORTS: dict = {
        "auth-service": 8001,
        "ride-service": 8002,
        "driver-service": 8003,
        "trip-service": 8004,
        "pricing-service": 8005,
        "location-service": 8006,
        "notification-service": 8007,
        "api-gateway": 8000
    }

    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

settings = Settings()
