import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum,
    ForeignKey, Text
)
from app.models.Base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class RebalanceConfirmation(str, enum.Enum):
    push = "push"
    email = "email"
    sms = "sms"


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.user)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    must_change_password = Column(Boolean, nullable=False, default=False)
    subscription_exempt = Column(Boolean, nullable=False, default=False)
    rebalance_confirmation = Column(
        SAEnum(RebalanceConfirmation), nullable=False,
        default=RebalanceConfirmation.push
    )
    apns_device_token = Column(String(255), nullable=True)
    phone_number = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class OtpToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False)   # "login_2fa" | "password_reset"
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)


class LoginAudit(Base):
    __tablename__ = "login_audits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
