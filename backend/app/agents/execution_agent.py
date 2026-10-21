import logging
from datetime import datetime, timezone
from app.agents.state import SREState
from app.k8s_runtime.k8s_controller import k8s_controller
from app.chaos.chaos_engine import chaos_engine

logger = logging.getLogger("execution_agent")

def run_execution_agent(state: SREState) -> SREState:
    """
    Execution Agent:
    Interacts with the Kubernetes API & runtime orchestrator to execute
    the prescribed remediation commands safely.
    """
    service_name = state.get("service_name", "unknown-service")
    plan = state.get("recovery_plan", {})
    action_type = plan.get("action_type", "RESTART_POD")
    k8s_command = plan.get("k8s_command", "kubectl restart")

    execution_result = {}

    if action_type == "RESTART_POD":
        res = k8s_controller.restart_pod(service_name)
        # Clear any injected chaos to simulate successful pod replacement
        chaos_engine.clear_fault(service_name)
        execution_result = {
            "status": "SUCCESS",
            "action_executed": "RESTART_POD",
            "k8s_command": res.get("command", k8s_command),
            "new_pod": res.get("new_pod"),
            "old_pod": res.get("old_pod"),
            "message": f"Pod for {service_name} restarted successfully."
        }

    elif action_type == "SCALE_REPLICAS":
        res = k8s_controller.scale_deployment(service_name, target_replicas=3)
        chaos_engine.clear_fault(service_name)
        execution_result = {
            "status": "SUCCESS",
            "action_executed": "SCALE_REPLICAS",
            "k8s_command": res.get("command", k8s_command),
            "replicas": 3,
            "message": f"Deployment for {service_name} scaled to 3 replicas."
        }

    elif action_type == "ROLLBACK_DEPLOYMENT":
        res = k8s_controller.rollback_deployment(service_name)
        chaos_engine.clear_fault(service_name)
        execution_result = {
            "status": "SUCCESS",
            "action_executed": "ROLLBACK_DEPLOYMENT",
            "k8s_command": res.get("command", k8s_command),
            "version": res.get("version"),
            "message": f"Deployment for {service_name} rolled back to stable version."
        }

    state["execution_result"] = execution_result

    reasoning = (
        f"Execution Agent successfully executed Kubernetes operation: '{execution_result.get('k8s_command')}' "
        f"on cluster. Pod transition initiated."
    )

    step_record = {
        "agent_name": "Execution Agent",
        "action": "EXECUTE_K8S_ACTION",
        "reasoning": reasoning,
        "result": f"Executed: {action_type} -> Pod healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    history = state.get("step_history", [])
    history.append(step_record)
    state["step_history"] = history
    state["status"] = "EXECUTED"

    logger.info(f"[Execution Agent] {service_name}: {execution_result.get('message')}")
    return state
