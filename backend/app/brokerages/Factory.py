from app.brokerages.Base import IBrokerageAdapter
from app.helper.ErrorHandler import BadRequestError

_registry: dict[str, IBrokerageAdapter] = {}


class BrokerageFactory:

    @staticmethod
    def register(adapter: IBrokerageAdapter) -> None:
        if adapter.SLUG in _registry:
            raise ValueError(f"Adapter '{adapter.SLUG}' is already registered")
        _registry[adapter.SLUG] = adapter

    @staticmethod
    def get(slug: str) -> IBrokerageAdapter:
        if slug not in _registry:
            raise BadRequestError(f"Unknown brokerage: {slug}")
        return _registry[slug]

    @staticmethod
    def list_available() -> list[str]:
        return sorted(slug for slug, adapter in _registry.items() if adapter.IS_AVAILABLE)
