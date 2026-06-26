import random
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from auth import hash_password, verify_password, sign_token, get_current_user
from database import get_pool, row_to_dict, public_user

router = APIRouter(prefix="/auth")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def gen_otp() -> str:
    return str(random.randint(100000, 999999))


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v.lower()


class LoginBody(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower()


class ForgotBody(BaseModel):
    email: str


class VerifyOTPBody(BaseModel):
    email: str
    otp: str
    newPassword: Optional[str] = None


class ProfileBody(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    jobTitle: Optional[str] = None
    location: Optional[str] = None
    avatarUrl: Optional[str] = None


@router.post("/register", status_code=201)
async def register(body: RegisterBody):
    if len(body.name) < 2:
        raise HTTPException(400, "Name must be at least 2 characters")
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    pool = await get_pool()
    existing = await pool.fetchrow("SELECT id FROM users WHERE email=$1", body.email)
    if existing:
        raise HTTPException(409, "Email already registered")

    password_hash = hash_password(body.password)
    otp = gen_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    user = await pool.fetchrow(
        """INSERT INTO users (name, email, password_hash, role, otp, otp_expires_at)
           VALUES ($1,$2,$3,'user',$4,$5) RETURNING *""",
        body.name, body.email, password_hash, otp, otp_expires,
    )
    u = row_to_dict(user)
    token = sign_token(u["id"], u["email"], u["role"])
    return {"token": token, "user": public_user(u), "otpSent": True, "otp": otp}


@router.post("/login")
async def login(body: LoginBody):
    pool = await get_pool()
    user = await pool.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    if not user:
        raise HTTPException(401, "Invalid email or password")

    u = row_to_dict(user)
    if not verify_password(body.password, u["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = sign_token(u["id"], u["email"], u["role"])
    return {"token": token, "user": public_user(u)}


@router.post("/forgot-password")
async def forgot_password(body: ForgotBody):
    pool = await get_pool()
    user = await pool.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    if not user:
        return {"message": "If that email exists, an OTP has been sent."}

    otp = gen_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    await pool.execute(
        "UPDATE users SET otp=$1, otp_expires_at=$2 WHERE id=$3",
        otp, otp_expires, user["id"],
    )
    return {"message": "OTP sent to your email.", "otp": otp}


@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPBody):
    pool = await get_pool()
    user = await pool.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    u = row_to_dict(user) if user else None

    if not u or u.get("otp") != body.otp:
        raise HTTPException(400, "Invalid OTP")

    expires = u.get("otp_expires_at")
    if expires and expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(400, "OTP has expired")

    updates = {"otp": None, "otp_expires_at": None, "is_verified": True}
    if body.newPassword:
        updates["password_hash"] = hash_password(body.newPassword)

    await pool.execute(
        """UPDATE users SET otp=NULL, otp_expires_at=NULL, is_verified=TRUE,
           password_hash=COALESCE($1, password_hash) WHERE id=$2""",
        updates.get("password_hash"), u["id"],
    )
    token = sign_token(u["id"], u["email"], u["role"])
    return {"token": token, "user": public_user({**u, "is_verified": True}), "message": "OTP verified"}


@router.get("/me")
async def get_me(current=Depends(get_current_user)):
    pool = await get_pool()
    user = await pool.fetchrow("SELECT * FROM users WHERE id=$1", current["userId"])
    if not user:
        raise HTTPException(404, "User not found")
    return {"user": public_user(row_to_dict(user))}


@router.put("/profile")
async def update_profile(body: ProfileBody, current=Depends(get_current_user)):
    pool = await get_pool()
    updated = await pool.fetchrow(
        """UPDATE users SET
           name=COALESCE($1, name),
           bio=COALESCE($2, bio),
           phone=COALESCE($3, phone),
           job_title=COALESCE($4, job_title),
           location=COALESCE($5, location),
           avatar_url=COALESCE($6, avatar_url),
           updated_at=NOW()
           WHERE id=$7 RETURNING *""",
        body.name, body.bio, body.phone, body.jobTitle,
        body.location, body.avatarUrl, current["userId"],
    )
    return {"user": public_user(row_to_dict(updated))}
