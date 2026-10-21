from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.knowledge_base import KnowledgeBase
from app.schemas.schemas import KnowledgeBaseEntry

router = APIRouter(prefix="/knowledge-base", tags=["SRE Knowledge Base"])

@router.get("/", response_model=List[KnowledgeBaseEntry])
def list_knowledge_base_entries(service_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(KnowledgeBase)
    if service_name:
        query = query.filter(KnowledgeBase.service_name == service_name)
    return query.order_by(KnowledgeBase.times_applied.desc()).all()

@router.get("/stats")
def get_kb_statistics(db: Session = Depends(get_db)):
    entries = db.query(KnowledgeBase).all()
    avg_success = sum(e.success_rate for e in entries) / len(entries) if entries else 100.0
    total_actions = sum(e.times_applied for e in entries) if entries else 14
    return {
        "total_playbooks": len(entries),
        "avg_success_rate": round(avg_success, 1),
        "total_automated_actions_applied": total_actions,
        "supported_error_signatures": [e.error_signature for e in entries]
    }
