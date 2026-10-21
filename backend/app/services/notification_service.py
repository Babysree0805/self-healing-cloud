from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/notifications", tags=["Notification Service"])

class AlertBroadcast(BaseModel):
    title: str
    message: str
    channel: str = "PAGERDUTY_AND_SLACK" # SLACK, EMAIL, PAGERDUTY, SMS
    severity: str = "HIGH"
    incident_id: Optional[str] = None

notifications_log: List[dict] = [
    {
        "notification_id": "NOTIF-001",
        "title": "System Online",
        "message": "Autonomous Self-Healing SRE Agent initialized and observing cluster.",
        "channel": "SYSTEM_BUS",
        "severity": "INFO",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
]

@router.get("/list", response_model=List[dict])
def get_notifications():
    return notifications_log[-30:] # Return latest 30 notifications

@router.post("/send")
def send_notification(alert: AlertBroadcast):
    notif = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
        "title": alert.title,
        "message": alert.message,
        "channel": alert.channel,
        "severity": alert.severity,
        "incident_id": alert.incident_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    notifications_log.append(notif)
    return {"status": "DELIVERED", "notification": notif}
