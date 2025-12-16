"""
Tests for Workflow Engine

Tests workflow execution orchestration including:
- Workflow loading from JSON files
- Sequential step execution
- Context management and step outputs
- Error handling modes
- Timeout handling
- Result generation with metadata
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

from app.workflows.engine import (
    WorkflowEngine,
    WorkflowEngineError,
    WorkflowLoadError,
    WorkflowExecutionError,
    WorkflowTimeoutError,
    WorkflowResult,
)
from app.workflows.schema import Workflow, WorkflowStep, StepType, ErrorMode
from app.services import LLMResponse, UsageInfo


@pytest.fixture
def temp_workflows_dir():
    """Create temporary directory for workflow JSON files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        workflows_dir = Path(tmpdir) / "workflows"
        workflows_dir.mkdir()

        prompts_dir = Path(tmpdir) / "prompts"
        prompts_dir.mkdir()

        # Create simple workflow
        simple_workflow = {
            "name": "simple_test",
            "version": "1.0.0",
            "description": "Simple test workflow",
            "steps": [
                {
                    "id": "step1",
                    "type": "llm",
                    "config": {
                        "prompt_text": "Test prompt ${location}",
                        "variables": {
                            "location": "${input.location}"
                        }
                    }
                }
            ],
            "timeout_seconds": 60
        }

        with open(workflows_dir / "simple_test.json", 'w') as f:
            json.dump(simple_workflow, f)

        # Create multi-step workflow
        multi_workflow = {
            "name": "multi_test",
            "version": "1.0.0",
            "steps": [
                {
                    "id": "step1",
                    "type": "llm",
                    "config": {"prompt_text": "Step 1"}
                },
                {
                    "id": "step2",
                    "type": "llm",
                    "config": {
                        "prompt_text": "Step 2: ${result}",
                        "variables": {
                            "result": "${steps.step1.output.content}"
                        }
                    }
                }
            ]
        }

        with open(workflows_dir / "multi_test.json", 'w') as f:
            json.dump(multi_workflow, f)

        # Create invalid JSON workflow
        with open(workflows_dir / "invalid.json", 'w') as f:
            f.write("{invalid json")

        yield workflows_dir, prompts_dir


@pytest.fixture
def engine(temp_workflows_dir):
    """Create WorkflowEngine with temporary directories."""
    workflows_dir, prompts_dir = temp_workflows_dir
    return WorkflowEngine(
        workflows_dir=str(workflows_dir),
        prompts_dir=str(prompts_dir)
    )


def create_mock_llm_response(content: str, tokens: int = 100, cost: float = 0.001):
    """Helper to create mock LLM response."""
    return LLMResponse(
        content=content,
        model="anthropic/claude-3.5-sonnet",
        usage=UsageInfo(
            input_tokens=tokens // 2,
            output_tokens=tokens // 2,
            total_tokens=tokens
        ),
        cost_usd=cost,
        duration_ms=1000,
        provider="mock"
    )


# ============================================================================
# Workflow Loading Tests
# ============================================================================

def test_load_workflow_success(engine):
    """Test successful workflow loading."""
    workflow = engine.load_workflow("simple_test")

    assert workflow.name == "simple_test"
    assert workflow.version == "1.0.0"
    assert len(workflow.steps) == 1
    assert workflow.steps[0].id == "step1"
    assert workflow.timeout_seconds == 60


def test_load_workflow_multi_step(engine):
    """Test loading workflow with multiple steps."""
    workflow = engine.load_workflow("multi_test")

    assert workflow.name == "multi_test"
    assert len(workflow.steps) == 2
    assert workflow.steps[0].id == "step1"
    assert workflow.steps[1].id == "step2"


def test_load_workflow_not_found(engine):
    """Test error when workflow file doesn't exist."""
    with pytest.raises(WorkflowLoadError, match="Workflow file not found"):
        engine.load_workflow("nonexistent")


def test_load_workflow_invalid_json(engine):
    """Test error when workflow JSON is invalid."""
    with pytest.raises(WorkflowLoadError, match="Invalid JSON"):
        engine.load_workflow("invalid")


# ============================================================================
# Single Step Execution Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_single_step_workflow(engine):
    """Test execution of workflow with single LLM step."""
    workflow = engine.load_workflow("simple_test")

    # Mock LLM executor
    mock_response = create_mock_llm_response("Generated content")
    with patch.object(engine.llm_executor, 'execute', new=AsyncMock(return_value=mock_response)):
        result = await engine.execute_workflow(
            workflow=workflow,
            input_data={"location": "Seattle"}
        )

    # Verify result
    assert result.success is True
    assert result.workflow_name == "simple_test"
    assert result.output["content"] == "Generated content"
    assert result.output["model"] == "anthropic/claude-3.5-sonnet"
    assert result.output["tokens"] == 100
    assert result.output["cost_usd"] == 0.001

    # Verify metadata
    assert result.metadata["workflow_version"] == "1.0.0"
    assert result.metadata["total_steps"] == 1
    assert result.metadata["total_tokens"] == 100
    assert result.metadata["total_cost_usd"] == 0.001
    assert "duration_ms" in result.metadata

    # Verify step history
    assert len(result.steps_executed) == 1
    assert result.steps_executed[0]["step_id"] == "step1"
    assert result.steps_executed[0]["step_type"] == "llm"
    assert result.steps_executed[0]["success"] is True
    assert result.steps_executed[0]["tokens"] == 100


# ============================================================================
# Multi-Step Execution Tests
# ============================================================================

@pytest.mark.asyncio
async def test_execute_multi_step_workflow(engine):
    """Test execution of workflow with multiple steps."""
    workflow = engine.load_workflow("multi_test")

    # Mock LLM executor to return different responses
    responses = [
        create_mock_llm_response("Step 1 output", tokens=50, cost=0.0005),
        create_mock_llm_response("Step 2 output", tokens=75, cost=0.00075)
    ]

    with patch.object(engine.llm_executor, 'execute', new=AsyncMock(side_effect=responses)):
        result = await engine.execute_workflow(
            workflow=workflow,
            input_data={}
        )

    # Verify both steps executed
    assert len(result.steps_executed) == 2
    assert result.steps_executed[0]["step_id"] == "step1"
    assert result.steps_executed[1]["step_id"] == "step2"

    # Verify final output is from last step
    assert result.output["content"] == "Step 2 output"

    # Verify total metadata
    assert result.metadata["total_steps"] == 2
    assert result.metadata["total_tokens"] == 125  # 50 + 75
    assert result.metadata["total_cost_usd"] == 0.00125  # 0.0005 + 0.00075


@pytest.mark.asyncio
async def test_step_outputs_available_to_subsequent_steps(engine):
    """Test that step outputs are stored in context for subsequent steps."""
    workflow = engine.load_workflow("multi_test")

    # Track calls to verify context is passed correctly
    call_count = 0

    async def mock_execute(step, context):
        nonlocal call_count
        call_count += 1

        if call_count == 1:
            # First step - context should only have input
            assert "location" not in context.get_all_values()["input"]
            return create_mock_llm_response("Step 1 result")

        elif call_count == 2:
            # Second step - should have access to step1 output
            step1_output = context.get_value("steps.step1.output")
            assert step1_output is not None
            assert step1_output.content == "Step 1 result"
            return create_mock_llm_response("Step 2 result")

    with patch.object(engine.llm_executor, 'execute', new=mock_execute):
        result = await engine.execute_workflow(workflow, input_data={})

    assert call_count == 2
    assert result.success is True


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.asyncio
async def test_error_mode_fail_stops_execution(engine):
    """Test that error_mode=fail stops workflow execution."""
    workflow = engine.load_workflow("multi_test")

    # First step fails
    async def mock_execute(step, context):
        if step.id == "step1":
            raise Exception("Step 1 failed")
        return create_mock_llm_response("Should not reach here")

    with patch.object(engine.llm_executor, 'execute', new=mock_execute):
        result = await engine.execute_workflow(workflow, input_data={})

    # Workflow should fail
    assert result.success is False
    assert len(result.steps_executed) == 0  # No steps completed successfully
    assert "error" in result.metadata


@pytest.mark.asyncio
async def test_error_mode_continue_proceeds(engine, temp_workflows_dir):
    """Test that error_mode=continue allows workflow to proceed."""
    workflows_dir, _ = temp_workflows_dir

    # Create workflow with error_mode=continue
    continue_workflow = {
        "name": "continue_test",
        "version": "1.0.0",
        "steps": [
            {
                "id": "step1",
                "type": "llm",
                "config": {"prompt_text": "Test"},
                "error_mode": "continue"
            },
            {
                "id": "step2",
                "type": "llm",
                "config": {"prompt_text": "Test"}
            }
        ]
    }

    with open(workflows_dir / "continue_test.json", 'w') as f:
        json.dump(continue_workflow, f)

    workflow = engine.load_workflow("continue_test")

    # First step fails, second succeeds
    call_count = 0

    async def mock_execute(step, context):
        nonlocal call_count
        call_count += 1

        if call_count == 1:
            return None  # Step executor returns None for error_mode=continue

        return create_mock_llm_response("Step 2 output")

    with patch.object(engine.llm_executor, 'execute', new=mock_execute):
        result = await engine.execute_workflow(workflow, input_data={})

    # Workflow should succeed
    assert result.success is True
    assert len(result.steps_executed) == 2
    assert result.steps_executed[0]["success"] is False
    assert result.steps_executed[1]["success"] is True


# ============================================================================
# Timeout Tests
# ============================================================================

@pytest.mark.asyncio
async def test_workflow_timeout_raises_error(engine):
    """Test that workflow execution timeout raises error."""
    import asyncio

    workflow = engine.load_workflow("simple_test")

    # Mock executor to take longer than timeout
    async def slow_execute(step, context):
        await asyncio.sleep(2)  # Sleep 2 seconds
        return create_mock_llm_response("Too slow")

    with patch.object(engine.llm_executor, 'execute', new=slow_execute):
        with pytest.raises(WorkflowTimeoutError, match="exceeded timeout"):
            await engine.execute_workflow(
                workflow=workflow,
                input_data={},
                timeout_override=1  # 1 second timeout
            )


@pytest.mark.asyncio
async def test_workflow_timeout_override(engine):
    """Test that timeout_override parameter works."""
    workflow = engine.load_workflow("simple_test")

    # Use short timeout
    mock_response = create_mock_llm_response("Quick response")
    with patch.object(engine.llm_executor, 'execute', new=AsyncMock(return_value=mock_response)):
        result = await engine.execute_workflow(
            workflow=workflow,
            input_data={},
            timeout_override=5  # Override to 5 seconds
        )

    assert result.success is True


# ============================================================================
# Result Generation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_result_to_dict_serialization(engine):
    """Test WorkflowResult.to_dict() serialization."""
    workflow = engine.load_workflow("simple_test")

    mock_response = create_mock_llm_response("Test output")
    with patch.object(engine.llm_executor, 'execute', new=AsyncMock(return_value=mock_response)):
        result = await engine.execute_workflow(workflow, input_data={})

    # Convert to dict
    result_dict = result.to_dict()

    # Verify structure
    assert "workflow_name" in result_dict
    assert "success" in result_dict
    assert "output" in result_dict
    assert "steps_executed" in result_dict
    assert "metadata" in result_dict

    # Verify values
    assert result_dict["workflow_name"] == "simple_test"
    assert result_dict["success"] is True
    assert result_dict["output"]["content"] == "Test output"


@pytest.mark.asyncio
async def test_step_output_serialization_truncates_long_content(engine):
    """Test that long step outputs are truncated in history."""
    workflow = engine.load_workflow("simple_test")

    # Create response with long content
    long_content = "A" * 500  # 500 characters
    mock_response = create_mock_llm_response(long_content)

    with patch.object(engine.llm_executor, 'execute', new=AsyncMock(return_value=mock_response)):
        result = await engine.execute_workflow(workflow, input_data={})

    # Verify step history has truncated content
    step_output = result.steps_executed[0]["output"]
    assert len(step_output["content"]) <= 203  # 200 + "..."
    assert step_output["content"].endswith("...")


# ============================================================================
# Unsupported Step Types Tests
# ============================================================================

@pytest.mark.asyncio
async def test_transform_step_not_implemented(engine, temp_workflows_dir):
    """Test that transform steps raise NotImplementedError."""
    workflows_dir, _ = temp_workflows_dir

    # Create workflow with transform step
    transform_workflow = {
        "name": "transform_test",
        "version": "1.0.0",
        "steps": [
            {
                "id": "transform1",
                "type": "transform",
                "config": {"operation": "extract_fields"}
            }
        ]
    }

    with open(workflows_dir / "transform_test.json", 'w') as f:
        json.dump(transform_workflow, f)

    workflow = engine.load_workflow("transform_test")

    result = await engine.execute_workflow(workflow, input_data={})

    # Should fail with not implemented error
    assert result.success is False
    assert "not implemented" in result.metadata.get("error", "").lower()


@pytest.mark.asyncio
async def test_external_api_step_not_implemented(engine, temp_workflows_dir):
    """Test that external API steps raise NotImplementedError."""
    workflows_dir, _ = temp_workflows_dir

    # Create workflow with external API step
    api_workflow = {
        "name": "api_test",
        "version": "1.0.0",
        "steps": [
            {
                "id": "api1",
                "type": "external_api",
                "config": {"service": "google_places"}
            }
        ]
    }

    with open(workflows_dir / "api_test.json", 'w') as f:
        json.dump(api_workflow, f)

    workflow = engine.load_workflow("api_test")

    result = await engine.execute_workflow(workflow, input_data={})

    # Should fail with not implemented error
    assert result.success is False
    assert "not implemented" in result.metadata.get("error", "").lower()
