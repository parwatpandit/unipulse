from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.post import Post
from app.schemas.post import CreatePostResponse
from app.utils.auth import get_current_user
from app.models.user import User
import os
import uuid
from supabase import create_client

router = APIRouter(prefix="/posts", tags=["posts"])

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@router.post("/", response_model=CreatePostResponse)
def create_post(
    text_content: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    if not current_user.profile_completed:
        raise HTTPException(status_code=403, detail="Please complete your profile before posting")

    image_url = None

    if image and image.filename:
        file_bytes = image.file.read()
        file_ext = image.filename.split(".")[-1]
        file_name = f"posts/{uuid.uuid4()}.{file_ext}"
        try:
            supabase.storage.from_("unipulse").upload(file_name, file_bytes, {"content-type": image.content_type})
            image_url = supabase.storage.from_("unipulse").get_public_url(file_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    new_post = Post(
        user_id=current_user.id,
        text_content=text_content,
        image_url=image_url
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post