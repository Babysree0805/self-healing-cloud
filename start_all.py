"""
Velocity & Autonomous Self-Healing Cloud Platform Launcher
Starts:
1. Backend & API Gateway on http://localhost:8000
2. SRE Operator Dashboard on http://localhost:5173
3. Velocity Ride Hailing App on http://localhost:5174
"""

import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print("=" * 70)
    print(">> STARTING AUTONOMOUS SELF-HEALING CLOUD & RYDEX MOBILITY SUITE <<")
    print("=" * 70)
    print("1. Backend Microservices & Ingress Gateway:  http://localhost:8000")
    print("   -> Swagger API Documentation:             http://localhost:8000/docs")
    print("2. SRE Admin & Chaos Engineering Console:     http://localhost:5173")
    print("3. Rydex Urban Mobility Suite:                http://localhost:5174")
    print("   -> 🧑 Passenger App (Bike, Auto, Parcel): http://localhost:5174#passenger")
    print("   -> 🛵 Driver / Captain Portal (Fleet):    http://localhost:5174#driver")
    print("   -> 🔑 3-Role Unified Login:               http://localhost:5174#login")
    print("=" * 70)

    # Launch Backend
    print("\n[+] Launching FastAPI Backend on :8000...")
    env = os.environ.copy()
    backend_path = os.path.join(root_dir, "backend")
    env["PYTHONPATH"] = backend_path + os.pathsep + env.get("PYTHONPATH", "")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_path,
        env=env
    )

    time.sleep(2)

    # Launch Admin Frontend
    print("[+] Launching SRE Admin Console on :5173...")
    admin_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(root_dir, "frontend"),
        shell=True
    )

    # Launch Velocity Frontend
    print("[+] Launching Velocity Ride App on :5174...")
    velocity_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(root_dir, "velocity-app"),
        shell=True
    )

    print("\n>>> All 3 services are active! Press Ctrl+C in this terminal to stop all.")
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down all processes...")
        backend_proc.terminate()
        admin_proc.terminate()
        velocity_proc.terminate()

if __name__ == "__main__":
    main()
