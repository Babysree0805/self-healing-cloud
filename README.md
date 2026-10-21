---
title: Rydex Self-Healing Cloud
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
short_description: Autonomous Self-Healing Cloud Infrastructure for Ride-Hailing
---

# Rydex — Autonomous Self-Healing Cloud Infrastructure

**Team D5 | Cloud Computing Project**

## Live Endpoints

| Service | URL |
|---|---|
| API Gateway | `/` |
| API Docs (Swagger) | `/docs` |
| Kubernetes Pods | `/api/v1/k8s/pods` |
| Cluster Health | `/api/v1/k8s/cluster/health` |
| Rydex Ride App | `/app/` |
| SRE Dashboard | `/sre/` |

## About

This project demonstrates an **Autonomous Self-Healing Cloud Platform** built as a ride-hailing application called **Rydex**.

- **Microservices**: auth-service, ride-service, driver-service, trip-service, pricing-service
- **Kubernetes Runtime**: Simulated K8s pod orchestration with HPA autoscaling
- **SRE Agent Pipeline**: LangGraph-based autonomous fault detection and recovery
- **Chaos Engineering**: 6 fault types with self-healing in 4–10 seconds
