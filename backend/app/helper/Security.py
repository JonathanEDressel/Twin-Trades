import bcrypt as _bcrypt_lib
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.helper.Config import settings
import os, hashlib, base64

BCRYPT_ROUNDS = 12
ACCESS_TOKEN_EXPIRE_MINUTES = 60
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
        return str(int.from_bytes(os.urandom(3), "big") % 1_000_000).zfill(6)

    @staticmethod
    def hash_otp(otp: str) -> str:
        return _bcrypt_lib.hashpw(otp.encode(), _bcrypt_lib.gensalt(rounds=BCRYPT_ROUNDS)).decode()

    @staticmethod
    def verify_otp(otp: str, hashed: str) -> bool:
        try:
            return _bcrypt_lib.checkpw(otp.encode(), hashed.encode())
        except Exception:
            return False

    @staticmethod
    def encrypt_brokerage_token(plaintext: str) -> str:
        key = bytes.fromhex(settings.BROKERAGE_ENCRYPTION_KEY)
        nonce = os.urandom(12)
        aesgcm = AESGCM(key)
        ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
        return base64.b64encode(nonce + ct).decode()

    @staticmethod
    def decrypt_brokerage_token(ciphertext: str) -> str:
        key = bytes.fromhex(settings.BROKERAGE_ENCRYPTION_KEY)
        data = base64.b64decode(ciphertext)
        nonce, ct = data[:12], data[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ct, None).decode()
