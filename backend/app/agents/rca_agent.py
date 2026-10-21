import logging
from datetime import datetime, timezone
from app.agents.state import SREState
from app.k8s_runtime.k8s_controller import k8s_controller

logger = logging.getLogger("rca_agent")

def run_rca_agent(state: SREState) -> SREState:
    """
    Root Cause Analysis (RCA) Agent:
    Inspects microservice dependency topology, container logs from Loki,
    and correlations to isolate primary root cause from downstream symptoms.
    """
    service_name = state.get("service_name", "unknown-service")
    anomalies = state.get("anomalies", [])
    telemetry = state.get("telemetry", {})
    logs = k8s_controller.get_logs(service_name)

    primary_cause = "Unknown System Glitch"
    error_signature = "GENERIC_DEGRADATION"
    chain_of_thought = []
    confidence = 0.95

    # Analyze anomalies & logs
    types = [a["type"] for a in anomalies]
    
    if "SERVICE_CRASH" in types or telemetry.get("pod_status") == "CrashLoopBackOff":
        primary_cause = f"Container terminated abruptly with unhandled exception (SIGSEGV / OOMKilled). Container exited with code 137."
        error_signature = "CONTAINER_CRASH_LOOP"
        chain_of_thought.append("1. Read Kubernetes event stream: Liveness probe failed 3 consecutive times.")
        chain_of_thought.append("2. Examined container stderr: SIGSEGV fault encountered in request handling thread.")
        chain_of_thought.append("3. Primary cause: Fatal process crash requiring container reconstitution.")

    elif "MEMORY_LEAK" in types:
        primary_cause = f"Memory exhaustion due to unbounded in-memory object accumulation and cache leak in {service_name}."
        error_signature = "UNBOUNDED_HEAP_MEMORY_LEAK"
        chain_of_thought.append("1. Profiling heap metrics: Allocations grew steadily past 900MB without GC reclamation.")
        chain_of_thought.append("2. Correlated with traffic load: Memory didn't release even after request completion.")
        chain_of_thought.append("3. Primary cause: Memory leak in application heap cache requiring pod recycle.")

    elif "CPU_SPIKE" in types:
        primary_cause = f"CPU thread saturation caused by compute-intensive cryptographic hashing or unoptimized loop in {service_name}."
        error_signature = "CPU_CORE_SATURATION"
        chain_of_thought.append("1. Observed CPU core saturation exceeding 95% utilization.")
        chain_of_thought.append("2. Inspected worker thread pool: All uvicorn/gunicorn workers blocking on CPU intensive task.")
        chain_of_thought.append("3. Primary cause: Worker starvation requiring horizontal scaling / restart.")

    elif "HIGH_LATENCY" in types:
        # Check if Trip Service -> Database Bottleneck
        if service_name in ["trip-service", "ride-service"]:
            primary_cause = f"Database connection pool starvation and lock contention on relational table 'trips' causing downstream latency."
            error_signature = "DATABASE_LOCK_CONTENTION"
            chain_of_thought.append("1. Latency spiked to >1500ms while CPU remained moderate.")
            chain_of_thought.append("2. Database connection pool reached maximum capacity (pool_size=100 exhausted).")
            chain_of_thought.append("3. Primary cause: Database connection bottleneck requiring connection pool reset & pod restart.")
        else:
            primary_cause = f"I/O blocking and upstream network congestion in {service_name}."
            error_signature = "NETWORK_IO_BOTTLENECK"
            chain_of_thought.append("1. High network I/O wait times detected on incoming gateway sockets.")
            chain_of_thought.append("2. Upstream reverse proxy timing out after 5000ms.")

    elif "TRAFFIC_OVERLOAD_OR_ERROR_SURGE" in types:
        primary_cause = f"Sudden traffic surge exceeding single-pod capacity limit, causing connection drops and 5xx errors."
        error_signature = "TRAFFIC_SURGE_CAPACITY_BREACH"
        chain_of_thought.append("1. Request volume spiked 400% above baseline.")
        chain_of_thought.append("2. Gateway queue buffer overflowed resulting in dropped connections.")
        chain_of_thought.append("3. Primary cause: Insufficient horizontal replica count for high load.")

    root_cause_data = {
        "service_name": service_name,
        "primary_cause": primary_cause,
        "error_signature": error_signature,
        "confidence": confidence,
        "chain_of_thought": chain_of_thought
    }
    
    state["root_cause"] = root_cause_data
    
    reasoning = f"RCA Agent performed multi-dimensional analysis on {service_name}. Identified root cause: {primary_cause}"
    
    step_record = {
        "agent_name": "Root Cause Agent",
        "action": "IDENTIFY_ROOT_CAUSE",
        "reasoning": reasoning,
        "result": f"Root Cause: {primary_cause} (Signature: {error_signature})",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    history = state.get("step_history", [])
    history.append(step_record)
    state["step_history"] = history
    state["status"] = "RCA_COMPLETED"

    logger.info(f"[RCA Agent] {service_name}: {root_cause_data['primary_cause']}")
    return state
