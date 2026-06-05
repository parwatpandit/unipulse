from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class CreatePostResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    text_content: str
    image_url: Optional[str]
    created_at: datetime
    full_name: Optional[str]
    course: Optional[str]
    profile_picture_url: Optional[str]
    like_count: Optional[int] = 0
    liked: Optional[bool] = False

    class Config:
        from_attributes = True