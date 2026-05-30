from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class CreatePostResponse(BaseModel):
    id: uuid.UUID
    text_content: str
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True