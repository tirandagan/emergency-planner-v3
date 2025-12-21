"""
LLM Provider Abstract Base Class

Defines the interface for all LLM providers (OpenRouter, Anthropic, OpenAI).
Provides standardized request/response models and cost tracking.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field


class Message(BaseModel):
    """
    Chat message with role and content.

    Matches OpenRouter API message format.
    """
    role: str = Field(..., description="Message role: 'system', 'user', or 'assistant'")
    content: str = Field(..., description="Message content text")

    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "Hello, how are you?"
            }
        }


class UsageInfo(BaseModel):
    """
    Token usage information from LLM response.

    Tracks input, output, and total token counts for cost calculation.
    """
    input_tokens: int = Field(..., description="Number of input/prompt tokens")
    output_tokens: int = Field(..., description="Number of output/completion tokens")
    total_tokens: int = Field(..., description="Total tokens (input + output)")

    class Config:
        json_schema_extra = {
            "example": {
                "input_tokens": 1234,
                "output_tokens": 567,
                "total_tokens": 1801
            }
        }


class LLMResponse(BaseModel):
    """
    Standardized LLM response with content, tokens, cost, and timing.

    Used by all providers to return consistent response format.
    """
    content: str = Field(..., description="Generated text content")
    model: str = Field(..., description="Model identifier (e.g., 'anthropic/claude-3.5-sonnet')")
    usage: UsageInfo = Field(..., description="Token usage information")
    cost_usd: float = Field(..., description="Total cost in USD (6 decimal precision)")
    duration_ms: int = Field(..., description="Request duration in milliseconds")
    provider: str = Field(..., description="Provider name (e.g., 'openrouter')")
    metadata: Optional[dict] = Field(default=None, description="Additional provider-specific metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Hello! How can I assist you today?",
                "model": "anthropic/claude-3.5-sonnet",
                "usage": {
                    "input_tokens": 23,
                    "output_tokens": 12,
                    "total_tokens": 35
                },
                "cost_usd": 0.000249,
                "duration_ms": 1250,
                "provider": "openrouter",
                "metadata": None
            }
        }


class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""
    pass


class LLMProviderTimeout(LLMProviderError):
    """Exception raised when LLM provider request times out."""
    pass


class LLMProviderAuthError(LLMProviderError):
    """Exception raised for authentication errors."""
    pass


class LLMProviderRateLimitError(LLMProviderError):
    """Exception raised when rate limit is exceeded."""
    pass


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.

    All LLM providers (OpenRouter, Anthropic, OpenAI) must implement this interface.
    Provides consistent API for generating text with cost tracking.

    Example:
        ```python
        provider = OpenRouterProvider(api_key="...", base_url="...")
        response = await provider.generate(
            messages=[Message(role="user", content="Hello!")],
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
            max_tokens=4000
        )
        print(f"Response: {response.content}")
        print(f"Cost: ${response.cost_usd:.6f}")
        ```
    """

    @abstractmethod
    async def generate(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        **kwargs
    ) -> LLMResponse:
        """
        Generate non-streaming text response from LLM (Async).
        """
        pass

    @abstractmethod
    def generate_sync(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        **kwargs
    ) -> LLMResponse:
        """
        Generate non-streaming text response from LLM (Sync).
        Useful for environments like eventlet where async loops cause issues.
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """
        Close any open connections (HTTP clients, etc.).

        Should be called when provider is no longer needed.
        """
        pass
