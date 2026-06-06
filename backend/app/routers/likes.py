from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from app.database import Base
from datetime import datetime
import uuid

class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint('post_id', 'user_id'),)
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

router = APIRouter(prefix="/likes", tags=["likes"])

@router.post("/{post_id}")
def toggle_like(post_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Like).filter(Like.post_id == post_id, Like.user_id == str(current_user.id)).first()
    if existing:
        db.delete(existing)
        db.commit()
    else:
        new_like = Like(post_id=post_id, user_id=str(current_user.id))
        db.add(new_like)
        db.commit()
    count = db.query(Like).filter(Like.post_id == post_id).count()
    liked = not bool(existing)
    return {"liked": liked, "like_count": count}

@router.get("/{post_id}")
def get_likes(post_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Like).filter(Like.post_id == post_id).count()
    liked = db.query(Like).filter(Like.post_id == post_id, Like.user_id == str(current_user.id)).first()
    return {"count": count, "liked": bool(liked)}

@router.get("/{post_id}/users")
def get_liked_users(post_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    likes = db.query(Like, User).join(User, Like.user_id == User.id).filter(Like.post_id == post_id).all()
    return [{"user_id": user.id, "full_name": user.full_name, "profile_picture_url": user.profile_picture_url} for like, user in likes]