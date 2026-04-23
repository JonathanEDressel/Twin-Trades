from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 10 requests per 15 minutes per IP — login, register, /auth/refresh
auth_limiter = limiter.limit("10/15minutes")

# 5 requests per 10 minutes per IP — 2FA verify and OTP request endpoints
otp_limiter = limiter.limit("5/10minutes")

# 5 requests per hour per IP — forgot-password and reset-password
password_reset_limiter = limiter.limit("5/hour")

# 100 requests per minute per IP — all protected user endpoints
api_limiter = limiter.limit("100/minute")

# 200 requests per minute per IP — all /admin/* endpoints
admin_limiter = limiter.limit("200/minute")

# 10 requests per hour per IP — brokerage OAuth initiation
brokerage_auth_limiter = limiter.limit("10/hour")
