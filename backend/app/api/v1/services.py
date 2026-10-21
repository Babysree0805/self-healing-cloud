from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.service import Service
from app.schemas.schemas import ServiceResponse
from app.k8s_runtime.k8s_controller import k8s_controller

router = APIRouter(prefix="/services", tags=["Microservices Management"])

@router.get("/", response_model=List[ServiceResponse])
def get_all_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    # Sync pod name
    for s in services:
        pod = k8s_controller.get_pod_for_service(s.service_name)
        if pod:
            s.pod_name = pod.pod_name
    return services

@router.get("/{service_name}", response_model=ServiceResponse)
def get_service_by_name(service_name: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.service_name == service_name).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    pod = k8s_controller.get_pod_for_service(service_name)
    if pod:
        service.pod_name = pod.pod_name
    return service

@router.get("/{service_name}/logs")
def get_service_logs(service_name: str):
    logs = k8s_controller.get_logs(service_name)
    return {"service_name": service_name, "logs": logs}
