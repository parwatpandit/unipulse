from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from sqlalchemy import Column, String, DateTime
from sqlalchemy import text as sql_text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base
from app.routers.notifications import Notification
from app.routers.notifications import emit_notification

class Friend(Base):
    __tablename__ = "friends"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    friend_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

router = APIRouter(prefix="/friends", tags=["friends"])

@router.post("/request/{user_id}")
def send_friend_request(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="You cannot send a friend request to yourself")
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(Friend).filter(
        Friend.user_id == current_user.id,
        Friend.friend_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    friend_request = Friend(user_id=current_user.id, friend_id=user_id, status="pending")
    db.add(friend_request)
    db.commit()
    notification = Notification(
        user_id=uuid.UUID(user_id),
        from_user_id=current_user.id,
        type="friend_request"
    )
    db.add(notification)
    db.commit()
    asyncio.create_task(emit_notification(user_id))
    return {"message": "Friend request sent"}

@router.post("/accept/{request_id}")
def accept_friend_request(request_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friend_request = db.query(Friend).filter(Friend.id == request_id, Friend.friend_id == current_user.id).first()
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if friend_request.status != "pending":
        raise HTTPException(status_code=400, detail="Friend request already processed")
    friend_request.status = "accepted"
    db.commit()
    notification = Notification(
        user_id=friend_request.user_id,
        from_user_id=current_user.id,
        type="friend_request_accepted"
    )
    db.add(notification)
    db.commit()
    asyncio.create_task(emit_notification(str(friend_request.user_id)))
    return {"message": "Friend request accepted"}

@router.post("/decline/{request_id}")
def decline_friend_request(request_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friend_request = db.query(Friend).filter(Friend.id == request_id, Friend.friend_id == current_user.id).first()
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if friend_request.status != "pending":
        raise HTTPException(status_code=400, detail="Friend request already processed")
    db.delete(friend_request)
    db.commit()
    return {"message": "Friend request declined"}

@router.get("/count")
def get_friend_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Friend).filter(
        Friend.status == "accepted",
        (Friend.user_id == current_user.id) | (Friend.friend_id == current_user.id)
    ).count()
    return {"friend_count": count}

@router.get("/status/{user_id}")
def get_friend_status(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friend = db.query(Friend).filter(
        ((Friend.user_id == str(current_user.id)) & (Friend.friend_id == user_id)) |
        ((Friend.user_id == user_id) & (Friend.friend_id == str(current_user.id)))
    ).first()
    if not friend:
        return {"status": "", "request_id": None}
    return {"status": friend.status, "request_id": str(friend.id)}

@router.delete("/remove/{user_id}")
def remove_friend(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Delete the friendship
    friend = db.query(Friend).filter(
        ((Friend.user_id == current_user.id) & (Friend.friend_id == uuid.UUID(user_id))) |
        ((Friend.user_id == uuid.UUID(user_id)) & (Friend.friend_id == current_user.id))
    ).first()
    
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")
    
    db.delete(friend)
    
    # Delete all messages between them
    db.execute(sql_text("""
        DELETE FROM private_messages
        WHERE (sender_id = :user_id AND receiver_id = :other_id)
           OR (sender_id = :other_id AND receiver_id = :user_id)
    """), {
        'user_id': str(current_user.id),
        'other_id': user_id
    })

    # Delete notifications between them
    db.execute(sql_text("""
        DELETE FROM notifications
        WHERE (user_id = :user_id AND from_user_id = :other_id)
           OR (user_id = :other_id AND from_user_id = :user_id)
    """), {
        'user_id': str(current_user.id),
        'other_id': user_id
    })

    db.commit()
    return {"message": "Friend removed and all data erased"}