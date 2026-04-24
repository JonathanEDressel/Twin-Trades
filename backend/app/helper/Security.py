import bcrypt as _bcrypt_lib
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.helper.Config import settings
import os, hashlib, base64

BCRYPT_ROUNDS = 12
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30


class Security:

    @staticmethod
    def hash_password(plaintext: str) -> str:
        return _bcrypt_lib.hashpw(plaintext.encode(), _bcrypt_lib.gensalt(rounds=BCRYPT_ROUNDS)).decode()

    @staticmethod
    def verify_password(plaintext: str, hashed: str) -> bool:
        return _bcrypt_lib.checkpw(plaintext.encode(), hashed.encode())

    @staticmethod
    def sign_jwt(claims: dict, expires_in: timedelta | None = None, secret: str | None = None) -> str:
        if expires_in is None:
            expires_in = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        if secret is None:
            secret = settings.JWT_SECRET
        payload = {**claims, "exp": datetime.now(timezone.utc) + expires_in}
        return jwt.encode(payload, secret, algorithm="HS256")

    @staticmethod
    def verify_jwt(token: str, secret: str | None = None) -> dict:
        from app.helper.ErrorHandler import UnauthorizedError
        if secret is None:
            secret = settings.JWT_SECRET
        try:
            return jwt.decode(token, secret, algorithms=["HS256"])
        except JWTError:
            raise UnauthorizedError("Invalid or expired token")

    @staticmethod
    def hash_refresh_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode()).hexdigest()

    @staticmethod
    def generate_otp() -> str:
        # Generate a cryptographically random 6-digit numeric OTP string.
        # Uses os.urandom for entropy — never use random.randint for OTPs.
        # Returns the raw digits; the caller is responsible for hashing before storage.
        pass

    @staticmethod
    def hash_otp(otp: str) -> str:
        # Hash the OTP string with bcrypt at BCRYPT_ROUNDS for storage in otp_tokens.
        # OTPs are short-lived (10 min) but still hashed to prevent DB-level exposure.
        pass

    @staticmethod
    def verify_otp(otp: str, hashed: str) -> bool:
        # Constant-time bcrypt comparison of the submitted OTP against the stored hash.
        # Returns False (not raises) if the OTP does not match.
        pass

    @staticmethod
    def encrypt_brokerage_token(plaintext: str) -> str:
        # Encrypt the plaintext token string using AES-256-GCM with BROKERAGE_ENCRYPTION_KEY.
        # Prepend the random nonce to the ciphertext and return as a base64 string.
        # The decryption key never leaves the server — tokens are opaque to clients.
        pass

    @staticmethod
    def decrypt_brokerage_token(ciphertext: str) -> str:
        # Decode the base64 string, extract the nonce prefix, and decrypt with AES-256-GCM.
        # Only called inside brokerage adapter methods — never in controllers or services.
        # Raises ValueError if the ciphertext is malformed or the key is wrong.
        pass
