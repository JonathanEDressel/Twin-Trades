from decimal import Decimal
from app.brokerages.Base import IBrokerageAdapter
from app.brokerages.webull.Client import WebullClient
from app.helper.Security import Security


class WebullAdapter(IBrokerageAdapter):
    SLUG = "webull"
    IS_AVAILABLE = True

    def __init__(self):
        self.client = WebullClient()

    def get_auth_url(self, state: str) -> str:
        return self.client.get_auth_url(state)

    async def exchange_code(self, code: str) -> dict:
        return await self.client.exchange_code(code)

    async def refresh_token(self, refresh_token_enc: str) -> dict:
        plaintext = Security.decrypt_brokerage_token(refresh_token_enc)
        return await self.client.refresh_token(plaintext)

    async def revoke_token(self, access_token_enc: str) -> None:
        plaintext = Security.decrypt_brokerage_token(access_token_enc)
        await self.client.revoke_token(plaintext)

    async def place_order(self, access_token_enc: str, ticker: str, action: str, quantity: Decimal) -> dict:
        plaintext = Security.decrypt_brokerage_token(access_token_enc)
        return await self.client.place_order(plaintext, ticker, action, quantity)

    async def get_positions(self, access_token_enc: str) -> list[dict]:
        plaintext = Security.decrypt_brokerage_token(access_token_enc)
        return await self.client.get_positions(plaintext)
