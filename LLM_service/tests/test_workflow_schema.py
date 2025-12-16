"""
Unit tests for workflow schema validation.

Tests Pydantic model validation including:
- Valid workflow structures
- Invalid field values
- Required field enforcement
- Custom validators (unique step IDs, valid identifiers)
"""

import pytest
from pydantic import ValidationError

from app.workflows.schema import (
    ErrorMode,
    StepType,
    WorkflowStep,
    Workflow,
    LLMStepConfig,
    TransformStepConfig,
    ExternalAPIStepConfig,
    parse_step_config,
    validate_workflow_json,
)


# ============================================================================
# WorkflowStep Tests
# ============================================================================

def test_workflow_step_valid():
    """Test valid WorkflowStep creation."""
    step = WorkflowStep(
        id="test_step",
        type=StepType.LLM,
        config={"model": "claude-3.5-sonnet"},
        error_mode=ErrorMode.FAIL
    )

    assert step.id == "test_step"
    assert step.type == StepType.LLM
    assert step.error_mode == ErrorMode.FAIL
    assert step.config == {"model": "claude-3.5-sonnet"}


def test_workflow_step_with_hyphens_and_underscores():
    """Test step ID can contain hyphens and underscores."""
    step = WorkflowStep(
        id="test-step_01",
        type=StepType.LLM,
        config={}
    )

    assert step.id == "test-step_01"


def test_workflow_step_invalid_id_with_spaces():
    """Test step ID cannot contain spaces."""
    with pytest.raises(ValidationError) as exc_info:
        WorkflowStep(
            id="test step",
            type=StepType.LLM,
            config={}
        )

    assert "Step ID" in str(exc_info.value)


def test_workflow_step_invalid_id_with_special_chars():
    """Test step ID cannot contain special characters."""
    with pytest.raises(ValidationError) as exc_info:
        WorkflowStep(
            id="test@step",
            type=StepType.LLM,
            config={}
        )

    assert "Step ID" in str(exc_info.value)


def test_workflow_step_default_error_mode():
    """Test default error mode is FAIL."""
    step = WorkflowStep(
        id="test",
        type=StepType.LLM,
        config={}
    )

    assert step.error_mode == ErrorMode.FAIL


def test_workflow_step_custom_output_var():
    """Test custom output variable name."""
    step = WorkflowStep(
        id="test",
        type=StepType.LLM,
        config={},
        output_var="custom_output"
    )

    assert step.output_var == "custom_output"


# ============================================================================
# Workflow Tests
# ============================================================================

def test_workflow_valid():
    """Test valid Workflow creation."""
    workflow = Workflow(
        name="test_workflow",
        version="1.0.0",
        steps=[
            WorkflowStep(
                id="step1",
                type=StepType.LLM,
                config={}
            )
        ]
    )

    assert workflow.name == "test_workflow"
    assert workflow.version == "1.0.0"
    assert len(workflow.steps) == 1


def test_workflow_duplicate_step_ids():
    """Test workflow validation rejects duplicate step IDs."""
    with pytest.raises(ValidationError) as exc_info:
        Workflow(
            name="test",
            steps=[
                WorkflowStep(id="step1", type=StepType.LLM, config={}),
                WorkflowStep(id="step1", type=StepType.LLM, config={}),
            ]
        )

    assert "Duplicate step IDs" in str(exc_info.value)


def test_workflow_empty_steps():
    """Test workflow must have at least one step."""
    with pytest.raises(ValidationError):
        Workflow(
            name="test",
            steps=[]
        )


def test_workflow_default_version():
    """Test default version is 1.0.0."""
    workflow = Workflow(
        name="test",
        steps=[WorkflowStep(id="step1", type=StepType.LLM, config={})]
    )

    assert workflow.version == "1.0.0"


def test_workflow_default_timeout():
    """Test default timeout is 600 seconds."""
    workflow = Workflow(
        name="test",
        steps=[WorkflowStep(id="step1", type=StepType.LLM, config={})]
    )

    assert workflow.timeout_seconds == 600


def test_workflow_custom_timeout():
    """Test custom timeout value."""
    workflow = Workflow(
        name="test",
        steps=[WorkflowStep(id="step1", type=StepType.LLM, config={})],
        timeout_seconds=300
    )

    assert workflow.timeout_seconds == 300


def test_workflow_timeout_too_high():
    """Test timeout cannot exceed 3600 seconds."""
    with pytest.raises(ValidationError):
        Workflow(
            name="test",
            steps=[WorkflowStep(id="step1", type=StepType.LLM, config={})],
            timeout_seconds=4000
        )


def test_workflow_timeout_too_low():
    """Test timeout must be at least 1 second."""
    with pytest.raises(ValidationError):
        Workflow(
            name="test",
            steps=[WorkflowStep(id="step1", type=StepType.LLM, config={})],
            timeout_seconds=0
        )


# ============================================================================
# LLMStepConfig Tests
# ============================================================================

def test_llm_step_config_valid():
    """Test valid LLMStepConfig creation."""
    config = LLMStepConfig(
        model="anthropic/claude-3.5-sonnet",
        prompt_template="test-prompt.md",
        temperature=0.7,
        max_tokens=4000
    )

    assert config.model == "anthropic/claude-3.5-sonnet"
    assert config.prompt_template == "test-prompt.md"
    assert config.temperature == 0.7
    assert config.max_tokens == 4000


def test_llm_step_config_defaults():
    """Test LLMStepConfig default values."""
    config = LLMStepConfig()

    assert config.model == "anthropic/claude-3.5-sonnet"
    assert config.temperature == 0.7
    assert config.max_tokens == 4000
    assert config.prompt_template is None
    assert config.prompt_text is None


def test_llm_step_config_with_variables():
    """Test LLMStepConfig with variable mappings."""
    config = LLMStepConfig(
        variables={
            "location": "${input.location}",
            "family_size": "${input.family_size}"
        }
    )

    assert config.variables["location"] == "${input.location}"
    assert config.variables["family_size"] == "${input.family_size}"


def test_llm_step_config_temperature_bounds():
    """Test temperature must be between 0.0 and 1.0."""
    # Valid temperatures
    LLMStepConfig(temperature=0.0)
    LLMStepConfig(temperature=0.5)
    LLMStepConfig(temperature=1.0)

    # Invalid temperature (too low)
    with pytest.raises(ValidationError):
        LLMStepConfig(temperature=-0.1)

    # Invalid temperature (too high)
    with pytest.raises(ValidationError):
        LLMStepConfig(temperature=1.1)


def test_llm_step_config_max_tokens_bounds():
    """Test max_tokens must be positive and within limits."""
    # Valid max_tokens
    LLMStepConfig(max_tokens=1)
    LLMStepConfig(max_tokens=16000)

    # Invalid max_tokens (too low)
    with pytest.raises(ValidationError):
        LLMStepConfig(max_tokens=0)

    # Invalid max_tokens (too high)
    with pytest.raises(ValidationError):
        LLMStepConfig(max_tokens=20000)


def test_llm_step_config_inline_prompt():
    """Test LLMStepConfig with inline prompt text."""
    config = LLMStepConfig(
        prompt_text="This is an inline prompt."
    )

    assert config.prompt_text == "This is an inline prompt."
    assert config.prompt_template is None


# ============================================================================
# TransformStepConfig Tests
# ============================================================================

def test_transform_step_config_valid():
    """Test valid TransformStepConfig creation."""
    config = TransformStepConfig(
        operation="extract_fields",
        input_path="${steps.llm.output.content}",
        parameters={"fields": ["name", "phone"]}
    )

    assert config.operation == "extract_fields"
    assert config.input_path == "${steps.llm.output.content}"
    assert config.parameters == {"fields": ["name", "phone"]}


def test_transform_step_config_required_fields():
    """Test TransformStepConfig requires operation and input_path."""
    with pytest.raises(ValidationError):
        TransformStepConfig(input_path="${steps.llm.output}")

    with pytest.raises(ValidationError):
        TransformStepConfig(operation="extract_fields")


# ============================================================================
# ExternalAPIStepConfig Tests
# ============================================================================

def test_external_api_step_config_valid():
    """Test valid ExternalAPIStepConfig creation."""
    config = ExternalAPIStepConfig(
        service="google_places",
        method="nearby_search",
        parameters={"location": "${input.location}"}
    )

    assert config.service == "google_places"
    assert config.method == "nearby_search"
    assert config.parameters == {"location": "${input.location}"}


def test_external_api_step_config_default_cache_ttl():
    """Test default cache TTL is 3600 seconds."""
    config = ExternalAPIStepConfig(
        service="google_places",
        method="nearby_search"
    )

    assert config.cache_ttl == 3600


def test_external_api_step_config_custom_cache_ttl():
    """Test custom cache TTL."""
    config = ExternalAPIStepConfig(
        service="google_places",
        method="nearby_search",
        cache_ttl=7200
    )

    assert config.cache_ttl == 7200


# ============================================================================
# Helper Function Tests
# ============================================================================

def test_parse_step_config_llm():
    """Test parse_step_config with LLM step."""
    step = WorkflowStep(
        id="test",
        type=StepType.LLM,
        config={
            "model": "claude-3.5-sonnet",
            "prompt_template": "test.md"
        }
    )

    config = parse_step_config(step)

    assert isinstance(config, LLMStepConfig)
    assert config.model == "claude-3.5-sonnet"


def test_parse_step_config_transform():
    """Test parse_step_config with Transform step."""
    step = WorkflowStep(
        id="test",
        type=StepType.TRANSFORM,
        config={
            "operation": "extract_fields",
            "input_path": "${steps.llm.output}"
        }
    )

    config = parse_step_config(step)

    assert isinstance(config, TransformStepConfig)
    assert config.operation == "extract_fields"


def test_parse_step_config_external_api():
    """Test parse_step_config with External API step."""
    step = WorkflowStep(
        id="test",
        type=StepType.EXTERNAL_API,
        config={
            "service": "google_places",
            "method": "nearby_search"
        }
    )

    config = parse_step_config(step)

    assert isinstance(config, ExternalAPIStepConfig)
    assert config.service == "google_places"


def test_parse_step_config_invalid_config():
    """Test parse_step_config raises error with invalid config."""
    step = WorkflowStep(
        id="test",
        type=StepType.LLM,
        config={
            "temperature": 2.0  # Invalid temperature
        }
    )

    with pytest.raises(ValidationError):
        parse_step_config(step)


def test_validate_workflow_json_valid():
    """Test validate_workflow_json with valid data."""
    json_data = {
        "name": "test_workflow",
        "version": "1.0.0",
        "steps": [
            {
                "id": "step1",
                "type": "llm",
                "config": {
                    "model": "claude-3.5-sonnet"
                }
            }
        ]
    }

    workflow = validate_workflow_json(json_data)

    assert isinstance(workflow, Workflow)
    assert workflow.name == "test_workflow"
    assert len(workflow.steps) == 1


def test_validate_workflow_json_invalid():
    """Test validate_workflow_json raises error with invalid data."""
    json_data = {
        "name": "test",
        "steps": []  # Invalid: must have at least one step
    }

    with pytest.raises(ValidationError):
        validate_workflow_json(json_data)


def test_validate_workflow_json_missing_required_field():
    """Test validate_workflow_json raises error with missing required field."""
    json_data = {
        "name": "test"
        # Missing 'steps' field
    }

    with pytest.raises(ValidationError):
        validate_workflow_json(json_data)


# ============================================================================
# Error Mode Tests
# ============================================================================

def test_error_mode_enum_values():
    """Test ErrorMode enum has expected values."""
    assert ErrorMode.FAIL == "fail"
    assert ErrorMode.CONTINUE == "continue"
    assert ErrorMode.RETRY == "retry"


def test_step_type_enum_values():
    """Test StepType enum has expected values."""
    assert StepType.LLM == "llm"
    assert StepType.TRANSFORM == "transform"
    assert StepType.EXTERNAL_API == "external_api"
    assert StepType.CONDITIONAL == "conditional"
    assert StepType.PARALLEL == "parallel"
