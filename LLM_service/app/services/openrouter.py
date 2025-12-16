"""
OpenRouter LLM Provider

Implements OpenRouter API client for Claude, GPT, and other models.
Handles authentication, request/response formatting, and error handling.
"""

import time
import logging
from typing import List, Dict, Any, Optional
import httpx

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
from app.services.cost_calculator import CostCalculator


logger = logging.getLogger(__name__)


class OpenRouterProvider(LLMProvider):
    """
    OpenRouter API client for LLM text generation.

    Supports Claude (Anthropic), GPT (OpenAI), Gemini (Google), and other models
    via OpenRouter's unified API.

    API Documentation: https://openrouter.ai/docs

    Example:
        ```python
        provider = OpenRouterProvider(
            api_key="sk-or-v1-...",
            base_url="https://openrouter.ai/api/v1"
        )

        response = await provider.generate(
            messages=[Message(role="user", content="Hello!")],
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
            max_tokens=4000
        )

        print(f"Response: {response.content}")
        print(f"Cost: ${response.cost_usd:.6f}")

        await provider.close()
        ```
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        timeout: float = 120.0,
        site_url: str = "https://beprepared.ai",
        site_name: str = "BePrepared.ai"
    ) -> None:
        """
        Initialize OpenRouter provider with authentication.

        Args:
            api_key: OpenRouter API key (sk-or-v1-...)
            base_url: OpenRouter API base URL
            timeout: Request timeout in seconds (default: 120s for long generations)
            site_url: Your site URL for OpenRouter analytics
            site_name: Your site name for OpenRouter analytics
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.site_url = site_url
        self.site_name = site_name
        self.cost_calculator = CostCalculator()

        # Create async HTTP client with timeout
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": site_url,
                "X-Title": site_name,
                "Content-Type": "application/json",
            }
        )

    async def generate(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        **kwargs
    ) -> LLMResponse:
        """
        Generate non-streaming text response from OpenRouter.

        Args:
            messages: List of chat messages (system, user, assistant)
            model: Model identifier (e.g., "anthropic/claude-3.5-sonnet")
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenRouter parameters:
                - top_p: Nucleus sampling parameter (0.0-1.0)
                - top_k: Top-k sampling parameter
                - frequency_penalty: Frequency penalty (-2.0 to 2.0)
                - presence_penalty: Presence penalty (-2.0 to 2.0)
                - stop: List of stop sequences

        Returns:
            LLMResponse with content, tokens, cost, and timing

        Raises:
            LLMProviderTimeout: Request timed out
            LLMProviderAuthError: Invalid API key
            LLMProviderRateLimitError: Rate limit exceeded
            LLMProviderError: Other API errors
        """
        start_time = time.time()

        try:
            # Make API request
            response_data = await self._make_request(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )

            # Parse response
            content = self._extract_content(response_data)
            usage = self._extract_usage(response_data)

            # Calculate cost
            cost_usd = self.cost_calculator.calculate(
                model=model,
                input_tokens=usage["input_tokens"],
                output_tokens=usage["output_tokens"]
            )

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Build response
            return LLMResponse(
                content=content,
                model=model,
                usage=UsageInfo(
                    input_tokens=usage["input_tokens"],
                    output_tokens=usage["output_tokens"],
                    total_tokens=usage["total_tokens"]
                ),
                cost_usd=cost_usd,
                duration_ms=duration_ms,
                provider="openrouter",
                metadata={
                    "response_id": response_data.get("id"),
                    "model_used": response_data.get("model")  # Actual model used (may differ from requested)
                }
            )

        except httpx.TimeoutException as e:
            logger.error(f"OpenRouter request timed out: {e}")
            raise LLMProviderTimeout(f"Request timed out after {self.client.timeout.read}s") from e

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error: {e.response.status_code} - {e.response.text}")
            self._handle_http_error(e)

        except Exception as e:
            logger.error(f"OpenRouter unexpected error: {e}")
            raise LLMProviderError(f"Unexpected error: {e}") from e

    async def _make_request(
        self,
        messages: List[Message],
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make HTTP POST request to OpenRouter API.

        Args:
            messages: Chat messages
            model: Model identifier
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters

        Returns:
            Raw API response as dictionary

        Raises:
            httpx.TimeoutException: Request timed out
            httpx.HTTPStatusError: HTTP error (4xx, 5xx)
        """
        # Build request payload
        payload = {
            "model": model,
            "messages": [msg.model_dump() for msg in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Add optional parameters
        if "top_p" in kwargs:
            payload["top_p"] = kwargs["top_p"]
        if "top_k" in kwargs:
            payload["top_k"] = kwargs["top_k"]
        if "frequency_penalty" in kwargs:
            payload["frequency_penalty"] = kwargs["frequency_penalty"]
        if "presence_penalty" in kwargs:
            payload["presence_penalty"] = kwargs["presence_penalty"]
        if "stop" in kwargs:
            payload["stop"] = kwargs["stop"]

        # Make request
        url = f"{self.base_url}/chat/completions"
        logger.info(f"OpenRouter request: {model} with {len(messages)} messages")

        response = await self.client.post(url, json=payload)
        response.raise_for_status()

        return response.json()

    def _extract_content(self, response_data: Dict[str, Any]) -> str:
        """
        Extract generated content from API response.

        Args:
            response_data: Raw API response

        Returns:
            Generated text content

        Raises:
            LLMProviderError: Invalid response format
        """
        try:
            choices = response_data["choices"]
            if not choices:
                raise LLMProviderError("No choices in response")

            message = choices[0]["message"]
            content = message["content"]

            if not content:
                raise LLMProviderError("Empty content in response")

            return content

        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"Failed to extract content from response: {e}")
            raise LLMProviderError(f"Invalid response format: {e}") from e

    def _extract_usage(self, response_data: Dict[str, Any]) -> Dict[str, int]:
        """
        Extract token usage from API response.

        Args:
            response_data: Raw API response

        Returns:
            Dictionary with input_tokens, output_tokens, total_tokens

        Raises:
            LLMProviderError: Invalid response format
        """
        try:
            usage = response_data["usage"]

            return {
                "input_tokens": usage["prompt_tokens"],
                "output_tokens": usage["completion_tokens"],
                "total_tokens": usage.get("total_tokens", usage["prompt_tokens"] + usage["completion_tokens"])
            }

        except (KeyError, TypeError) as e:
            logger.error(f"Failed to extract usage from response: {e}")
            raise LLMProviderError(f"Invalid response format: {e}") from e

    def _handle_http_error(self, error: httpx.HTTPStatusError) -> None:
        """
        Handle HTTP errors and raise appropriate exceptions.

        Args:
            error: HTTP status error from httpx

        Raises:
            LLMProviderAuthError: 401 Unauthorized
            LLMProviderRateLimitError: 429 Too Many Requests
            LLMProviderError: Other HTTP errors
        """
        status_code = error.response.status_code

        if status_code == 401:
            raise LLMProviderAuthError("Invalid API key") from error

        elif status_code == 429:
            raise LLMProviderRateLimitError("Rate limit exceeded") from error

        elif status_code == 400:
            # Try to extract error message from response
            try:
                error_data = error.response.json()
                error_message = error_data.get("error", {}).get("message", "Bad request")
            except Exception:
                error_message = "Bad request"

            raise LLMProviderError(f"Bad request: {error_message}") from error

        elif status_code >= 500:
            raise LLMProviderError(f"OpenRouter server error: {status_code}") from error

        else:
            raise LLMProviderError(f"HTTP error {status_code}") from error

    async def close(self) -> None:
        """
        Close HTTP client and clean up resources.

        Should be called when provider is no longer needed.
        """
        await self.client.aclose()
        logger.info("OpenRouter provider closed")
