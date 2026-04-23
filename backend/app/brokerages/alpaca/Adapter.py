from decimal import Decimal
from app.brokerages.Base import IBrokerageAdapter


class AlpacaAdapter(IBrokerageAdapter):
    SLUG = "alpaca"
    IS_AVAILABLE = False

    def get_auth_url(self, state: str) -> str:
        raise NotImplementedError("Alpaca integration is coming soon.")

    async def exchange_code(self, code: str) -> dict:
        raise NotImplementedError("Alpaca integration is coming soon.")

    async def refresh_token(self, refresh_token_enc: str) -> dict:
        raise NotImplementedError("Alpaca integration is coming soon.")

    async def revoke_token(self, access_token_enc: str) -> None:
        raise NotImplementedError("Alpaca integration is coming soon.")

    async def place_order(self, access_token_enc: str, ticker: str, action: str, quantity: Decimal) -> dict:
        raise NotImplementedError("Alpaca integration is coming soon.")

    async def get_positions(self, access_token_enc: str) -> list[dict]:
        raise NotImplementedError("Alpaca integration is coming soon.")
