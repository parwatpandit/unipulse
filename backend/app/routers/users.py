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

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "course": current_user.course,
        "course_start_year": current_user.course_start_year,
        "country": current_user.country,
        "sex": current_user.sex,
        "relationship_status": current_user.relationship_status,
        "profile_picture_url": current_user.profile_picture_url,
        "profile_completed": current_user.profile_completed,
    }

@router.get("/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    from app.routers.friends import Friend
    friend_count = db.query(Friend).filter(
        Friend.status == "accepted",
        (Friend.user_id == user_id) | (Friend.friend_id == user_id)
    ).count()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "course": user.course,
        "course_start_year": user.course_start_year,
        "country": user.country,
        "sex": user.sex,
        "relationship_status": user.relationship_status,
        "profile_picture_url": user.profile_picture_url,
        "friend_count": friend_count,
    }

@router.put("/me")
def update_profile(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if "full_name" in data:
        current_user.full_name = data["full_name"]
    if "course" in data:
        current_user.course = data["course"]
    if "country" in data:
        current_user.country = data["country"]
    if "relationship_status" in data:
        current_user.relationship_status = data["relationship_status"]
    db.commit()
    return {"message": "Profile updated"}