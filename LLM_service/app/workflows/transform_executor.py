"""
Transform Step Executor

Executes transformation steps in workflows, applying data transformations
to workflow data using the transformation library.
"""

from typing import Any, Dict, Optional
from .transformations import execute_transformation, ErrorMode
from .context import WorkflowContext
from .schema import TransformStepConfig, ErrorMode as SchemaErrorMode


async def execute_transform_step(
    step_id: str,
    config: TransformStepConfig,
    context: WorkflowContext
) -> Dict[str, Any]:
    """
    Execute a transform step

    Args:
        step_id: Step identifier
        config: Transform step configuration
        context: Workflow context for variable resolution

    Returns:
        Dictionary with:
        - output: Transformation result
        - metadata: Execution metadata (duration, operation, etc.)

    Raises:
        Exception: If transformation fails and error_mode is FAIL
    """
    import time

    start_time = time.time()

    try:
        # Get operation and configuration
        operation = config.operation
        transform_config = config.config or {}
        error_mode_str = config.error_mode or SchemaErrorMode.FAIL

        # Map schema error mode to transformation error mode
        error_mode_map = {
            SchemaErrorMode.FAIL: ErrorMode.FAIL,
            SchemaErrorMode.CONTINUE: ErrorMode.CONTINUE,
            SchemaErrorMode.RETRY: ErrorMode.FAIL,  # Retry not implemented yet
        }
        error_mode = error_mode_map.get(error_mode_str, ErrorMode.FAIL)
        default_value = config.default_value

        # Resolve input data from context
        if config.input:
            # Input is a context variable reference
            # Remove ${} if present
            input_path = config.input
            if input_path.startswith("${") and input_path.endswith("}"):
                input_path = input_path[2:-1]
            input_data = context.get_value(input_path)
        else:
            # Use entire context as input
            input_data = context.get_all_data()

        # Resolve variables in transform_config
        resolved_config = _resolve_config_variables(transform_config, context)

        # Execute transformation
        result = execute_transformation(
            operation=operation,
            input_data=input_data,
            config=resolved_config,
            error_mode=error_mode,
            default_value=default_value
        )

        duration_ms = int((time.time() - start_time) * 1000)

        return {
            "output": result,
            "metadata": {
                "step_id": step_id,
                "operation": operation,
                "duration_ms": duration_ms,
                "success": True,
                "error_mode": error_mode_str,
            }
        }

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)

        # Log error
        print(f"❌ Transform step '{step_id}' failed: {str(e)}")

        # Handle error based on mode
        if error_mode_str == SchemaErrorMode.FAIL:
            raise
        elif error_mode_str == SchemaErrorMode.CONTINUE:
            print(f"⚠️ Continuing after error in step '{step_id}'")
            return {
                "output": None,
                "metadata": {
                    "step_id": step_id,
                    "operation": operation,
                    "duration_ms": duration_ms,
                    "success": False,
                    "error": str(e),
                    "error_mode": error_mode_str,
                }
            }
        else:  # RETRY
            # TODO: Implement retry logic in Phase 6
            print(f"⚠️ Retry not implemented, failing step '{step_id}'")
            raise


def _resolve_config_variables(config: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    """
    Recursively resolve variables in transformation configuration

    Replaces ${var} placeholders with values from context

    Args:
        config: Configuration dictionary
        context: Workflow context

    Returns:
        Configuration with resolved variables
    """
    if isinstance(config, dict):
        return {key: _resolve_config_variables(value, context) for key, value in config.items()}
    elif isinstance(config, list):
        return [_resolve_config_variables(item, context) for item in config]
    elif isinstance(config, str):
        # Check if this is a variable reference
        if config.startswith("${") and config.endswith("}"):
            var_path = config[2:-1]  # Remove ${ and }
            try:
                return context.get_value(var_path)
            except Exception as e:
                # If variable resolution fails, return the original string
                print(f"⚠️ Failed to resolve variable '{var_path}': {str(e)}")
                return config
        return config
    else:
        return config
