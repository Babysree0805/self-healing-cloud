# Chaos Testing & Self-Healing Verification Guide

Follow this guide to execute chaos experiments and observe autonomous multi-agent self-healing in real-time.

---

## Scenario 1: Memory Leak on Trip Service

### 1. Trigger Fault
- Navigate to **Chaos Simulation Lab** in the web dashboard.
- Select Target Microservice: `trip-service`.
- Click **Simulate Memory Leak**.

### 2. What Happens Behind the Scenes
1. **Telemetry Breach**: Trip Service memory consumption climbs from 28% to 92%+.
2. **Monitoring Agent**: Detects memory utilization crossing the 85% critical threshold. Emits `TRIGGER_INCIDENT` event with ID `INC-XXXXXX`.
3. **Anomaly Detection Agent**: Evaluates monotonic memory slope and confirms `UNBOUNDED_HEAP_MEMORY_LEAK` signature with 98% confidence.
4. **Root Cause Agent**: Analyzes heap allocations and traces uncollected in-memory cache references.
5. **Recovery Planner**: Formulates recovery strategy: `RESTART_POD` using `kubectl rollout restart deployment/trip-deployment`.
6. **Execution Agent**: Interacts with Kubernetes API, executes graceful restart, and re-allocates clean pod.
7. **Validation Agent**: Continuously probes `/api/v1/trips/list`. Confirms memory returned to 28% and status is `Running`.
8. **Knowledge Base**: Updates playbook record with 100% resolution success rate.

---

## Scenario 2: CPU Spike & Worker Saturation on Ride Service

### 1. Trigger Fault
- Select Target Microservice: `ride-service`.
- Click **Simulate CPU Spike**.

### 2. Autonomous Action
- SRE Agents detect CPU core saturation (>95%).
- Recovery Planner generates `SCALE_REPLICAS` command (`kubectl scale deployment/ride-deployment --replicas=3`).
- Load is distributed across multiple pods, reducing average CPU utilization below 35%.

---

## Scenario 3: Fatal Service Crash / Pod Eviction

### 1. Trigger Fault
- Select Target Microservice: `driver-service`.
- Click **Kill Service / Pod Crash**.

### 2. Autonomous Action
- Container enters `CrashLoopBackOff`.
- Anomaly Agent triggers priority incident.
- Execution Agent force-evicts stuck pod, allowing Kubernetes scheduler to schedule a fresh healthy pod on worker node.
- Validated back to 100% health in < 6 seconds.
