"""
Unit tests for CostCalculator

Tests cost calculation logic for various models and token counts.
"""

import pytest
from app.services.cost_calculator import CostCalculator, MODEL_COSTS


class TestCostCalculator:
    """Test suite for CostCalculator class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.calc = CostCalculator()

    def test_sonnet_cost_calculation(self):
        """Test cost calculation for Claude Sonnet 3.5."""
        # $3/1M input, $15/1M output
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=1000,
            output_tokens=500
        )

        # Expected: (1000 * 3 / 1M) + (500 * 15 / 1M)
        expected = (1000 * 3.0 / 1_000_000) + (500 * 15.0 / 1_000_000)
        expected = 0.0105  # $0.010500

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.0105

    def test_opus_cost_calculation(self):
        """Test cost calculation for Claude Opus 4."""
        # $15/1M input, $75/1M output
        cost = self.calc.calculate(
            model="anthropic/claude-opus-4",
            input_tokens=1000,
            output_tokens=500
        )

        # Expected: (1000 * 15 / 1M) + (500 * 75 / 1M)
        expected = (1000 * 15.0 / 1_000_000) + (500 * 75.0 / 1_000_000)
        expected = 0.0525  # $0.052500

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.0525

    def test_haiku_cost_calculation(self):
        """Test cost calculation for Claude Haiku."""
        # $0.25/1M input, $1.25/1M output
        cost = self.calc.calculate(
            model="anthropic/claude-3-haiku",
            input_tokens=1000,
            output_tokens=500
        )

        # Expected: (1000 * 0.25 / 1M) + (500 * 1.25 / 1M)
        expected = (1000 * 0.25 / 1_000_000) + (500 * 1.25 / 1_000_000)
        expected = 0.000875  # $0.000875

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.000875

    def test_gpt4o_cost_calculation(self):
        """Test cost calculation for GPT-4o."""
        # $2.5/1M input, $10/1M output
        cost = self.calc.calculate(
            model="openai/gpt-4o",
            input_tokens=1000,
            output_tokens=500
        )

        # Expected: (1000 * 2.5 / 1M) + (500 * 10 / 1M)
        expected = (1000 * 2.5 / 1_000_000) + (500 * 10.0 / 1_000_000)
        expected = 0.0075  # $0.007500

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.0075

    def test_unknown_model_returns_zero(self):
        """Test that unknown models return zero cost without error."""
        cost = self.calc.calculate(
            model="unknown/model-12345",
            input_tokens=1000,
            output_tokens=500
        )

        assert cost == 0.0

    def test_zero_tokens_returns_zero(self):
        """Test that zero tokens returns zero cost."""
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=0,
            output_tokens=0
        )

        assert cost == 0.0

    def test_large_token_counts(self):
        """Test cost calculation with large token counts (precision test)."""
        # 100K input + 50K output for Sonnet
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=100_000,
            output_tokens=50_000
        )

        # Expected: (100K * 3 / 1M) + (50K * 15 / 1M)
        expected = (100_000 * 3.0 / 1_000_000) + (50_000 * 15.0 / 1_000_000)
        expected = 1.05  # $1.050000

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 1.05

    def test_cost_precision_six_decimals(self):
        """Test that costs are rounded to 6 decimal places."""
        # Small token count that would have more precision
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=1,
            output_tokens=1
        )

        # Should round to 6 decimals
        expected = (1 * 3.0 / 1_000_000) + (1 * 15.0 / 1_000_000)
        expected = 0.000018  # $0.000018

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.000018

    def test_get_model_pricing(self):
        """Test get_model_pricing helper method."""
        # Known model
        pricing = self.calc.get_model_pricing("anthropic/claude-3.5-sonnet")
        assert pricing is not None
        assert pricing == (3.0, 15.0)

        # Unknown model
        pricing = self.calc.get_model_pricing("unknown/model")
        assert pricing is None

    def test_is_model_supported(self):
        """Test is_model_supported helper method."""
        # Known model
        assert self.calc.is_model_supported("anthropic/claude-3.5-sonnet") is True

        # Unknown model
        assert self.calc.is_model_supported("unknown/model") is False

    def test_list_supported_models(self):
        """Test list_supported_models returns all model identifiers."""
        models = self.calc.list_supported_models()

        # Should have at least 13 models (from MODEL_COSTS)
        assert len(models) >= 13

        # Should include common models
        assert "anthropic/claude-3.5-sonnet" in models
        assert "anthropic/claude-opus-4" in models
        assert "anthropic/claude-3-haiku" in models
        assert "openai/gpt-4o" in models

    def test_custom_model_costs(self):
        """Test CostCalculator with custom model costs."""
        custom_costs = {
            "custom/model": {"input": 10.0, "output": 20.0}
        }

        calc = CostCalculator(model_costs=custom_costs)

        cost = calc.calculate(
            model="custom/model",
            input_tokens=1000,
            output_tokens=500
        )

        expected = (1000 * 10.0 / 1_000_000) + (500 * 20.0 / 1_000_000)
        expected = 0.02  # $0.020000

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.02

    def test_input_only_tokens(self):
        """Test cost calculation with only input tokens."""
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=1000,
            output_tokens=0
        )

        expected = 1000 * 3.0 / 1_000_000
        expected = 0.003  # $0.003000

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.003

    def test_output_only_tokens(self):
        """Test cost calculation with only output tokens."""
        cost = self.calc.calculate(
            model="anthropic/claude-3.5-sonnet",
            input_tokens=0,
            output_tokens=500
        )

        expected = 500 * 15.0 / 1_000_000
        expected = 0.0075  # $0.007500

        assert cost == pytest.approx(expected, abs=1e-6)
        assert cost == 0.0075

    def test_all_models_have_pricing(self):
        """Test that all models in MODEL_COSTS have valid pricing."""
        for model, pricing in MODEL_COSTS.items():
            # Each model should have input and output costs
            assert "input" in pricing, f"Model {model} missing input cost"
            assert "output" in pricing, f"Model {model} missing output cost"

            # Costs should be non-negative
            assert pricing["input"] >= 0, f"Model {model} has negative input cost"
            assert pricing["output"] >= 0, f"Model {model} has negative output cost"

            # Test calculation doesn't error
            cost = self.calc.calculate(
                model=model,
                input_tokens=1000,
                output_tokens=500
            )
            assert cost >= 0, f"Model {model} returned negative cost"
