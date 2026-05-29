from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import SignupRequest, SignupResponse
from passlib.context import CryptContext
import resend
import os
import secrets
from datetime import date

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

resend.api_key = os.getenv("RESEND_API_KEY")

def validate_email(email: str):
    return email.endswith("@ulster.ac.uk")

def validate_student_id(student_id: str):
    return student_id.isdigit() and 8 <= len(student_id) <= 10

def validate_age(dob: date):
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return 17 <= age <= 28

@router.post("/signup", response_model=SignupResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if not validate_email(data.email):
        raise HTTPException(status_code=400, detail="Email must be a valid @ulster.ac.uk address")
    
    if not validate_student_id(data.student_id):
        raise HTTPException(status_code=400, detail="Student ID must be 8 to 10 digits")
    
    if not validate_age(data.dob):
        raise HTTPException(status_code=400, detail="You must be between 17 and 28 years old")
    
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_student = db.query(User).filter(User.student_id == data.student_id).first()
    if existing_student:
        raise HTTPException(status_code=400, detail="Student ID already registered")
    
    password_hash = pwd_context.hash(data.password)
    
    verification_token = secrets.token_urlsafe(32)
    
    new_user = User(
        email=data.email,
        student_id=data.student_id,
        password_hash=password_hash,
        is_verified=False,
        profile_completed=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": data.email,
        "subject": "Verify your Unipulse account",
        "html": f"<p>Click the link below to verify your Unipulse account:</p><a href='http://localhost:8000/auth/verify?token={verification_token}'>Verify Email</a>"
    })
    
    return {"message": "Account created. Please check your email to verify your account."}