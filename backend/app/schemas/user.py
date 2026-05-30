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

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str