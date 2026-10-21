import time
import random
import subprocess
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("k8s_controller")

class K8sPod:
    def __init__(self, pod_name: str, service_name: str, status: str = "Running", restarts: int = 0):
        self.pod_name = pod_name
        self.service_name = service_name
        self.status = status # Running, CrashLoopBackOff, OOMKilled, Terminating, Pending
        self.restarts = restarts
        self.cpu_mcores = 45.0
        self.memory_mb = 120.0
        self.ip_address = f"10.244.{random.randint(1, 9)}.{random.randint(10, 250)}"
        self.node = f"k8s-worker-node-{random.randint(1, 3)}"
        self.started_at = datetime.now(timezone.utc)
        self.logs: List[str] = [
            f"[{self.started_at.strftime('%H:%M:%S')}] INFO: Container initialized successfully.",
            f"[{self.started_at.strftime('%H:%M:%S')}] INFO: Listening on port for HTTP traffic."
        ]

    def add_log(self, message: str, level: str = "INFO"):
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        self.logs.append(f"[{now_str}] {level}: {message}")
        if len(self.logs) > 100:
            self.logs = self.logs[-100:]

    def to_dict(self) -> dict:
        return {
            "pod_name": self.pod_name,
            "service_name": self.service_name,
            "status": self.status,
            "restarts": self.restarts,
            "cpu_mcores": round(self.cpu_mcores, 1),
            "memory_mb": round(self.memory_mb, 1),
            "ip_address": self.ip_address,
            "node": self.node,
            "age": "2h 45m"
        }

class K8sClusterController:
    """
    Kubernetes Controller managing pod lifecycle, autoscaling, deployments, 
    and executing remediation actions like pod restarts, scale-ups, and rollbacks.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(K8sClusterController, cls).__new__(cls)
            cls._instance._init_cluster()
        return cls._instance

    def _init_cluster(self):
        self.namespace = "ride-hailing-system"
        self.pods: Dict[str, K8sPod] = {}
        self.deployments: Dict[str, dict] = {}
        
        services = [
            ("auth-service", "auth-deployment", 8001),
            ("ride-service", "ride-deployment", 8002),
            ("driver-service", "driver-deployment", 8003),
            ("trip-service", "trip-deployment", 8004),
            ("pricing-service", "pricing-deployment", 8005),
            ("location-service", "location-deployment", 8006),
            ("notification-service", "notification-deployment", 8007),
            ("api-gateway", "gateway-deployment", 8000),
        ]

        for s_name, dep_name, port in services:
            self.deployments[s_name] = {
                "deployment_name": dep_name,
                "service_name": s_name,
                "replicas": 1,
                "target_replicas": 1,
                "version": "v1.2.0",
                "revision": 1,
                "port": port
            }
            pod_name = f"{s_name}-pod-7d4f9b-{random.randint(100, 999)}"
            self.pods[s_name] = K8sPod(pod_name, s_name)

    def get_all_pods(self) -> List[dict]:
        return [pod.to_dict() for pod in self.pods.values()]

    def get_pod_for_service(self, service_name: str) -> Optional[K8sPod]:
        return self.pods.get(service_name)

    def restart_pod(self, service_name: str) -> dict:
        """Executes 'kubectl delete pod / restart' command"""
        if service_name not in self.pods:
            return {"status": "ERROR", "message": f"Service {service_name} not found"}

        old_pod = self.pods[service_name]
        old_pod.status = "Terminating"
        old_pod.add_log(f"SIGTERM received from Kubernetes API. Graceful shutdown initiating.", "WARN")
        
        # New pod replacement
        new_pod_name = f"{service_name}-pod-8e5a1c-{random.randint(100, 999)}"
        new_pod = K8sPod(
            pod_name=new_pod_name,
            service_name=service_name,
            status="Running",
            restarts=old_pod.restarts + 1
        )
        new_pod.add_log(f"Pod {new_pod_name} scheduled on {new_pod.node} in namespace {self.namespace}.")
        new_pod.add_log("Container image pulled: registry.internal/ride-hailing/" + service_name + ":latest")
        new_pod.add_log("Readiness and Liveness probes: OK (200 SUCCESS).")
        
        self.pods[service_name] = new_pod
        logger.info(f"[K8s] Successfully restarted pod for {service_name} -> {new_pod_name}")

        return {
            "status": "SUCCESS",
            "command": f"kubectl delete pod {old_pod.pod_name} -n {self.namespace}",
            "old_pod": old_pod.pod_name,
            "new_pod": new_pod_name,
            "restarts": new_pod.restarts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def scale_deployment(self, service_name: str, target_replicas: int) -> dict:
        """Executes 'kubectl scale deployment --replicas=N'"""
        if service_name in self.deployments:
            self.deployments[service_name]["target_replicas"] = target_replicas
            self.deployments[service_name]["replicas"] = target_replicas
            
            pod = self.pods.get(service_name)
            if pod:
                pod.add_log(f"Deployment scaled to {target_replicas} replicas by Horizontal Pod Autoscaler / SRE Agent.")

            dep_name = self.deployments[service_name]["deployment_name"]
            logger.info(f"[K8s] Scaled {dep_name} to {target_replicas} replicas.")

            return {
                "status": "SUCCESS",
                "command": f"kubectl scale deployment {dep_name} --replicas={target_replicas} -n {self.namespace}",
                "service_name": service_name,
                "replicas": target_replicas,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        return {"status": "ERROR", "message": f"Deployment for {service_name} not found"}

    def rollback_deployment(self, service_name: str) -> dict:
        """Executes 'kubectl rollout undo deployment'"""
        if service_name in self.deployments:
            dep = self.deployments[service_name]
            dep["version"] = "v1.1.9-stable"
            dep["revision"] = max(1, dep["revision"] - 1)
            
            # Restart pod with rolled back image
            res = self.restart_pod(service_name)
            pod = self.pods.get(service_name)
            if pod:
                pod.add_log(f"Rollback complete to stable revision {dep['revision']} ({dep['version']}).", "INFO")

            dep_name = dep["deployment_name"]
            return {
                "status": "SUCCESS",
                "command": f"kubectl rollout undo deployment {dep_name} -n {self.namespace}",
                "version": dep["version"],
                "revision": dep["revision"],
                "new_pod": res.get("new_pod")
            }
        return {"status": "ERROR", "message": f"Deployment for {service_name} not found"}

    def get_logs(self, service_name: str) -> List[str]:
        pod = self.pods.get(service_name)
        if pod:
            return pod.logs
        return [f"No active logs for {service_name}"]

k8s_controller = K8sClusterController()
