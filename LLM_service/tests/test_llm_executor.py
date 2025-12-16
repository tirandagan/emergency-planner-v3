"""
Tests for LLM Step Executor

Tests LLM step execution including:
- Configuration validation
- Prompt loading (template and inline)
- Variable substitution
- LLM provider integration
- Error handling modes
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from pathlib import Path
import tempfile
import os

from app.workflows.llm_executor import (
    LLMStepExecutor,
    LLMStepExecutionError,
    LLMStepConfigError,
)
from app.workflows.schema import WorkflowStep, StepType, ErrorMode
from app.workflows.context import WorkflowContext
from app.workflows.prompt_loader import PromptLoader
from app.services import LLMResponse, UsageInfo, Message


class MockLLMProvider:
    """Mock LLM provider for testing."""

    def __init__(self):
        self.generate = AsyncMock()
        self.close = AsyncMock()

    def set_response(self, content: str, tokens: tuple = (100, 50)):
        """Set mock response."""
        self.generate.return_value = LLMResponse(
            content=content,
            model="anthropic/claude-3.5-sonnet",
            usage=UsageInfo(
                input_tokens=tokens[0],
                output_tokens=tokens[1],
                total_tokens=tokens[0] + tokens[1]
            ),
            cost_usd=0.001,
            duration_ms=1000,
            provider="mock"
        )


@pytest.fixture
def temp_prompts_dir():
    """Create temporary directory for prompt templates."""
    with tempfile.TemporaryDirectory() as tmpdir:
        prompts_dir = Path(tmpdir) / "prompts"
        prompts_dir.mkdir()

        # Create test prompt template
        template = prompts_dir / "test-prompt.md"
        template.write_text("Location: ${location}\nFamily: ${family_size}")

        # Create prompt with include
        main_prompt = prompts_dir / "main.md"
        main_prompt.write_text("{{include:test-prompt.md}}\nExtra context")

        yield prompts_dir


@pytest.fixture
def prompt_loader(temp_prompts_dir):
    """Create PromptLoader with temporary directory."""
    return PromptLoader(base_dir=str(temp_prompts_dir))


@pytest.fixture
def mock_provider():
    """Create mock LLM provider."""
    return MockLLMProvider()


@pytest.fixture
def executor(prompt_loader, mock_provider):
    """Create LLMStepExecutor with mocks."""
    return LLMStepExecutor(
        prompt_loader=prompt_loader,
        provider=mock_provider
    )


@pytest.fixture
def context():
    """Create test workflow context."""
    return WorkflowContext({
        "location": "Seattle, WA",
        "family_size": 4
    })


# ============================================================================
# Configuration Validation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_validates_step_type(executor, context):
    """Test executor rejects non-LLM steps."""
    step = WorkflowStep(
        id="wrong_type",
        type=StepType.TRANSFORM,  # Not LLM
        config={"prompt_text": "Hello"}
    )

    with pytest.raises(LLMStepConfigError, match="expected 'llm'"):
        await executor.execute(step, context)


@pytest.mark.asyncio
async def test_execute_requires_prompt_source(executor, context):
    """Test executor requires either template or inline prompt."""
    step = WorkflowStep(
        id="no_prompt",
        type=StepType.LLM,
        config={
            "model": "anthropic/claude-3.5-sonnet"
            # Missing both prompt_template and prompt_text
        }
    )

    with pytest.raises(LLMStepConfigError, match="Must provide either"):
        await executor.execute(step, context)


@pytest.mark.asyncio
async def test_execute_validates_config_fields(executor, context):
    """Test executor validates configuration field types."""
    step = WorkflowStep(
        id="invalid_config",
        type=StepType.LLM,
        config={
            "prompt_text": "Hello",
            "temperature": 2.5  # Invalid: > 1.0
        }
    )

    with pytest.raises(LLMStepConfigError):
        await executor.execute(step, context)


# ============================================================================
# Inline Prompt Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_inline_prompt_success(executor, mock_provider, context):
    """Test successful execution with inline prompt."""
    mock_provider.set_response("Generated response")

    step = WorkflowStep(
        id="inline_test",
        type=StepType.LLM,
        config={
            "prompt_text": "Simple inline prompt",
            "model": "anthropic/claude-3.5-sonnet",
            "temperature": 0.7,
            "max_tokens": 1000
        }
    )

    response = await executor.execute(step, context)

    # Verify response
    assert response.content == "Generated response"
    assert response.model == "anthropic/claude-3.5-sonnet"
    assert response.usage.total_tokens == 150

    # Verify provider called correctly
    mock_provider.generate.assert_called_once()
    call_args = mock_provider.generate.call_args
    assert call_args.kwargs["model"] == "anthropic/claude-3.5-sonnet"
    assert call_args.kwargs["temperature"] == 0.7
    assert call_args.kwargs["max_tokens"] == 1000


@pytest.mark.asyncio
async def test_execute_inline_prompt_with_variables(executor, mock_provider, context):
    """Test inline prompt with variable substitution."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="vars_test",
        type=StepType.LLM,
        config={
            "prompt_text": "Location: ${location}, Family: ${family_size}",
            "variables": {
                "location": "${input.location}",
                "family_size": "${input.family_size}"
            }
        }
    )

    await executor.execute(step, context)

    # Verify substituted prompt
    call_args = mock_provider.generate.call_args
    messages = call_args.kwargs["messages"]
    assert len(messages) == 1
    assert "Seattle, WA" in messages[0].content
    assert "4" in messages[0].content


# ============================================================================
# Template Prompt Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_template_prompt_success(executor, mock_provider, context):
    """Test successful execution with template file."""
    mock_provider.set_response("Template response")

    step = WorkflowStep(
        id="template_test",
        type=StepType.LLM,
        config={
            "prompt_template": "test-prompt.md",
            "variables": {
                "location": "${input.location}",
                "family_size": "${input.family_size}"
            }
        }
    )

    await executor.execute(step, context)

    # Verify template loaded and variables substituted
    call_args = mock_provider.generate.call_args
    messages = call_args.kwargs["messages"]
    assert "Seattle, WA" in messages[0].content
    assert "4" in messages[0].content


@pytest.mark.asyncio
async def test_execute_template_not_found(executor, context):
    """Test error when template file doesn't exist."""
    step = WorkflowStep(
        id="missing_template",
        type=StepType.LLM,
        config={
            "prompt_template": "nonexistent.md"
        }
    )

    with pytest.raises(LLMStepConfigError, match="Error loading prompt template"):
        await executor.execute(step, context)


@pytest.mark.asyncio
async def test_execute_template_with_includes(executor, mock_provider, context):
    """Test template with {{include:...}} directives."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="include_test",
        type=StepType.LLM,
        config={
            "prompt_template": "main.md",
            "variables": {
                "location": "${input.location}",
                "family_size": "${input.family_size}"
            }
        }
    )

    await executor.execute(step, context)

    # Verify includes resolved
    call_args = mock_provider.generate.call_args
    messages = call_args.kwargs["messages"]
    content = messages[0].content

    # Should have content from both files
    assert "Seattle, WA" in content
    assert "Extra context" in content


# ============================================================================
# Variable Resolution Tests
# ============================================================================

@pytest.mark.asyncio
async def test_variable_resolution_from_input(executor, mock_provider, context):
    """Test resolving variables from input namespace."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="input_vars",
        type=StepType.LLM,
        config={
            "prompt_text": "City: ${city}",
            "variables": {
                "city": "${input.location}"
            }
        }
    )

    await executor.execute(step, context)

    call_args = mock_provider.generate.call_args
    assert "Seattle, WA" in call_args.kwargs["messages"][0].content


@pytest.mark.asyncio
async def test_variable_resolution_from_steps(executor, mock_provider, context):
    """Test resolving variables from steps namespace."""
    mock_provider.set_response("Response")

    # Add step output to context
    context.set_step_output("fetch", {"count": 10, "items": ["A", "B"]})

    step = WorkflowStep(
        id="step_vars",
        type=StepType.LLM,
        config={
            "prompt_text": "Count: ${count}, First: ${first}",
            "variables": {
                "count": "${steps.fetch.output.count}",
                "first": "${steps.fetch.output.items[0]}"
            }
        }
    )

    await executor.execute(step, context)

    call_args = mock_provider.generate.call_args
    content = call_args.kwargs["messages"][0].content
    assert "10" in content
    assert "A" in content


@pytest.mark.asyncio
async def test_variable_resolution_literal_values(executor, mock_provider, context):
    """Test literal values (no variable substitution)."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="literal_vars",
        type=StepType.LLM,
        config={
            "prompt_text": "Static: ${static}",
            "variables": {
                "static": "Literal String"  # No ${...} syntax
            }
        }
    )

    await executor.execute(step, context)

    call_args = mock_provider.generate.call_args
    assert "Literal String" in call_args.kwargs["messages"][0].content


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.asyncio
async def test_error_mode_fail_raises_exception(executor, mock_provider, context):
    """Test error_mode=fail raises exception on LLM error."""
    mock_provider.generate.side_effect = Exception("LLM API error")

    step = WorkflowStep(
        id="fail_test",
        type=StepType.LLM,
        config={"prompt_text": "Test"},
        error_mode=ErrorMode.FAIL
    )

    with pytest.raises(LLMStepExecutionError, match="execution failed"):
        await executor.execute(step, context)


@pytest.mark.asyncio
async def test_error_mode_continue_returns_none(executor, mock_provider, context):
    """Test error_mode=continue returns None on error."""
    mock_provider.generate.side_effect = Exception("LLM API error")

    step = WorkflowStep(
        id="continue_test",
        type=StepType.LLM,
        config={"prompt_text": "Test"},
        error_mode=ErrorMode.CONTINUE
    )

    result = await executor.execute(step, context)
    assert result is None  # Continues without raising


@pytest.mark.asyncio
async def test_error_mode_retry_not_implemented(executor, mock_provider, context):
    """Test error_mode=retry raises not implemented error."""
    mock_provider.generate.side_effect = Exception("LLM API error")

    step = WorkflowStep(
        id="retry_test",
        type=StepType.LLM,
        config={"prompt_text": "Test"},
        error_mode=ErrorMode.RETRY
    )

    with pytest.raises(LLMStepExecutionError, match="Retry mode not supported"):
        await executor.execute(step, context)


# ============================================================================
# Provider Lifecycle Tests
# ============================================================================

@pytest.mark.asyncio
async def test_executor_closes_provider_after_call(prompt_loader):
    """Test executor closes provider when not injected."""
    mock_provider = MockLLMProvider()
    mock_provider.set_response("Response")

    # Don't inject provider - executor will create one
    with patch('app.workflows.llm_executor.get_llm_provider', return_value=mock_provider):
        executor = LLMStepExecutor(prompt_loader=prompt_loader)

        step = WorkflowStep(
            id="lifecycle_test",
            type=StepType.LLM,
            config={"prompt_text": "Test"}
        )

        context = WorkflowContext({})
        await executor.execute(step, context)

        # Provider should be closed
        mock_provider.close.assert_called_once()


@pytest.mark.asyncio
async def test_executor_does_not_close_injected_provider(executor, mock_provider, context):
    """Test executor doesn't close injected provider."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="injected_test",
        type=StepType.LLM,
        config={"prompt_text": "Test"}
    )

    await executor.execute(step, context)

    # Injected provider should NOT be closed
    mock_provider.close.assert_not_called()


# ============================================================================
# Configuration Parameter Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_with_custom_parameters(executor, mock_provider, context):
    """Test execution with custom temperature, max_tokens, top_p."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="custom_params",
        type=StepType.LLM,
        config={
            "prompt_text": "Test",
            "model": "anthropic/claude-3-haiku",
            "temperature": 0.3,
            "max_tokens": 2000,
            "top_p": 0.9
        }
    )

    await executor.execute(step, context)

    call_args = mock_provider.generate.call_args
    assert call_args.kwargs["model"] == "anthropic/claude-3-haiku"
    assert call_args.kwargs["temperature"] == 0.3
    assert call_args.kwargs["max_tokens"] == 2000
    assert call_args.kwargs["top_p"] == 0.9


@pytest.mark.asyncio
async def test_execute_with_default_parameters(executor, mock_provider, context):
    """Test execution uses default parameters when not specified."""
    mock_provider.set_response("Response")

    step = WorkflowStep(
        id="default_params",
        type=StepType.LLM,
        config={"prompt_text": "Test"}
    )

    await executor.execute(step, context)

    call_args = mock_provider.generate.call_args
    assert call_args.kwargs["model"] == "anthropic/claude-3.5-sonnet"  # Default
    assert call_args.kwargs["temperature"] == 0.7  # Default
    assert call_args.kwargs["max_tokens"] == 4000  # Default
    assert call_args.kwargs["top_p"] is None  # Default (not set)
