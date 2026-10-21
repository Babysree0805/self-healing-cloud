import logging
from datetime import datetime, timezone
from app.agents.state import SREState

logger = logging.getLogger("planner_agent")

def run_planner_agent(state: SREState) -> SREState:
    """
    Recovery Planner Agent:
    Evaluates incident classification, SRE safety constraints, and selects the
    optimal Kubernetes recovery plan (Restart Pod, Scale Replicas, Rollback Deployment).
    """
    service_name = state.get("service_name", "unknown-service")
    root_cause = state.get("root_cause", {})
    signature = root_cause.get("error_signature", "GENERIC_DEGRADATION")

    action_type = "RESTART_POD"
    k8s_command = f"kubectl delete pod -l app={service_name} -n ride-hailing-system"
    rationale = "Restart pod to refresh memory heap and clear hung worker threads."
    expected_recovery_time_sec = 8

    if signature == "UNBOUNDED_HEAP_MEMORY_LEAK":
        action_type = "RESTART_POD"
        k8s_command = f"kubectl rollout restart deployment/{service_name.replace('-service', '-deployment')} -n ride-hailing-system"
        rationale = "Execute graceful rolling restart of pod to purge leaked memory allocations and reset JVM/Python heap."
        expected_recovery_time_sec = 10

    elif signature == "CONTAINER_CRASH_LOOP":
        action_type = "RESTART_POD"
        k8s_command = f"kubectl delete pod -l app={service_name} -n ride-hailing-system --force --grace-period=0"
        rationale = "Force-terminate stuck container in CrashLoopBackOff to allow K8s scheduler to spawn clean healthy instance."
        expected_recovery_time_sec = 6

    elif signature == "TRAFFIC_SURGE_CAPACITY_BREACH" or signature == "CPU_CORE_SATURATION":
        action_type = "SCALE_REPLICAS"
        k8s_command = f"kubectl scale deployment/{service_name.replace('-service', '-deployment')} --replicas=3 -n ride-hailing-system"
        rationale = "Scale deployment horizontally from 1 to 3 replicas to distribute compute load and reduce CPU utilization."
        expected_recovery_time_sec = 12

    elif signature == "DATABASE_LOCK_CONTENTION":
        action_type = "RESTART_POD"
        k8s_command = f"kubectl rollout restart deployment/{service_name.replace('-service', '-deployment')} -n ride-hailing-system"
        rationale = "Restart pod to terminate orphaned database connection locks and re-initialize clean connection pool."
        expected_recovery_time_sec = 10

    plan = {
        "action_type": action_type,
        "k8s_command": k8s_command,
        "rationale": rationale,
        "expected_recovery_time_sec": expected_recovery_time_sec,
        "requires_approval": False, # Autonomous execution enabled
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    state["recovery_plan"] = plan

    reasoning = (
        f"Recovery Planner generated strategy for {service_name}: Selected action '{action_type}'. "
        f"Rationale: {rationale} Command: '{k8s_command}'"
    )

    step_record = {
        "agent_name": "Recovery Planner",
        "action": "CREATE_RECOVERY_PLAN",
        "reasoning": reasoning,
        "result": f"Plan: {action_type} -> {k8s_command}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    history = state.get("step_history", [])
    history.append(step_record)
    state["step_history"] = history
    state["status"] = "PLAN_READY"

    logger.info(f"[Recovery Planner] {service_name}: Plan={action_type}")
    return state
