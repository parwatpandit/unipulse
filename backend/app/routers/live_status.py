from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timedelta
from app.database import get_db, Base
from app.models.user import User
from app.utils.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

class LiveStatus(Base):
    __tablename__ = "live_status"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    status_type = Column(String, nullable=False, default="none")
    place_name = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class UpdateLiveStatusRequest(BaseModel):
    status_type: str
    place_name: Optional[str] = None

router = APIRouter(prefix="/live-status", tags=["live-status"])

@router.post("/")
def update_live_status(data: UpdateLiveStatusRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    valid_statuses = ["on campus", "at work", "at home", "travelling", "none"]
    if data.status_type not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status type")
    if data.status_type == "travelling" and not data.place_name:
        raise HTTPException(status_code=400, detail="Place name is required when travelling")

    expires_at = datetime.utcnow() + timedelta(hours=1) if data.status_type != "none" else None

    status = db.query(LiveStatus).filter(LiveStatus.user_id == current_user.id).first()

    if status:
        status.status_type = data.status_type
        status.place_name = data.place_name
        status.expires_at = expires_at
        status.updated_at = datetime.utcnow()
    else:
        status = LiveStatus(
            user_id=current_user.id,
            status_type=data.status_type,
            place_name=data.place_name,
            expires_at=expires_at
        )
        db.add(status)

    db.commit()
    return {"message": "Live status updated"}

@router.get("/{user_id}")
def get_live_status(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    status = db.query(LiveStatus).filter(LiveStatus.user_id == user_id).first()
    if not status:
        return {"status_type": "none", "place_name": None}
    if status.expires_at and datetime.utcnow() > status.expires_at:
        status.status_type = "none"
        status.place_name = None
        status.expires_at = None
        db.commit()
    return {"status_type": status.status_type, "place_name": status.place_name}