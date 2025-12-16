"""
Workflow Engine Package

Provides JSON-based workflow orchestration with:
- Schema validation (Pydantic models)
- Context management (variable storage and retrieval)
- Prompt template loading (with {{include:}} support)
- Step executors (LLM, Transform, External API)
- Workflow engine (orchestration and error handling)
"""

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

__all__ = [
    "ErrorMode",
    "StepType",
    "WorkflowStep",
    "Workflow",
    "LLMStepConfig",
    "TransformStepConfig",
    "ExternalAPIStepConfig",
    "parse_step_config",
    "validate_workflow_json",
]
