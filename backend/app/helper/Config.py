from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str = "password"
    DB_NAME: str

    # JWT
    JWT_SECRET: str
    JWT_REFRESH_SECRET: str

    # Brokerage encryption
    BROKERAGE_ENCRYPTION_KEY: str

    # Apple / StoreKit
    APPLE_BUNDLE_ID: str = "com.twintrades.app"
    APPLE_ISSUER_ID: str = ""
    APPLE_KEY_ID: str = ""
    APPLE_PRIVATE_KEY_PATH: str = "secrets/apple_private_key.p8"
    APPLE_SHARED_SECRET: str = ""

    # APNs
    APNS_KEY_ID: str = ""
    APNS_TEAM_ID: str = ""
    APNS_PRIVATE_KEY_PATH: str = "secrets/apns_private_key.p8"
    APNS_TOPIC: str = "com.twintrades.app"

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "noreply@twintrades.com"

    # Twilio (SMS 2FA)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # Webull
    WEBULL_APP_KEY: str = ""
    WEBULL_APP_SECRET: str = ""
    WEBULL_REDIRECT_URI: str = ""

    # Alpaca (stub)
    ALPACA_CLIENT_ID: str = ""
    ALPACA_CLIENT_SECRET: str = ""
    ALPACA_REDIRECT_URI: str = ""

    # Schwab (stub)
    SCHWAB_CLIENT_ID: str = ""
    SCHWAB_CLIENT_SECRET: str = ""
    SCHWAB_REDIRECT_URI: str = ""

    # AWS S3
    S3_BUCKET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # App runtime
    ENV: str = "development"
    PORT: int = 8000
    FRONTEND_URL: str = ""


settings = Settings()
