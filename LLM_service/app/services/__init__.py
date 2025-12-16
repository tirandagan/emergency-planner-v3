"""
LLM Services Package

Provides factory functions for creating LLM provider instances.
Supports multiple providers with configuration-driven selection.
"""

from app.config import settings
from app.services.llm_provider import (
    LLMProvider,
    LLMResponse,
    Message,
    UsageInfo,
    LLMProviderError,
    LLMProviderTimeout,
    LLMProviderAuthError,
    LLMProviderRateLimitError,
)
from app.services.openrouter import OpenRouterProvider
from app.services.cost_calculator import CostCalculator


def get_llm_provider(provider_name: str = "openrouter") -> LLMProvider:
    """
    Factory function to create LLM provider instances.

    Providers are configured via environment variables (see app.config).
    Currently supports:
    - openrouter: OpenRouter API (Claude, GPT, Gemini, etc.)

    Future providers:
    - anthropic: Anthropic API direct
    - openai: OpenAI API direct

    Args:
        provider_name: Provider identifier (default: "openrouter")

    Returns:
        Configured LLMProvider instance

    Raises:
        ValueError: Unknown provider name

    Example:
        ```python
        # Get OpenRouter provider (default)
        provider = get_llm_provider()

        # Or specify explicitly
        provider = get_llm_provider("openrouter")

        # Generate text
        response = await provider.generate(
            messages=[Message(role="user", content="Hello!")],
            model="anthropic/claude-3.5-sonnet"
        )

        # Clean up
        await provider.close()
        ```
    """
    if provider_name == "openrouter":
        return OpenRouterProvider(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )

    # Future providers
    # elif provider_name == "anthropic":
    #     return AnthropicProvider(api_key=settings.ANTHROPIC_API_KEY)
    #
    # elif provider_name == "openai":
    #     return OpenAIProvider(api_key=settings.OPENAI_API_KEY)

    else:
        raise ValueError(
            f"Unknown provider: {provider_name}. "
            f"Supported providers: openrouter"
        )


# Export all public symbols
__all__ = [
    "get_llm_provider",
    "LLMProvider",
    "LLMResponse",
    "Message",
    "UsageInfo",
    "LLMProviderError",
    "LLMProviderTimeout",
    "LLMProviderAuthError",
    "LLMProviderRateLimitError",
    "OpenRouterProvider",
    "CostCalculator",
]
