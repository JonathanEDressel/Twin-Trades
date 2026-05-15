import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.AuthDbContext import AuthDbContext
from app.controllers.UserDbContext import UserDbContext
from app.helper.Security import Security, REFRESH_TOKEN_EXPIRE_DAYS
from app.helper.ErrorHandler import UnauthorizedError, ConflictError, BadRequestError
from app.integrations.Mailer import send_email
from app.schemas.Auth import LoginPayload, RegisterPayload, RefreshPayload, TokenResponse, ChangePasswordPayload


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
        token_hash = Security.hash_refresh_token(payload.refresh_token)
        token = await self.auth_db.find_refresh_token(token_hash)
        if token is None:
            raise UnauthorizedError("Invalid or expired refresh token")
        if token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token expired")

        user = await self.user_db.find_by_id(token.user_id)
        if user is None:
            raise UnauthorizedError("User not found")

        await self.auth_db.revoke_all_refresh_tokens(user.id)

        claims = {"sub": str(user.id), "role": user.role.value}
        access_token = Security.sign_jwt(claims)
        raw_refresh = secrets.token_urlsafe(32)
        new_hash = Security.hash_refresh_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.auth_db.insert_refresh_token(user.id, new_hash, expires_at)
        await self.session.commit()
        return TokenResponse(access_token=access_token, refresh_token=raw_refresh)

    async def change_password(self, payload: ChangePasswordPayload, user) -> TokenResponse:
        if not Security.verify_password(payload.current_password, user.password_hash):
            raise BadRequestError("Current password is incorrect")
        new_hash = Security.hash_password(payload.new_password)
        await self.user_db.update_by_id(user.id, password_hash=new_hash, must_change_password=False)
        await self.auth_db.revoke_all_refresh_tokens(user.id)

        claims = {"sub": str(user.id), "role": user.role.value}
        access_token = Security.sign_jwt(claims)
        raw_refresh = secrets.token_urlsafe(32)
        token_hash = Security.hash_refresh_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.auth_db.insert_refresh_token(user.id, token_hash, expires_at)
        await self.session.commit()

        return TokenResponse(access_token=access_token, refresh_token=raw_refresh)

    async def logout(self, payload: RefreshPayload, user_id: int) -> None:
        await self.auth_db.revoke_all_refresh_tokens(user_id)
        await self.session.commit()

    async def request_otp(self, user_id: int, purpose: str) -> None:
        user = await self.user_db.find_by_id(user_id)
        if user is None:
            raise UnauthorizedError("User not found")

        await self.auth_db.invalidate_otps(user_id, purpose)

        raw_otp = Security.generate_otp()
        otp_hash = Security.hash_otp(raw_otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        await self.auth_db.insert_otp_token(user_id, otp_hash, purpose, expires_at)

        html = (
            f"<p>Your verification code is: <strong>{raw_otp}</strong></p>"
            f"<p>This code expires in 10 minutes. Do not share it with anyone.</p>"
        )
        await send_email(user.email, "Your verification code", html)
        await self.session.commit()

    async def verify_otp(self, user_id: int, otp: str, purpose: str) -> bool:
        row = await self.auth_db.find_otp_token(user_id, purpose)
        if row is None or not Security.verify_otp(otp, row.otp_hash):
            raise BadRequestError("Invalid or expired code")
        await self.auth_db.mark_otp_used(row.id)
        await self.session.commit()
        return True

    # async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        # Verify current_password against the stored hash to authorize the change.
        # Hash the new password and save it; then revoke all refresh tokens and clear must_change_password.
        # Raise UnauthorizedError if current_password is wrong.
        # pass

    async def forgot_password(self, email: str) -> None:
        user = await self.user_db.find_by_email(email)
        if user is None:
            return

        await self.auth_db.invalidate_otps(user.id, "password_reset")

        raw_otp = Security.generate_otp()
        otp_hash = Security.hash_otp(raw_otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        await self.auth_db.insert_otp_token(user.id, otp_hash, "password_reset", expires_at)

        html = (
            f"<p>Your password reset code is: <strong>{raw_otp}</strong></p>"
            f"<p>This code expires in 10 minutes. If you did not request a reset, ignore this email.</p>"
        )
        await send_email(user.email, "Reset your password", html)
        await self.session.commit()

    async def reset_password(self, email: str, token: str, new_password: str) -> None:
        _INVALID = "Invalid or expired reset code"
        user = await self.user_db.find_by_email(email)
        if user is None:
            raise BadRequestError(_INVALID)

        row = await self.auth_db.find_otp_token(user.id, "password_reset")
        if row is None or not Security.verify_otp(token, row.otp_hash):
            raise BadRequestError(_INVALID)

        await self.auth_db.mark_otp_used(row.id)
        new_hash = Security.hash_password(new_password)
        await self.user_db.update_by_id(user.id, password_hash=new_hash, must_change_password=False)
        await self.auth_db.revoke_all_refresh_tokens(user.id)
        await self.session.commit()
