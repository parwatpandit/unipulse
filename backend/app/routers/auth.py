from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import SignupRequest, SignupResponse, LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest, CompleteProfileRequest
import bcrypt
import resend
import os
import secrets
from datetime import date, datetime, timedelta
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

# removed pwd_context

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
    
    password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    verification_token = secrets.token_urlsafe(32)
    
    new_user = User(
    email=data.email,
    student_id=data.student_id,
    password_hash=password_hash,
    dob=data.dob,
    is_verified=False,
    profile_completed=False,
    verification_token=verification_token
)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    resend.Emails.send({
        "from": "noreply@unipulse.xyz",
        "to": data.email,
        "subject": "Verify your Unipulse account",
        "html": f"<p>Click the link below to verify your Unipulse account:</p><a href='http://localhost:8000/auth/verify?token={verification_token}'>Verify Email</a>"
    })
    
    return {"message": "Account created. Please check your email to verify your account."}

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully. You can now log in."}

@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not bcrypt.checkpw(data.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email before logging in")
    
    access_token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(minutes=1440)},
        os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM")
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        return {"message": "If that email is registered you will receive a reset link shortly"}
    
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.commit()
    
    resend.Emails.send({
        "from": "noreply@unipulse.xyz",
        "to": data.email,
        "subject": "Reset your Unipulse password",
        "html": f"<p>Click the link below to reset your password:</p><a href='http://localhost:8000/auth/reset-password?token={reset_token}'>Reset Password</a>"
    })
    
    return {"message": "If that email is registered you will receive a reset link shortly"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == data.token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    user.password_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.reset_token = None
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in."}