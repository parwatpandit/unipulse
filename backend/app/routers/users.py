from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from supabase import create_client
import os
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import CompleteProfileRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

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

@router.post("/profile-picture")
def upload_profile_picture(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_bytes = image.file.read()
    file_ext = image.filename.split(".")[-1]
    file_name = f"profile-pictures/{current_user.id}.{file_ext}"

    try:
        supabase.storage.from_("unipulse").upload(file_name, file_bytes, {"content-type": image.content_type, "upsert": "true"})
        image_url = supabase.storage.from_("unipulse").get_public_url(file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    current_user.profile_picture_url = image_url
    db.commit()
    return {"message": "Profile picture updated successfully", "profile_picture_url": image_url}