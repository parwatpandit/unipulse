from sqlalchemy import Column, String, Boolean, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    student_id = Column(String(10), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    course = Column(String)
    course_start_year = Column(Integer)
    dob = Column(Date)
    country = Column(String)
    sex = Column(String)
    relationship_status = Column(String)
    partner_profile_link = Column(String)
    profile_picture_url = Column(String)
    is_verified = Column(Boolean, default=False)
    profile_completed = Column(Boolean, default=False)
    verification_token = Column(String)
    reset_token = Column(String)