import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.service import Service
from app.models.knowledge_base import KnowledgeBase
from app.models.incident import Incident
from app.models.agent_log import AgentLog

# Import Microservices & APIs
from app.services.auth_service import router as auth_router
from app.services.ride_service import router as ride_router
from app.services.driver_service import router as driver_router
from app.services.trip_service import router as trip_router
from app.services.pricing_service import router as pricing_router
from app.services.location_service import router as location_router
from app.services.notification_service import router as notification_router
from app.services.gateway import router as gateway_router

from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.services import router as services_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.agents import router as agents_router
from app.api.v1.chaos import router as chaos_router
from app.api.v1.knowledge_base import router as kb_router
from app.api.v1.k8s import router as k8s_router
from app.api.stream import router as stream_router
from app.agents.workflow import autonomous_monitoring_loop

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

def seed_database():
    """Initializes tables and populates baseline services and default users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            users_to_seed = [
                User(
                    user_id=str(uuid.uuid4()),
                    username="admin",
                    email="admin@cloudplatform.internal",
                    password=get_password_hash("password123"),
                    role="admin"
                ),
                User(
                    user_id=str(uuid.uuid4()),
                    username="sre_lead",
                    email="sre_lead@cloudplatform.internal",
                    password=get_password_hash("password123"),
                    role="sre_engineer"
                ),
                User(
                    user_id=str(uuid.uuid4()),
                    username="cloud_engineer",
                    email="engineer@cloudplatform.internal",
                    password=get_password_hash("password123"),
                    role="sre_engineer"
                )
            ]
            db.add_all(users_to_seed)
            logger.info("Seeded default SRE admin & engineer users.")

        # 2. Seed Microservices Workload
        if db.query(Service).count() == 0:
            services_data = [
                ("auth-service", "Authentication Service", 8001),
                ("ride-service", "Ride Matching Service", 8002),
                ("driver-service", "Driver Fleet Service", 8003),
                ("trip-service", "Trip Lifecycle Service", 8004),
                ("pricing-service", "Dynamic Pricing Service", 8005),
                ("location-service", "Location Telemetry Service", 8006),
                ("notification-service", "Notification Service", 8007),
                ("api-gateway", "API Ingress Gateway", 8000),
            ]
            for s_name, d_name, port in services_data:
                srv = Service(
                    service_name=s_name,
                    display_name=d_name,
                    port=port,
                    status="HEALTHY",
                    health=100.0,
                    cpu_usage=18.0,
                    memory_usage=28.0,
                    latency_ms=42.0,
                    error_rate=0.0,
                    request_count=1240,
                    restart_count=0,
                    active_replicas=1,
                    target_replicas=1,
                    pod_name=f"{s_name}-pod-7d4f9b",
                    version="v1.2.0"
                )
                db.add(srv)
            logger.info("Seeded ride-hailing microservices workload.")

        # 3. Seed Knowledge Base Playbooks
        if db.query(KnowledgeBase).count() == 0:
            playbooks = [
                KnowledgeBase(
                    issue="Trip Service High Memory Leak",
                    service_name="trip-service",
                    error_signature="UNBOUNDED_HEAP_MEMORY_LEAK",
                    root_cause="Unbounded in-memory active trip object cache holding heap references.",
                    solution="Execute rolling restart of Kubernetes pod and purge stale trip cache.",
                    recovery_action="RESTART_POD",
                    success_rate=98.5,
                    times_applied=14,
                    last_applied_at=datetime.now(timezone.utc)
                ),
                KnowledgeBase(
                    issue="Ride Service CPU Core Saturation",
                    service_name="ride-service",
                    error_signature="CPU_CORE_SATURATION",
                    root_cause="High geospatial matchmaking search complexity during surge hours.",
                    solution="Scale deployment horizontally to 3 replicas with Horizontal Pod Autoscaler.",
                    recovery_action="SCALE_REPLICAS",
                    success_rate=100.0,
                    times_applied=9,
                    last_applied_at=datetime.now(timezone.utc)
                ),
                KnowledgeBase(
                    issue="Driver Service CrashLoopBackOff",
                    service_name="driver-service",
                    error_signature="CONTAINER_CRASH_LOOP",
                    root_cause="Null pointer exception on missing driver telemetry packet.",
                    solution="Force restart pod and re-sync Kafka consumer offset.",
                    recovery_action="RESTART_POD",
                    success_rate=100.0,
                    times_applied=6,
                    last_applied_at=datetime.now(timezone.utc)
                ),
                KnowledgeBase(
                    issue="Trip Service Database Lock Contention",
                    service_name="trip-service",
                    error_signature="DATABASE_LOCK_CONTENTION",
                    root_cause="PostgreSQL connection pool exhausted on relational trips table.",
                    solution="Restart pod to terminate orphaned connection locks and reset pool.",
                    recovery_action="RESTART_POD",
                    success_rate=96.0,
                    times_applied=11,
                    last_applied_at=datetime.now(timezone.utc)
                )
            ]
            db.add_all(playbooks)
            logger.info("Seeded SRE Knowledge Base playbooks.")

        db.commit()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database and launch background daemon
    seed_database()
    monitor_task = asyncio.create_task(autonomous_monitoring_loop())
    yield
    # Shutdown
    monitor_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Industry-level Cloud Computing + Agentic AI Autonomous Self-Healing Infrastructure",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Microservices Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(ride_router, prefix=settings.API_V1_STR)
app.include_router(driver_router, prefix=settings.API_V1_STR)
app.include_router(trip_router, prefix=settings.API_V1_STR)
app.include_router(pricing_router, prefix=settings.API_V1_STR)
app.include_router(location_router, prefix=settings.API_V1_STR)
app.include_router(notification_router, prefix=settings.API_V1_STR)
app.include_router(gateway_router, prefix=settings.API_V1_STR)

# Mount Cloud Ops & SRE Agent API Routers
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(services_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(chaos_router, prefix=settings.API_V1_STR)
app.include_router(kb_router, prefix=settings.API_V1_STR)
app.include_router(k8s_router, prefix=settings.API_V1_STR)
app.include_router(stream_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "ONLINE",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs",
        "metrics_url": f"{settings.API_V1_STR}/metrics",
        "telemetry_overview": f"{settings.API_V1_STR}/telemetry/overview",
        "live_stream": f"{settings.API_V1_STR}/stream/events"
    }
