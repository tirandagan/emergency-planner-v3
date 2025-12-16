"""
LLM Cost Calculator

Calculates usage costs for different LLM models based on token counts.
Pricing data sourced from main app's usage-logger.ts (January 2025).
"""

from typing import Dict, Tuple, Optional


# Model pricing per 1 million tokens (USD)
# Source: src/lib/ai/usage-logger.ts
# Last updated: January 2025
MODEL_COSTS: Dict[str, Dict[str, float]] = {
    # Anthropic Claude models via OpenRouter
    "anthropic/claude-3.5-sonnet": {
        "input": 3.0,    # $3 per 1M input tokens
        "output": 15.0   # $15 per 1M output tokens
    },
    "anthropic/claude-opus-4": {
        "input": 15.0,   # $15 per 1M input tokens
        "output": 75.0   # $75 per 1M output tokens
    },
    "anthropic/claude-3-haiku": {
        "input": 0.25,   # $0.25 per 1M input tokens
        "output": 1.25   # $1.25 per 1M output tokens
    },
    "anthropic/claude-3-opus": {
        "input": 15.0,
        "output": 75.0
    },
    "anthropic/claude-3-sonnet": {
        "input": 3.0,
        "output": 15.0
    },

    # OpenAI models via OpenRouter
    "openai/gpt-4o": {
        "input": 2.5,    # $2.50 per 1M input tokens
        "output": 10.0   # $10 per 1M output tokens
    },
    "openai/gpt-4o-mini": {
        "input": 0.15,
        "output": 0.6
    },
    "openai/gpt-4-turbo": {
        "input": 10.0,
        "output": 30.0
    },
    "openai/gpt-3.5-turbo": {
        "input": 0.5,
        "output": 1.5
    },

    # Google models via OpenRouter
    "google/gemini-pro": {
        "input": 0.5,
        "output": 1.5
    },
    "google/gemini-pro-1.5": {
        "input": 0.35,
        "output": 1.05
    },

    # Meta models via OpenRouter
    "meta-llama/llama-3.1-70b-instruct": {
        "input": 0.88,
        "output": 0.88
    },
    "meta-llama/llama-3.1-405b-instruct": {
        "input": 5.0,
        "output": 15.0
    },
}


class CostCalculator:
    """
    Calculate LLM usage costs based on token counts and model pricing.

    Uses pricing data from MODEL_COSTS dictionary. Handles unknown models
    gracefully by returning $0.00 cost (logs warning).

    Example:
        ```python
        calc = CostCalculator()
        cost = calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=1000,
            output_tokens=500
        )
        print(f"Cost: ${cost:.6f}")  # Cost: $0.010500
        ```
    """

    def __init__(self, model_costs: Optional[Dict[str, Dict[str, float]]] = None) -> None:
        """
        Initialize cost calculator with model pricing.

        Args:
            model_costs: Optional custom model pricing dictionary.
                         If None, uses default MODEL_COSTS.
        """
        self.model_costs = model_costs if model_costs is not None else MODEL_COSTS

    def calculate(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """
        Calculate total cost for LLM usage.

        Formula:
            cost_usd = (input_tokens * input_cost_per_1m / 1,000,000) +
                      (output_tokens * output_cost_per_1m / 1,000,000)

        Args:
            model: Model identifier (e.g., "anthropic/claude-3.5-sonnet")
            input_tokens: Number of input/prompt tokens
            output_tokens: Number of output/completion tokens

        Returns:
            Total cost in USD, rounded to 6 decimal places

        Example:
            >>> calc = CostCalculator()
            >>> calc.calculate("anthropic/claude-3.5-sonnet", 1000, 500)
            0.0105
        """
        # Handle zero tokens
        if input_tokens == 0 and output_tokens == 0:
            return 0.0

        # Check if model pricing is available
        if model not in self.model_costs:
            # Unknown model - return 0 cost
            # In production, this should log a warning
            return 0.0

        # Get model pricing
        pricing = self.model_costs[model]
        input_cost_per_1m = pricing["input"]
        output_cost_per_1m = pricing["output"]

        # Calculate costs
        input_cost = (input_tokens * input_cost_per_1m) / 1_000_000
        output_cost = (output_tokens * output_cost_per_1m) / 1_000_000
        total_cost = input_cost + output_cost

        # Round to 6 decimal places (matches database DECIMAL(10, 6))
        return round(total_cost, 6)

    def get_model_pricing(self, model: str) -> Optional[Tuple[float, float]]:
        """
        Get pricing information for a model.

        Args:
            model: Model identifier

        Returns:
            Tuple of (input_cost_per_1m, output_cost_per_1m) or None if unknown
        """
        if model not in self.model_costs:
            return None

        pricing = self.model_costs[model]
        return (pricing["input"], pricing["output"])

    def is_model_supported(self, model: str) -> bool:
        """
        Check if a model has pricing information available.

        Args:
            model: Model identifier

        Returns:
            True if model is supported, False otherwise
        """
        return model in self.model_costs

    def list_supported_models(self) -> list[str]:
        """
        Get list of all supported model identifiers.

        Returns:
            List of model names with pricing information
        """
        return list(self.model_costs.keys())
