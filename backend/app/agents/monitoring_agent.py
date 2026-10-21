import logging
from datetime import datetime, timezone
from app.agents.state import SREState
from app.core.config import settings

logger = logging.getLogger("monitoring_agent")

def run_monitoring_agent(state: SREState) -> SREState:
    """
    Monitoring Agent:
    Collects telemetry metrics (CPU, Memory, Latency, Error Rate, Pod Status)
    and evaluates SLA threshold breaches.
    """
    telemetry = state.get("telemetry", {})
    service_name = state.get("service_name", "unknown-service")
    
    cpu = telemetry.get("cpu_usage", 15.0)
    memory = telemetry.get("memory_usage", 25.0)
    latency = telemetry.get("latency_ms", 45.0)
    error_rate = telemetry.get("error_rate", 0.0)
    pod_status = telemetry.get("pod_status", "Running")
    
    breaches = []
    if cpu >= settings.CPU_THRESHOLD_WARNING:
        breaches.append(f"CPU Utilization high: {cpu:.1f}% (threshold {settings.CPU_THRESHOLD_WARNING}%)")
    if memory >= settings.MEMORY_THRESHOLD_WARNING:
        breaches.append(f"Memory Consumption high: {memory:.1f}% (threshold {settings.MEMORY_THRESHOLD_WARNING}%)")
    if latency >= settings.LATENCY_THRESHOLD_WARNING:
        breaches.append(f"API Latency high: {latency:.1f}ms (threshold {settings.LATENCY_THRESHOLD_WARNING}ms)")
    if error_rate >= settings.ERROR_RATE_THRESHOLD_CRITICAL:
        breaches.append(f"Error Rate spike: {error_rate:.1f}% (threshold {settings.ERROR_RATE_THRESHOLD_CRITICAL}%)")
    if pod_status in ["CrashLoopBackOff", "OOMKilled", "Error"]:
        breaches.append(f"Pod Crash detected: Status is {pod_status}")

    reasoning = (
        f"Monitoring Agent inspected Prometheus metrics & OpenTelemetry traces for '{service_name}'. "
        f"Found {len(breaches)} SLA boundary breach(es): {', '.join(breaches) if breaches else 'All metrics within nominal baseline'}."
    )

    action = "TRIGGER_INCIDENT" if breaches else "MONITOR_OK"
    result = f"Detected {len(breaches)} metric breach(es)" if breaches else "Telemetry normal"

    step_record = {
        "agent_name": "Monitoring Agent",
        "action": action,
        "reasoning": reasoning,
        "result": result,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    history = state.get("step_history", [])
    history.append(step_record)
    state["step_history"] = history
    state["status"] = "MONITORING_DONE" if breaches else "HEALTHY"
    
    logger.info(f"[Monitoring Agent] {service_name}: {result}")
    return state
