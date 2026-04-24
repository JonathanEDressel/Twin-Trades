from pydantic import BaseModel, field_validator
import re


class LoginPayload(BaseModel):
    email: str
    password: str


class RegisterPayload(BaseModel):
    email: str
    username: str
    password: str
    display_name: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain a special character (!@#$%^&*)")
        return v


class OtpPayload(BaseModel):
    otp: str
    purpose: str   # "login_2fa" | "password_reset"


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordPayload(BaseModel):
    email: str


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str


class RefreshPayload(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
