"""
K8s Runtime API — exposes pod status, deployments, cluster health
for demo / evaluator presentation (mirrors kubectl output).
"""
from fastapi import APIRouter
from typing import List
from datetime import datetime, timezone

from app.k8s_runtime.k8s_controller import k8s_controller

router = APIRouter(prefix="/k8s", tags=["Kubernetes Runtime"])


@router.get("/pods")
def get_pods():
    """List all running pods (like `kubectl get pods -o wide`)"""
    pods = k8s_controller.get_all_pods()
    return {
        "namespace": k8s_controller.namespace,
        "cluster": "rydex-cloud-cluster",
        "total_pods": len(pods),
        "pods": pods,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/pods/{service_name}")
def get_pod(service_name: str):
    """Get pod details for a specific service"""
    pod = k8s_controller.get_pod_for_service(service_name)
    if not pod:
        return {"error": f"No pod found for service: {service_name}"}
    return pod.to_dict()


@router.get("/pods/{service_name}/logs")
def get_pod_logs(service_name: str):
    """Get container logs for a pod (like `kubectl logs <pod>`)"""
    logs = k8s_controller.get_logs(service_name)
    pod = k8s_controller.get_pod_for_service(service_name)
    pod_name = pod.pod_name if pod else f"{service_name}-pod-unknown"
    return {
        "pod": pod_name,
        "service": service_name,
        "namespace": k8s_controller.namespace,
        "logs": logs
    }


@router.get("/deployments")
def get_deployments():
    """List all deployments (like `kubectl get deployments`)"""
    deployments = list(k8s_controller.deployments.values())
    return {
        "namespace": k8s_controller.namespace,
        "total_deployments": len(deployments),
        "deployments": deployments,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/cluster/health")
def get_cluster_health():
    """Overall cluster health summary"""
    pods = k8s_controller.get_all_pods()
    running = [p for p in pods if p["status"] == "Running"]
    crashed = [p for p in pods if p["status"] == "CrashLoopBackOff"]
    oom = [p for p in pods if p["status"] == "OOMKilled"]

    return {
        "cluster": "rydex-cloud-cluster",
        "provider": "GKE (simulated)",
        "region": "us-central1",
        "namespace": k8s_controller.namespace,
        "node_count": 3,
        "nodes": [
            {"name": "k8s-worker-node-1", "status": "Ready", "cpu": "4 vCPU", "memory": "16Gi"},
            {"name": "k8s-worker-node-2", "status": "Ready", "cpu": "4 vCPU", "memory": "16Gi"},
            {"name": "k8s-worker-node-3", "status": "Ready", "cpu": "4 vCPU", "memory": "16Gi"},
        ],
        "pod_summary": {
            "total": len(pods),
            "running": len(running),
            "crash_loop": len(crashed),
            "oom_killed": len(oom)
        },
        "overall_status": "HEALTHY" if len(crashed) == 0 and len(oom) == 0 else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
