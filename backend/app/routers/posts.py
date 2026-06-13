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
from sqlalchemy import func, exists, and_
from app.routers.likes import Like

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

    return {
        "id": new_post.id,
        "user_id": new_post.user_id,
        "text_content": new_post.text_content,
        "image_url": new_post.image_url,
        "created_at": new_post.created_at,
        "full_name": current_user.full_name,
        "course": current_user.course,
        "profile_picture_url": current_user.profile_picture_url,
    }

@router.get("/", response_model=list[CreatePostResponse])
def get_all_posts(skip: int = 0, limit: int = 25, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post, User).join(User, Post.user_id == User.id).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    post_ids = [post.id for post, user in posts]
    
    like_counts = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(post_ids))
        .group_by(Like.post_id)
        .all()
    ) if post_ids else {}
    
    liked_posts = set(
        row[0] for row in db.query(Like.post_id)
        .filter(Like.post_id.in_(post_ids), Like.user_id == current_user.id)
        .all()
    ) if post_ids else set()
    
    result = []
    for post, user in posts:
        pid = post.id
        result.append({
            "id": post.id,
            "user_id": post.user_id,
            "text_content": post.text_content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "full_name": user.full_name,
            "course": user.course,
            "profile_picture_url": user.profile_picture_url,
            "like_count": like_counts.get(pid, 0),
            "liked": pid in liked_posts,
        })
    return result

@router.get("/user/{user_id}", response_model=list[CreatePostResponse])
def get_posts_by_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post, User).join(User, Post.user_id == User.id).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).all()

    post_ids = [post.id for post, user in posts]

    like_counts = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(post_ids))
        .group_by(Like.post_id)
        .all()
)

    liked_posts = set(
        row[0] for row in db.query(Like.post_id)
        .filter(Like.post_id.in_(post_ids), Like.user_id == current_user.id)
        .all()
    ) if post_ids else set()

    result = []
    for post, user in posts:
        pid = post.id
        result.append({
            "id": post.id,
            "user_id": post.user_id,
            "text_content": post.text_content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "full_name": user.full_name,
            "course": user.course,
            "profile_picture_url": user.profile_picture_url,
            "like_count": like_counts.get(pid, 0),
            "liked": pid in liked_posts,
        })
    return result

@router.delete("/{post_id}")
def delete_post(post_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}