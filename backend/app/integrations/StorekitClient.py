from pathlib import Path
from appstoreserverlibrary.api_client import AppStoreServerAPIClient
from appstoreserverlibrary.models.Environment import Environment
from app.helper.Config import settings


async def get_app_store_client() -> AppStoreServerAPIClient:
    env = Environment.PRODUCTION if settings.ENV == "production" else Environment.SANDBOX
    key_bytes = Path(settings.APPLE_PRIVATE_KEY_PATH).read_bytes()
    return AppStoreServerAPIClient(
        signing_key=key_bytes,
        key_id=settings.APPLE_KEY_ID,
        issuer_id=settings.APPLE_ISSUER_ID,
        bundle_id=settings.APPLE_BUNDLE_ID,
        environment=env,
    )
