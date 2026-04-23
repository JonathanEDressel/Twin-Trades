from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.AuthDbContext import AuthDbContext
from app.controllers.UserDbContext import UserDbContext
from app.helper.Security import Security
from app.schemas.Auth import LoginPayload, RegisterPayload, RefreshPayload, TokenResponse


class AuthService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.auth_db = AuthDbContext(session)
        self.user_db = UserDbContext(session)

    async def login(self, payload: LoginPayload, ip: str | None, user_agent: str | None) -> TokenResponse:
        # Look up the user by email and verify the password hash via Security.verify_password.
        # If must_change_password is True, return a scoped access token with scope="change_password_only".
        # On success, mint a full token pair, insert refresh token hash, and log the audit record.
        pass

    async def register(self, payload: RegisterPayload) -> TokenResponse:
        # Verify email and username uniqueness; raise ConflictError if either is taken.
        # Hash the password with Security.hash_password and insert the user via UserDbContext.
        # Return a fresh token pair so the client is immediately logged in after registration.
        pass

    async def refresh_tokens(self, payload: RefreshPayload) -> TokenResponse:
        # Validate the refresh token hash against the DB and check it is not expired or revoked.
        # Rotate: revoke the old token and issue a new access+refresh pair atomically.
        # Raise UnauthorizedError if the token is not found, revoked, or past expires_at.
        pass

    async def logout(self, payload: RefreshPayload, user_id: int) -> None:
        # Revoke all refresh tokens for the given user_id regardless of which token was supplied.
        # This is intentionally a full logout — single-device logout is not supported.
        pass

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
