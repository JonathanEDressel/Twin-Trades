from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.models.UserModel import RefreshToken, OtpToken, LoginAudit


class AuthDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_refresh_token(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def insert_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
        token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.session.add(token)
        await self.session.flush()
        return token

    async def revoke_all_refresh_tokens(self, user_id: int) -> int:
        print("REVOKING TOKENS: ", user_id)
        result = await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        return result.rowcount

    async def find_otp_token(self, user_id: int, purpose: str) -> OtpToken | None:
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(OtpToken)
            .where(
                OtpToken.user_id == user_id,
                OtpToken.purpose == purpose,
                OtpToken.used_at.is_(None),
                OtpToken.expires_at > now,
            )
            .order_by(OtpToken.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def insert_otp_token(self, user_id: int, otp_hash: str, purpose: str, expires_at: datetime) -> OtpToken:
        token = OtpToken(user_id=user_id, otp_hash=otp_hash, purpose=purpose, expires_at=expires_at)
        self.session.add(token)
        await self.session.flush()
        return token

    async def mark_otp_used(self, otp_id: int) -> None:
        await self.session.execute(
            update(OtpToken)
            .where(OtpToken.id == otp_id)
            .values(used_at=datetime.now(timezone.utc))
        )

    async def invalidate_otps(self, user_id: int, purpose: str) -> None:
        await self.session.execute(
            update(OtpToken)
            .where(
                OtpToken.user_id == user_id,
                OtpToken.purpose == purpose,
                OtpToken.used_at.is_(None),
            )
            .values(used_at=datetime.now(timezone.utc))
        )

    async def insert_login_audit(self, user_id: int | None, ip: str | None, user_agent: str | None, success: bool) -> None:
        try:
            audit = LoginAudit(
                user_id=user_id,
                ip_address=ip,
                user_agent=user_agent,
                success=success,
            )
            self.session.add(audit)
            await self.session.flush()
        except Exception:
            pass
