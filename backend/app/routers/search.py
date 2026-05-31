from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
def search_users(query: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(User).filter(
        User.is_verified == True,
        User.profile_completed == True,
        (User.full_name.ilike(f"%{query}%")) | (User.course.ilike(f"%{query}%"))
    ).all()

    return [
        {
            "id": str(user.id),
            "full_name": user.full_name,
            "course": user.course,
            "profile_picture_url": user.profile_picture_url,
        }
        for user in results
    ]