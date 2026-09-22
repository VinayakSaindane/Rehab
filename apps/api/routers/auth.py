import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
from database import get_db_collection
from models.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, DemoSwitchRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        # For demo convenience, if no token header provided, default to demo patient
        users_col = get_db_collection("users")
        user = await users_col.find_one({"email": "patient@rehabsense.demo"})
        if user:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token could not be validated")

    users_col = get_db_collection("users")
    user = await users_col.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(allowed_role: str):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != allowed_role and current_user.get("role") != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role {current_user.get('role')}. Required: {allowed_role}"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    users_col = get_db_collection("users")
    user = await users_col.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token(data={"sub": user["id"], "role": user["role"], "email": user["email"]})
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"]
    )

@router.post("/demo-switch", response_model=TokenResponse)
async def demo_switch(switch_data: DemoSwitchRequest):
    """
    Instant 1-click switcher for hackathon judges to toggle between Patient and Therapist roles.
    """
    email = "therapist@rehabsense.demo" if switch_data.role == "THERAPIST" else "patient@rehabsense.demo"
    users_col = get_db_collection("users")
    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found. Please run seed script.")

    token = create_access_token(data={"sub": user["id"], "role": user["role"], "email": user["email"]})
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"]
    )

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }
