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
    role: str = ""  # optional: if provided, must match user's actual role

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

    # If the frontend sent a role, verify it matches
    if req.role and user.role != req.role:
        raise HTTPException(
            status_code=403,
            detail=f"Your account is registered as '{user.role}', not '{req.role}'. Please select the correct role."
        )
    
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

class RoleUpdateRequest(BaseModel):
    role: str

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, req: RoleUpdateRequest, db: Session = Depends(get_db)):
    """Admin endpoint to update user roles."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = req.role
    db.commit()
    return {"message": "Role updated successfully", "new_role": user.role}

class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str

@router.put("/users/{user_id}/profile")
def update_profile(user_id: str, req: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_name = req.full_name
    
    # Ideally should verify if new email exists when changing, but let's do a basic update
    if user.email != req.email:
        if db.query(User).filter(User.email == req.email).first():
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = req.email

    db.commit()
    return {"message": "Profile updated", "full_name": user.full_name, "email": user.email}
