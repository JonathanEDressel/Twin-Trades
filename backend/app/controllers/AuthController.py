from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user, get_current_user_any_scope
from app.middleware.RateLimiters import auth_limiter
from app.services.AuthService import AuthService
from app.schemas.Auth import (
    LoginPayload, RegisterPayload, OtpPayload, RequestOtpPayload,
    ChangePasswordPayload, ForgotPasswordPayload,
    ResetPasswordPayload, RefreshPayload, TokenResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
@auth_limiter
async def login(request: Request, body: LoginPayload, session: AsyncSession = Depends(get_session)):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await AuthService(session).login(body, ip, user_agent)


@router.post("/register")
@auth_limiter
async def register(request: Request, body: RegisterPayload, session: AsyncSession = Depends(get_session)):
    return await AuthService(session).register(body)


@router.post("/refresh", response_model=TokenResponse)
@auth_limiter
async def refresh(request: Request, body: RefreshPayload, session: AsyncSession = Depends(get_session)):
    return await AuthService(session).refresh_tokens(body)


@router.post("/logout")
async def logout(body: RefreshPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await AuthService(session).logout(body, current_user.id)
    return {"message": "Logged out successfully"}


@router.post("/request-otp")
async def request_otp(body: RequestOtpPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await AuthService(session).request_otp(current_user.id, body.purpose)
    return {"message": "Code sent"}


@router.post("/verify-otp")
async def verify_otp(body: OtpPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await AuthService(session).verify_otp(current_user.id, body.otp, body.purpose)
    return {"message": "Verified"}


@router.post("/change-password", response_model=TokenResponse)
async def change_password(body: ChangePasswordPayload, current_user=Depends(get_current_user_any_scope), session: AsyncSession = Depends(get_session)):
    return await AuthService(session).change_password(body, current_user)


@router.post("/forgot-password")
async def forgot_password(request: Request, body: ForgotPasswordPayload, session: AsyncSession = Depends(get_session)):
    await AuthService(session).forgot_password(body.email)
    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordPayload, session: AsyncSession = Depends(get_session)):
    await AuthService(session).reset_password(body.email, body.token, body.new_password)
    return {"message": "Password reset successfully"}
