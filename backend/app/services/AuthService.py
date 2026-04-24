import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.AuthDbContext import AuthDbContext
from app.controllers.UserDbContext import UserDbContext
from app.helper.Security import Security, REFRESH_TOKEN_EXPIRE_DAYS
from app.helper.ErrorHandler import UnauthorizedError, ConflictError
from app.schemas.Auth import LoginPayload, RegisterPayload, RefreshPayload, TokenResponse


class AuthService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.auth_db = AuthDbContext(session)
        self.user_db = UserDbContext(session)

    async def login(self, payload: LoginPayload, ip: str | None, user_agent: str | None) -> TokenResponse:
        user = await self.user_db.find_by_email(payload.email)

        if user is None or not Security.verify_password(payload.password, user.password_hash):
            await self.auth_db.insert_login_audit(
                user_id=user.id if user else None,
                ip=ip,
                user_agent=user_agent,
                success=False,
            )
            await self.session.commit()
            raise UnauthorizedError("Invalid email or password")

        claims: dict = {"sub": str(user.id), "role": user.role.value}
        if user.must_change_password:
            claims["scope"] = "change_password_only"

        access_token = Security.sign_jwt(claims)
        raw_refresh = secrets.token_urlsafe(32)
        token_hash = Security.hash_refresh_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        await self.auth_db.insert_refresh_token(user.id, token_hash, expires_at)
        await self.auth_db.insert_login_audit(user.id, ip, user_agent, True)
        await self.session.commit()

        return TokenResponse(access_token=access_token, refresh_token=raw_refresh)

    async def register(self, payload: RegisterPayload) -> TokenResponse:
        if await self.user_db.find_by_email(payload.email):
            raise ConflictError("Email already registered")
        if await self.user_db.find_by_username(payload.username):
            raise ConflictError("Username already taken")

        password_hash = Security.hash_password(payload.password)
        user = await self.user_db.insert(
            email=payload.email.lower(),
            username=payload.username,
            password_hash=password_hash,
            display_name=payload.display_name,
        )

        claims = {"sub": str(user.id), "role": user.role.value}
        access_token = Security.sign_jwt(claims)
        raw_refresh = secrets.token_urlsafe(32)
        token_hash = Security.hash_refresh_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        await self.auth_db.insert_refresh_token(user.id, token_hash, expires_at)
        await self.session.commit()

        return TokenResponse(access_token=access_token, refresh_token=raw_refresh)

    async def refresh_tokens(self, payload: RefreshPayload) -> TokenResponse:
        # Validate the refresh token hash against the DB and check it is not expired or revoked.
        # Rotate: revoke the old token and issue a new access+refresh pair atomically.
        # Raise UnauthorizedError if the token is not found, revoked, or past expires_at.
        pass

    async def logout(self, payload: RefreshPayload, user_id: int) -> None:
        await self.auth_db.revoke_all_refresh_tokens(user_id)
        await self.session.commit()

    async def request_otp(self, user_id: int) -> None:
        # Generate a 6-digit OTP, hash it, insert into otp_tokens with a 10-minute TTL.
        # Dispatch via the user's rebalance_confirmation channel (email or SMS).
        # Invalidate any previous non-expired OTPs for this user and purpose before inserting.
        pass

    async def verify_otp(self, user_id: int, otp: str, purpose: str) -> bool:
        # Retrieve the most recent non-expired OTP row for this user+purpose.
        # Call Security.verify_otp for constant-time comparison; mark used on match.
        # Return True on success; raise BadRequestError on mismatch, expiry, or not found.
        pass

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        # Verify current_password against the stored hash to authorize the change.
        # Hash the new password and save it; then revoke all refresh tokens and clear must_change_password.
        # Raise UnauthorizedError if current_password is wrong.
        pass

    async def forgot_password(self, email: str) -> None:
        # Look up user by email; if not found, return silently to avoid enumeration.
        # Generate OTP with purpose="password_reset" and send via EmailService.send_otp.
        pass

    async def reset_password(self, token: str, new_password: str) -> None:
        # Validate the OTP token, hash the new password, update the user row, and revoke all tokens.
        # Mark the OTP as used and raise BadRequestError if it is expired, used, or invalid.
        pass
