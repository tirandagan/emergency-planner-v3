"""
Workflow Schema Definitions

Pydantic models for workflow JSON validation with support for:
- LLM steps (Phase 3)
- Transform steps (Phase 4 - placeholder)
- External API steps (Phase 5 - placeholder)
- Error handling modes (fail, continue, retry)
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator


class WorkflowInput(BaseModel):
    """
    Input parameter definition for workflow.

    Inputs are values that must be provided when executing the workflow.
    They can be referenced in step configs using ${input.name} syntax.
    """

    name: str = Field(
        ...,
        description="Input parameter name (alphanumeric, hyphens, underscores only)",
        min_length=1,
        max_length=50
    )

    type: str = Field(
        default="string",
        description="Input data type (string, number, boolean, object, array)"
    )

    description: Optional[str] = Field(
        default=None,
        description="Human-readable description of what this input represents"
    )

    required: bool = Field(
        default=True,
        description="Whether this input must be provided"
    )

    default: Optional[Any] = Field(
        default=None,
        description="Default value if input is not provided (only for optional inputs)"
    )

    @field_validator('name')
    @classmethod
    def validate_input_name(cls, v: str) -> str:
        """Ensure input name is a valid identifier."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError(
                f"Input name '{v}' must be alphanumeric (hyphens/underscores allowed)"
            )
        return v

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "lat",
                    "type": "string",
                    "description": "Latitude coordinate of user location",
                    "required": True
                },
                {
                    "name": "api_key",
                    "type": "string",
                    "description": "API key for external service",
                    "required": False,
                    "default": "default_key"
                }
            ]
        }


class ErrorMode(str, Enum):
    """Error handling strategy for workflow steps."""
    FAIL = "fail"         # Stop workflow immediately, mark as failed
    CONTINUE = "continue" # Log error, continue to next step
    RETRY = "retry"       # Retry with exponential backoff (Phase 3: not implemented)


class StepType(str, Enum):
    """Supported workflow step types."""
    LLM = "llm"                    # LLM text generation (Phase 3)
    TRANSFORM = "transform"        # Data transformation (Phase 4)
    EXTERNAL_API = "external_api"  # External API call (Phase 5)
    CONDITIONAL = "conditional"    # Conditional branching (Future)
    PARALLEL = "parallel"          # Parallel execution (Future)


class WorkflowStep(BaseModel):
    """
    Single step in workflow execution.

    Each step has:
    - Unique ID for referencing outputs (${steps.stepId.output})
    - Type determining which executor handles it
    - Config with step-specific parameters
    - Error handling mode
    """

    id: str = Field(
        ...,
        description="Unique step identifier (alphanumeric, hyphens, underscores only)",
        min_length=1,
        max_length=50
    )

    type: StepType = Field(
        ...,
        description="Step type determines which executor processes it"
    )

    display_name: Optional[str] = Field(
        default=None,
        description="Human-readable name for display in UI"
    )

    description: Optional[str] = Field(
        default=None,
        description="Human-readable description of step purpose"
    )

    config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Step-specific configuration (validated by executor)"
    )

    outputs: Optional[List[str]] = Field(
        default=None,
        description="List of output variable names to map result to"
    )

    output_var: Optional[str] = Field(
        default=None,
        description="Custom output variable name (default: steps.{id}.output)"
    )

    error_mode: ErrorMode = Field(
        default=ErrorMode.FAIL,
        description="Error handling strategy for this step"
    )

    retry_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Retry configuration (max_retries, backoff_multiplier) - Phase 3: not used"
    )

    @field_validator('id')
    @classmethod
    def validate_step_id(cls, v: str) -> str:
        """Ensure step ID is a valid identifier."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError(
                f"Step ID '{v}' must be alphanumeric (hyphens/underscores allowed)"
            )
        return v

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "id": "generate_analysis",
                    "type": "llm",
                    "config": {
                        "model": "anthropic/claude-3.5-sonnet",
                        "prompt_template": "emergency-contacts/system-prompt.md",
                        "temperature": 0.7,
                        "max_tokens": 4000
                    },
                    "error_mode": "fail"
                }
            ]
        }


class Workflow(BaseModel):
    """
    Complete workflow definition with ordered steps.

    Workflows are loaded from JSON files in workflows/definitions/
    and validated at load time.
    """

    name: str = Field(
        ...,
        description="Workflow name (e.g., 'emergency_contacts')",
        min_length=1,
        max_length=100
    )

    version: str = Field(
        default="1.0.0",
        description="Workflow version (semantic versioning)"
    )

    description: Optional[str] = Field(
        default=None,
        description="Human-readable workflow description"
    )

    inputs: Optional[List[WorkflowInput]] = Field(
        default=None,
        description="Input parameters required/accepted by this workflow"
    )

    steps: List[WorkflowStep] = Field(
        ...,
        description="Ordered list of workflow steps (executed sequentially)",
        min_length=1
    )

    default_error_mode: ErrorMode = Field(
        default=ErrorMode.FAIL,
        description="Default error mode for steps without explicit setting"
    )

    timeout_seconds: int = Field(
        default=600,
        description="Maximum workflow execution time in seconds (default: 10 minutes)",
        ge=1,
        le=3600
    )

    @field_validator('steps')
    @classmethod
    def validate_step_ids_unique(cls, v: List[WorkflowStep]) -> List[WorkflowStep]:
        """Ensure all step IDs are unique within workflow."""
        step_ids = [step.id for step in v]
        duplicates = [sid for sid in step_ids if step_ids.count(sid) > 1]

        if duplicates:
            raise ValueError(
                f"Duplicate step IDs found: {', '.join(set(duplicates))}"
            )

        return v

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "emergency_contacts",
                    "version": "1.0.0",
                    "description": "Generate emergency contact recommendations",
                    "steps": [
                        {
                            "id": "generate_analysis",
                            "type": "llm",
                            "config": {
                                "model": "anthropic/claude-3.5-sonnet",
                                "prompt_template": "emergency-contacts/system-prompt.md"
                            }
                        }
                    ],
                    "timeout_seconds": 300
                }
            ]
        }


# ============================================================================
# Step-Specific Configuration Models
# ============================================================================

class LLMStepConfig(BaseModel):
    """
    Configuration for LLM step execution.

    Supports both template-based prompts (from .md files) and inline prompts.
    Variables can reference workflow context using ${...} syntax.
    """

    model: str = Field(
        default="anthropic/claude-3.5-sonnet",
        description="Model identifier (provider-specific format)"
    )

    prompt_template: Optional[str] = Field(
        default=None,
        description="Path to prompt markdown file (relative to workflows/prompts/)"
    )

    prompt_text: Optional[str] = Field(
        default=None,
        description="Inline prompt text (alternative to template file)"
    )

    temperature: float = Field(
        default=0.7,
        description="Sampling temperature for generation (0.0-1.0)",
        ge=0.0,
        le=1.0
    )

    max_tokens: int = Field(
        default=4000,
        description="Maximum tokens to generate",
        ge=1,
        le=16000
    )

    timeout: Optional[float] = Field(
        default=None,
        description="Override request timeout in seconds"
    )

    top_p: Optional[float] = Field(
        default=None,
        description="Nucleus sampling parameter (0.0-1.0)",
        ge=0.0,
        le=1.0
    )

    variables: Optional[Dict[str, str]] = Field(
        default=None,
        description="Variable substitutions for prompt (supports ${context.var} syntax)"
    )

    @field_validator('prompt_template', 'prompt_text')
    @classmethod
    def validate_prompt_source(cls, v, info) -> Optional[str]:
        """Ensure at least one prompt source is provided."""
        # This validator runs per field, so we can't check both at once
        # The actual validation happens in the executor
        return v

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "model": "anthropic/claude-3.5-sonnet",
                    "prompt_template": "emergency-contacts/system-prompt.md",
                    "temperature": 0.7,
                    "max_tokens": 4000,
                    "variables": {
                        "location": "${input.location}",
                        "family_size": "${input.family_size}",
                        "scenarios": "${input.scenarios}"
                    }
                }
            ]
        }


class TransformStepConfig(BaseModel):
    """
    Configuration for data transformation step (Phase 4).

    Transforms process data between steps using predefined operations
    like extract_fields, filter, map, markdown_to_json, etc.
    """

    operation: str = Field(
        ...,
        description="Transformation operation name (extract_fields, filter, map, etc.)"
    )

    input: Optional[str] = Field(
        default=None,
        description="Input data path (e.g., '${steps.llm.output.content}', omit to use entire context)"
    )

    config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Operation-specific configuration parameters"
    )

    error_mode: Optional[ErrorMode] = Field(
        default=None,
        description="Error handling mode (overrides workflow default)"
    )

    default_value: Any = Field(
        default=None,
        description="Default value to return if transformation fails (used with error_mode='default')"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "operation": "markdown_to_json",
                    "input": "${steps.generate_analysis.output.content}",
                    "config": {
                        "schema": "emergency_contacts"
                    },
                    "error_mode": "fail"
                },
                {
                    "operation": "extract_fields",
                    "input": "${steps.fetch_data.output}",
                    "config": {
                        "paths": {
                            "name": "user.name",
                            "email": "user.email"
                        }
                    }
                }
            ]
        }


class ExternalAPIStepConfig(BaseModel):
    """
    Configuration for external API call step (Phase 5).

    Calls external services like Google Places with authentication,
    caching, and rate limiting.
    """

    service: str = Field(
        ...,
        description="Service identifier (e.g., 'google_places')"
    )

    method: str = Field(
        ...,
        description="API method to call (service-specific)"
    )

    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="API call parameters (supports ${...} variable substitution)"
    )

    cache_ttl: Optional[int] = Field(
        default=3600,
        description="Cache TTL in seconds (default: 1 hour)",
        ge=0
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "service": "google_places",
                    "method": "nearby_search",
                    "parameters": {
                        "location": "${input.location.coordinates}",
                        "radius": 5000,
                        "types": ["hospital", "police", "fire_station"]
                    },
                    "cache_ttl": 3600
                }
            ]
        }


# ============================================================================
# Helper Functions
# ============================================================================

def parse_step_config(step: WorkflowStep) -> BaseModel:
    """
    Parse step config dict into appropriate Pydantic model.

    Args:
        step: WorkflowStep with config dict

    Returns:
        Validated config model (LLMStepConfig, TransformStepConfig, etc.)

    Raises:
        ValueError: If config is invalid for step type
    """
    if step.type == StepType.LLM:
        return LLMStepConfig(**step.config)
    elif step.type == StepType.TRANSFORM:
        return TransformStepConfig(**step.config)
    elif step.type == StepType.EXTERNAL_API:
        return ExternalAPIStepConfig(**step.config)
    else:
        raise ValueError(f"Unknown step type: {step.type}")


def validate_workflow_json(json_data: Dict[str, Any]) -> Workflow:
    """
    Validate workflow JSON data and return Workflow model.

    Args:
        json_data: Raw workflow JSON data

    Returns:
        Validated Workflow model

    Raises:
        ValidationError: If JSON is invalid
    """
    return Workflow(**json_data)
