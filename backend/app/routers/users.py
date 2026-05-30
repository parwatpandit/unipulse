from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import CompleteProfileRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/complete-profile")
def complete_profile(data: CompleteProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.profile_completed:
        raise HTTPException(status_code=400, detail="Profile already completed")
    
    current_user.full_name = data.full_name
    current_user.course = data.course
    current_user.course_start_year = data.course_start_year
    current_user.country = data.country
    current_user.sex = data.sex
    current_user.relationship_status = data.relationship_status
    current_user.partner_profile_link = data.partner_profile_link
    current_user.profile_completed = True
    
    db.commit()
    
    return {"message": "Profile completed successfully"}