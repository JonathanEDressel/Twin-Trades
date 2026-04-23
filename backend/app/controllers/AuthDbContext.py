from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.models.UserModel import RefreshToken, OtpToken, LoginAudit


class AuthDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_refresh_token(self, token_hash: str) -> RefreshToken | None:
        # Query refresh_tokens by token_hash and return the row if it exists and is not revoked.
        # Return None if the hash is not found — callers handle the missing case with UnauthorizedError.
        pass

    async def insert_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
        # Insert a new refresh_tokens row with the provided hash and expiry.
        # Flush and return the new ORM object so the caller can read the auto-generated id.
        pass

    async def revoke_all_refresh_tokens(self, user_id: int) -> int:
        # Set revoked_at = now() on all non-revoked refresh tokens for the given user_id.
        # Return the count of rows updated so the caller can log how many sessions were ended.
        pass

    async def find_otp_token(self, user_id: int, purpose: str) -> OtpToken | None:
        # Return the most recent non-expired, non-used OTP row for this user+purpose combination.
        # Order by created_at DESC and return only the first result.
        pass

    async def insert_otp_token(self, user_id: int, otp_hash: str, purpose: str, expires_at: datetime) -> OtpToken:
        # Insert a new otp_tokens row with the bcrypt-hashed OTP value and expiry timestamp.
        # Flush and return the new object — callers must call session.commit() after dispatch succeeds.
        pass

    async def mark_otp_used(self, otp_id: int) -> None:
        # Set used_at = now() on the given OTP row to prevent replay attacks.
        # This must be called inside the same transaction as the action the OTP authorizes.
        pass

    async def insert_login_audit(self, user_id: int | None, ip: str | None, user_agent: str | None, success: bool) -> None:
        # Insert a login_audits row for forensic / anomaly-detection purposes.
        # Never raise on failure — wrap in try/except so a logging failure cannot abort a login.
        pass
