from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class SignupRequest(BaseModel):
    email: str
    student_id: str
    password: str
    dob: date

class SignupResponse(BaseModel):
    message: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    profile_completed: bool
    
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class CompleteProfileRequest(BaseModel):
    full_name: str
    course: str
    course_start_year: int
    country: str
    sex: str
    relationship_status: str
    partner_profile_link: Optional[str] = None