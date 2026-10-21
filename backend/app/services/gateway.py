from fastapi import APIRouter, Request, Response, HTTPException
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time

router = APIRouter(tags=["API Gateway & Prometheus Metrics"])

# Prometheus Metrics Definitions
REQUEST_COUNT = Counter(
    "cloud_api_requests_total",
    "Total incoming HTTP requests across all microservices",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "cloud_api_request_duration_seconds",
    "HTTP request latency in seconds",
    ["endpoint"]
)
CLUSTER_CPU_GAUGE = Gauge(
    "cluster_cpu_usage_percent",
    "Average Cluster CPU usage percentage"
)
CLUSTER_MEMORY_GAUGE = Gauge(
    "cluster_memory_usage_percent",
    "Average Cluster Memory usage percentage"
)
ACTIVE_INCIDENTS_GAUGE = Gauge(
    "cluster_active_incidents_total",
    "Total unresolved active incidents in cluster"
)

@router.get("/metrics")
def get_prometheus_metrics():
    """Exposes standard Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@router.get("/gateway/health")
def gateway_health():
    return {
        "status": "UP",
        "gateway_version": "v1.4.0",
        "active_routes": [
            "/api/v1/auth",
            "/api/v1/rides",
            "/api/v1/drivers",
            "/api/v1/trips",
            "/api/v1/pricing",
            "/api/v1/location",
            "/api/v1/notifications"
        ],
        "circuit_breaker": "CLOSED",
        "rate_limiting": "ENABLED"
    }
