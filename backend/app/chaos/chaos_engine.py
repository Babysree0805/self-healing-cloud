import time
import random
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException
from app.k8s_runtime.k8s_controller import k8s_controller

logger = logging.getLogger("chaos_engine")

class ChaosFault:
    def __init__(self, service_name: str, failure_type: str, intensity: float = 1.0, duration: int = 60):
        self.service_name = service_name
        self.failure_type = failure_type # CPU_SPIKE, MEMORY_LEAK, SERVICE_CRASH, TRAFFIC_OVERLOAD, DB_BOTTLENECK, NETWORK_PARTITION
        self.intensity = intensity
        self.duration = duration
        self.injected_at = datetime.now(timezone.utc)
        self.active = True

class ChaosEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChaosEngine, cls).__new__(cls)
            cls._instance.active_faults: Dict[str, ChaosFault] = {}
        return cls._instance

    def inject_failure(self, service_name: str, failure_type: str, intensity: float = 1.0, duration: int = 60) -> dict:
        fault = ChaosFault(service_name, failure_type, intensity, duration)
        self.active_faults[service_name] = fault
        
        pod = k8s_controller.get_pod_for_service(service_name)
        
        # Log to pod stdout / Loki
        if pod:
            if failure_type == "CPU_SPIKE":
                pod.add_log(f"CRITICAL: CPU thread contention detected in {service_name}. High compute task saturated worker pool.", "ERROR")
                pod.cpu_mcores = 960.0
            elif failure_type == "MEMORY_LEAK":
                pod.add_log(f"CRITICAL: Memory leak detected! Unbounded heap allocations in {service_name}. Danger of OOMKill.", "ERROR")
                pod.memory_mb = 920.0
            elif failure_type == "SERVICE_CRASH":
                pod.status = "CrashLoopBackOff"
                pod.add_log(f"FATAL: Unhandled SIGSEGV exception in main process. Container exited with code 137.", "FATAL")
            elif failure_type == "TRAFFIC_OVERLOAD":
                pod.add_log(f"WARN: Ingress rate limit exceeded. 850 concurrent connections queued on {service_name}.", "WARN")
            elif failure_type == "DB_BOTTLENECK":
                pod.add_log(f"ERROR: PostgreSQL connection pool exhausted (max_connections=100 reached). Lock timeout on table 'trips'.", "ERROR")
            elif failure_type == "NETWORK_PARTITION":
                pod.add_log(f"ERROR: 504 Gateway Timeout. Packet drop rate 45% between gateway and {service_name}.", "ERROR")

        logger.info(f"[Chaos] Injected {failure_type} into {service_name} with intensity {intensity}")
        return {
            "status": "INJECTED",
            "service_name": service_name,
            "failure_type": failure_type,
            "intensity": intensity,
            "injected_at": fault.injected_at.isoformat(),
            "message": f"Successfully injected {failure_type} into {service_name}"
        }

    def clear_fault(self, service_name: str) -> dict:
        if service_name in self.active_faults:
            del self.active_faults[service_name]
            
            pod = k8s_controller.get_pod_for_service(service_name)
            if pod:
                pod.status = "Running"
                pod.cpu_mcores = 45.0
                pod.memory_mb = 120.0
                pod.add_log(f"INFO: Chaos fault cleared. Operating at normal baseline.", "INFO")
                
            return {"status": "CLEARED", "service_name": service_name}
        return {"status": "NO_ACTIVE_FAULT", "service_name": service_name}

    def reset_all(self) -> dict:
        self.active_faults.clear()
        for pod in k8s_controller.pods.values():
            pod.status = "Running"
            pod.cpu_mcores = 45.0
            pod.memory_mb = 120.0
            pod.add_log("INFO: Cluster reset to clean healthy baseline.")
        return {"status": "ALL_FAULTS_CLEARED"}

    def get_fault_for_service(self, service_name: str) -> dict | None:
        if service_name in self.active_faults:
            f = self.active_faults[service_name]
            return {
                "service_name": f.service_name,
                "failure_type": f.failure_type,
                "intensity": f.intensity,
                "injected_at": f.injected_at.isoformat()
            }
        return None

    def get_all_faults(self) -> List[dict]:
        return [
            {
                "service_name": f.service_name,
                "failure_type": f.failure_type,
                "intensity": f.intensity,
                "injected_at": f.injected_at.isoformat()
            }
            for f in self.active_faults.values()
        ]

    def enforce_chaos(self, service_name: str, context: dict = None):
        """
        Actively checks if a chaos fault is injected into the service.
        If active, executes real software degradation (timeouts, 500 DB locks, 429 traffic limit, 503 pod crashes).
        """
        fault = self.get_fault_for_service(service_name)

        # If DB_BOTTLENECK is active anywhere in the cluster, the PostgreSQL connection pool is exhausted!
        # Both auth-service (logins/auth) and trip-service (settlements) are immediately blocked!
        if not fault and (service_name in ["auth-service", "trip-service"]):
            db_fault = next((f for f in self.active_faults.values() if f.failure_type == "DB_BOTTLENECK"), None)
            if db_fault:
                fault = {
                    "service_name": service_name,
                    "failure_type": "DB_BOTTLENECK",
                    "intensity": db_fault.intensity,
                    "injected_at": db_fault.injected_at.isoformat()
                }

        if not fault:
            return

        f_type = fault["failure_type"]
        if f_type == "SERVICE_CRASH":
            logger.warning(f"[Chaos Enforced] {service_name} is in CrashLoopBackOff. Raising 503.")
            raise HTTPException(
                status_code=503,
                detail=f"503 Service Unavailable: Pod for '{service_name}' is in CrashLoopBackOff. Real-time GPS stream & socket offline."
            )
        elif f_type == "DB_BOTTLENECK":
            logger.warning(f"[Chaos Enforced] {service_name} experiencing PostgreSQL lock timeout. Raising 500.")
            raise HTTPException(
                status_code=500,
                detail="500 Internal Server Error: Database Lock Contention on 'users' / 'trips' table. Connection pool exhausted (max_connections=100 reached). Authentication & transactions blocked."
            )
        elif f_type == "TRAFFIC_OVERLOAD":
            ride_type = (context.get("ride_type") or "").upper() if context else ""
            if ride_type == "BIKE":
                logger.warning(f"[Chaos Enforced] {service_name} Bike Taxi queue overloaded. Raising 429.")
                raise HTTPException(
                    status_code=429,
                    detail="429 Too Many Requests: Extreme traffic congestion in Bengaluru grid. Bike Taxi fleet ingress rate-limited (all captains busy). Autonomous SRE HPA scaling replicas..."
                )
            # If a specific ride_type other than BIKE is requested, allow it through (Auto, Cab, Parcel remain operational)
            if ride_type in ["AUTO", "CAB_ECONOMY", "CAB_PREMIUM", "PARCEL", "RENTALS", "AIRPORT"]:
                return
            # If no context (background query), do not block general health checks
            if not context:
                return
            logger.warning(f"[Chaos Enforced] {service_name} Ingress rate limit exceeded. Raising 429.")
            raise HTTPException(
                status_code=429,
                detail="429 Too Many Requests: Ingress queue limit reached. Heavy city traffic congestion active."
            )
        elif f_type == "CPU_SPIKE":
            logger.warning(f"[Chaos Enforced] {service_name} CPU saturated > 95%. Raising 504.")
            raise HTTPException(
                status_code=504,
                detail=f"504 Gateway Timeout: Pricing computation thread saturated (>95% CPU CFS limit). Fare calculation throttled for '{service_name}'."
            )
        elif f_type == "NETWORK_PARTITION":
            logger.warning(f"[Chaos Enforced] {service_name} network partition. Raising 504.")
            raise HTTPException(
                status_code=504,
                detail="504 Gateway Timeout: 45% packet loss on fleet ingress. Driver dispatch connection partitioned."
            )
        elif f_type == "MEMORY_LEAK":
            logger.warning(f"[Chaos Enforced] {service_name} out of memory. Raising 500.")
            raise HTTPException(
                status_code=500,
                detail=f"500 Internal Server Error: Unbounded heap memory leak. Pod for '{service_name}' OOMKilled (Exit Code 137). Trip lifecycle transaction aborted."
            )

chaos_engine = ChaosEngine()
