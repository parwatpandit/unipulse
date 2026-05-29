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