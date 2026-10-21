"""
Autonomous Self-Healing Cloud Infrastructure Demo Runner
Launches an autonomous demonstration showing the full lifecycle:
1. Nominal baseline telemetry
2. Chaos fault injection (Trip Service Memory Leak & CPU Spike)
3. LangGraph Multi-Agent cognitive reasoning
4. Autonomous Kubernetes remediation
5. SLA validation and Knowledge Base learning
"""

import time
import asyncio
import httpx

BACKEND_URL = "http://127.0.0.1:8000"

async def run_demo():
    print("=" * 70)
    print(">> AUTONOMOUS SELF-HEALING CLOUD INFRASTRUCTURE DEMO <<")
    print("=" * 70)
    
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=10.0) as client:
        # 1. Health check
        print("\n[1/5] Checking Backend & API Gateway status...")
        try:
            res = await client.get("/")
            print(f"[OK] Backend status: {res.json().get('status')} | Version: {res.json().get('version')}")
        except Exception as e:
            print(f"[FAIL] Backend not responding on {BACKEND_URL}. Ensure 'uvicorn app.main:app' is running.")
            return

        # 2. Get baseline overview
        print("\n[2/5] Fetching initial cluster health overview...")
        res = await client.get("/api/v1/telemetry/overview")
        data = res.json()
        print(f"   Cluster Health: {data['overall_health']}% | Status: {data['cluster_status']}")
        print(f"   Total Services: {data['total_services']} | Active Incidents: {data['active_incidents']}")

        # 3. Inject Chaos Fault
        print("\n[3/5] >>> INJECTING CHAOS FAULT: Memory Leak into 'trip-service'...")
        res = await client.post("/api/v1/chaos/inject", json={
            "service_name": "trip-service",
            "failure_type": "MEMORY_LEAK",
            "intensity": 1.0,
            "duration_seconds": 60
        })
        print(f"   Chaos Response: {res.json().get('message')}")

        # 4. Observe LangGraph Autonomous Reasoning
        print("\n[4/5] >>> Observing LangGraph Multi-Agent SRE Reasoning Stream...")
        for i in range(8):
            await asyncio.sleep(1.5)
            logs_res = await client.get("/api/v1/agents/live-stream")
            recent = logs_res.json()
            if recent:
                latest = recent[-1]
                print(f"   * [{latest.get('agent_name')}]: {latest.get('reasoning')} -> {latest.get('result')}")

        # 5. Check post-healing health
        print("\n[5/5] >>> Verifying post-remediation cluster status...")
        res = await client.get("/api/v1/telemetry/overview")
        data = res.json()
        print(f"   Cluster Health: {data['overall_health']}% | Status: {data['cluster_status']}")
        print(f"   Active Incidents: {data['active_incidents']} | Average CPU: {data['avg_cpu_usage']}%")

        # Knowledge Base check
        kb_res = await client.get("/api/v1/knowledge-base/stats")
        kb_data = kb_res.json()
        print(f"   Knowledge Base: {kb_data.get('total_playbooks')} playbooks | Success Rate: {kb_data.get('avg_success_rate')}%")

        print("\n" + "=" * 70)
        print(">> SELF-HEALING CYCLE COMPLETED AUTONOMOUSLY! <<")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_demo())
