# Autonomous Self-Healing Cloud Infrastructure Using Agentic AI

[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.29-blue.svg)](https://kubernetes.io/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange.svg)](https://github.com/langchain-ai/langgraph)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue.svg)](https://tailwindcss.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.50-red.svg)](https://prometheus.io/)

An enterprise-grade **Cloud Computing + Agentic AI** autonomous self-healing platform. A distributed ride-hailing microservice ecosystem acts as the target cloud workload running on Kubernetes. A cognitive **LangGraph Multi-Agent AI SRE System** continuously monitors telemetry, identifies anomalies, isolates root causes, devises remediation strategies, executes Kubernetes actions, and validates health.

---

## High Level Architecture

```
                    USERS / SRE ENGINEERS
                              │
               WEB DASHBOARD (React + Vite)
             [AWS CloudWatch + AI SRE Aesthetic]
                              │
                    API GATEWAY (Port 8000)
                              │
       ┌──────────────────────┴──────────────────────┐
       │     Ride-Hailing Microservices Cluster      │
       │                                             │
       │  • Auth Service       (:8001)               │
       │  • Ride Service       (:8002)               │
       │  • Driver Service     (:8003)               │
       │  • Trip Service       (:8004)               │
       │  • Pricing Service    (:8005)               │
       │  • Location Service   (:8006)               │
       │  • Notification Service (:8007)             │
       └──────────────────────┬──────────────────────┘
                              │
              Kubernetes Cluster Runtime (:8000)
                              │
             Monitoring Layer (Prometheus + Loki)
                              │
       ┌──────────────────────┴──────────────────────┐
       │     LangGraph Autonomous Multi-Agent SRE    │
       │                                             │
       │  Monitoring Agent                           │
       │        │                                    │
       │  Anomaly Detection Agent                    │
       │        │                                    │
       │  Root Cause Agent (RCA)                     │
       │        │                                    │
       │  Recovery Planner                           │
       │        │                                    │
       │  Execution Agent (kubectl / Container APIs) │
       │        │                                    │
       │  Validation Agent                           │
       │        │                                    │
       │  Knowledge Base (Playbook Memory)           │
       └─────────────────────────────────────────────┘
```

---

## Key Features

### 1. Ride-Hailing Microservices Ecosystem
- **Auth Service** (`:8001`): JWT tokens, authentication, and role-based access control (Admin, SRE Lead).
- **Ride Service** (`:8002`): Ride requests, dispatcher, and lifecycle management.
- **Driver Service** (`:8003`): Driver availability fleet, location updates, and ratings.
- **Trip Service** (`:8004`): Complete trip state machine (`REQUESTED` -> `DRIVER_ASSIGNED` -> `DRIVER_ARRIVING` -> `RIDE_STARTED` -> `COMPLETED`).
- **Pricing Service** (`:8005`): Dynamic surge pricing algorithms and simulation.
- **Location Service** (`:8006`): Coordinate storage, geofencing, and proximity search.
- **Notification Service** (`:8007`): Multi-channel alert dispatch and incident broadcasts.
- **API Gateway** (`:8000`): Ingress routing, rate limiting, and Prometheus `/metrics` exporter.

### 2. Cognitive LangGraph Multi-Agent SRE System
- **Monitoring Agent**: Continuously ingests Prometheus metrics, Loki logs, and pod states.
- **Anomaly Detection Agent**: Statistical dynamic Z-score & ML heuristics to eliminate false alarms.
- **Root Cause Agent (RCA)**: Deep inspection traversing dependencies and stack traces.
- **Recovery Planner**: Synthesizes structured Kubernetes remediation plans.
- **Execution Agent**: Interacts with Kubernetes API (`kubectl restart`, `kubectl scale`, `kubectl rollback`).
- **Validation Agent**: Post-recovery SLA verification and MTTR measurement.
- **Knowledge Base Agent**: Self-learning memory recording incident playbooks and empirical success rates.

### 3. Failure & Chaos Simulation Lab
Interactive 1-click fault injection cards:
- **Simulate CPU Spike**: 95%+ core utilization thread exhaustion.
- **Simulate Memory Leak**: Unbounded heap object accumulation simulating OOM danger.
- **Kill Service / Pod Crash**: Injects SIGSEGV forcing `CrashLoopBackOff`.
- **Traffic Overload**: 500+ RPS burst exceeding queue capacity.
- **Database Bottleneck**: PostgreSQL pool exhaustion and lock contention.
- **Network Partition**: Packet drops and 504 Gateway Timeouts.

### 4. AWS CloudWatch + AI SRE Style Dark Dashboard
- **Main Overview**: Health index, Recharts CPU/RAM/Reqs graphs, active pod grid, active incident alerts.
- **Microservice Monitor**: Per-service CPU/RAM gauges, latency sparklines, restart counts, and pod log viewer.
- **Incident Management**: Incident timeline, RCA chain-of-thought, recovery action breakdown, MTTR metrics.
- **Agent Reasoning Stream**: Live LangGraph state flow visualizer and real-time thought stream.
- **Chaos Lab**: Fault injection triggers with split-screen auto-healing preview.
- **Knowledge Base**: Searchable playbooks, root cause patterns, and success rate tracking.

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Docker (Optional for containerized deployment)

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Backend & API Gateway
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger API Docs: `http://localhost:8000/docs`
- Prometheus Metrics: `http://localhost:8000/api/v1/metrics`
- SSE Live Event Stream: `http://localhost:8000/api/v1/stream/events`

### 3. Install & Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Docker & Docker Compose Deployment

To launch the full stack (PostgreSQL, Prometheus, Microservices Backend, and Nginx Frontend):
```bash
docker-compose up --build
```
- Web Dashboard: `http://localhost:3000`
- API Gateway & Docs: `http://localhost:8000/docs`
- Prometheus Dashboard: `http://localhost:9090`

---

## Kubernetes Cluster Deployment

Deploy manifests to your Kubernetes cluster:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap-secrets.yaml
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/03-microservices.yaml
kubectl apply -f k8s/04-api-gateway.yaml
kubectl apply -f k8s/05-agent-system.yaml
kubectl apply -f k8s/06-hpa.yaml
kubectl apply -f k8s/07-prometheus-grafana.yaml
kubectl apply -f k8s/08-ingress.yaml
```

Check pod status:
```bash
kubectl get pods -n ride-hailing-system -o wide
```

---

## Running Autonomous Demo Script

Run the automated chaos injection and auto-healing demo:
```bash
python run_demo.py
```

---

## License
MIT License. Built for advanced cloud infrastructure automation & AI SRE research.
