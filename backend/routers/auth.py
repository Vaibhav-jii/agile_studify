from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User
from pydantic import BaseModel
import hashlib

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str  # admin, teacher, student
    full_name: str = ""

def hash_pass(pwd: str) -> str:
    # simple hashing for demo purposes; in prod use bcrypt (passlib)
    return hashlib.sha256(pwd.encode()).hexdigest()

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=req.email,
        hashed_password=hash_pass(req.password),
        role=req.role,
        full_name=req.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered", "id": new_user.id, "role": new_user.role}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.hashed_password != hash_pass(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "id": user.id, 
        "email": user.email, 
        "role": user.role, 
        "full_name": user.full_name
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Admin endpoint to list all users."""
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "full_name": u.full_name} for u in users]
