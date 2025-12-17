"""
External API Step Executor for Workflow Engine

Executes external_api workflow steps with:
- Service registration and discovery
- Variable resolution from workflow context
- Caching and rate limiting
- Error handling (fail/continue/retry modes)
- Comprehensive error context capture for debugging
"""

import logging
import traceback
from typing import Any, Dict, Optional

from app.workflows.schema import WorkflowStep
from app.workflows.context import WorkflowContext
from app.workflows.external_services import (
    service_registry,
    ExternalServiceResponse,
    ExternalServiceError
)
from app.workflows.rate_limiter import RateLimitExceeded
from app.workflows.errors import (
    WorkflowErrorContext,
    ExternalAPIError,
    ConfigurationError,
    ErrorCategory,
    classify_error,
    is_retryable_error,
    get_retry_after,
    get_error_suggestions
)
from app.config import settings

# Import services to ensure they're registered
from app.workflows.services import GooglePlacesService, WeatherAPIService

logger = logging.getLogger(__name__)


def resolve_string_variables(value: str, context: WorkflowContext) -> str:
    """
    Resolve all ${var} patterns in a string.

    Handles composite strings like "${input.lat},${input.lng}" by resolving
    each variable reference and replacing it in the string.

    Args:
        value: String potentially containing ${var} patterns
        context: Workflow context for variable resolution

    Returns:
        String with all ${var} patterns resolved
    """
    import re

    # Pattern to match ${variable.path} references
    pattern = r'\$\{([^}]+)\}'

    def replace_var(match):
        var_path = match.group(1)
        try:
            resolved = context.get_value(var_path)
            return str(resolved)
        except (KeyError, ValueError) as e:
            logger.warning(f"Failed to resolve variable '${{{var_path}}}': {e}")
            return match.group(0)  # Return original ${var} if resolution fails

    return re.sub(pattern, replace_var, value)


async def execute_external_api_step(
    step: WorkflowStep,
    context: WorkflowContext
) -> Dict[str, Any]:
    """
    Execute external API step.

    Step configuration:
    ```json
    {
      "id": "fetch_places",
      "type": "external_api",
      "service": "google_places",
      "operation": "nearby_search",
      "config": {
        "location": "${context.location.lat},${context.location.lng}",
        "radius": 5000,
        "type": "hospital"
      },
      "cache_ttl": 604800,
      "error_mode": "continue"
    }
    ```

    Args:
        step: Workflow step configuration
        context: Workflow context with variables

    Returns:
        Dict with API response or error information

    Raises:
        Exception: On fatal errors (error_mode: fail)
    """
    # Extract step configuration
    service_name = step.config.get('service')
    operation = step.config.get('operation') or step.config.get('method')  # Support both 'operation' and 'method'
    params = step.config.get('config', {}) or step.config.get('parameters', {})  # Support both 'config' and 'parameters'
    cache_ttl = step.config.get('cache_ttl')
    error_mode = step.config.get('error_mode', 'fail')

    # Get user_id from input context if available
    try:
        user_id = context.get_value('input.user_id')
    except (KeyError, ValueError):
        user_id = None

    # Validate required fields
    if not service_name:
        error = "Missing required field: service"
        error_context = WorkflowErrorContext(
            error_type="ConfigurationError",
            category=ErrorCategory.CONFIG_ERROR,
            message=error,
            step_id=step.id,
            config=step.config,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
            retryable=False,
            suggestions=[
                "Add 'service' field to step configuration",
                "Check workflow JSON definition for missing fields"
            ]
        )
        if error_mode == 'fail':
            raise ConfigurationError(error, context=error_context)
        return {
            'success': False,
            'error': error,
            'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
        }

    if not operation:
        error = "Missing required field: operation"
        error_context = WorkflowErrorContext(
            error_type="ConfigurationError",
            category=ErrorCategory.CONFIG_ERROR,
            message=error,
            step_id=step.id,
            service=service_name,
            config=step.config,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
            retryable=False,
            suggestions=[
                "Add 'operation' field to step configuration",
                f"Check available operations for {service_name} service"
            ]
        )
        if error_mode == 'fail':
            raise ConfigurationError(error, context=error_context)
        return {
            'success': False,
            'error': error,
            'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
        }

    # Resolve variables in params
    resolved_params = {}
    for key, value in params.items():
        if isinstance(value, str):
            # Resolve all ${var} patterns in the string
            resolved_params[key] = resolve_string_variables(value, context)
        else:
            resolved_params[key] = value

    try:
        # Get service class and use as context manager for proper lifecycle
        try:
            service_class = service_registry._services.get(service_name)
            if not service_class:
                raise ValueError(
                    f"Service '{service_name}' not found. "
                    f"Available services: {list(service_registry._services.keys())}"
                )
        except ValueError as e:
            error = str(e)
            error_context = WorkflowErrorContext(
                error_type="ConfigurationError",
                category=ErrorCategory.CONFIG_ERROR,
                message=error,
                step_id=step.id,
                service=service_name,
                operation=operation,
                config=step.config,
                stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
                retryable=False,
                suggestions=[
                    f"Verify service '{service_name}' is registered",
                    "Check available services in service registry",
                    "Ensure service is properly initialized at startup"
                ]
            )
            if error_mode == 'fail':
                raise ConfigurationError(error, context=error_context)
            return {
                'success': False,
                'error': error,
                'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
            }

        # Use service as async context manager for automatic cleanup
        async with service_class() as service:
            # Execute API request
            response: ExternalServiceResponse = await service.call(
                operation=operation,
                params=resolved_params,
                user_id=user_id,
                cache_ttl=cache_ttl
            )

            # Return response
            if response.success:
                return {
                    'success': True,
                    'data': response.data,
                    'cached': response.cached,
                    'metadata': response.metadata
                }
            else:
                # Handle error based on error_mode
                if error_mode == 'fail':
                    raise ExternalServiceError(response.error)
                elif error_mode == 'continue':
                    return {
                        'success': False,
                        'error': response.error,
                        'metadata': response.metadata
                    }
                elif error_mode == 'retry':
                    # Retry mode not fully implemented yet
                    # For now, return error with retry placeholder
                    return {
                        'success': False,
                        'error': response.error,
                        'retry': True,
                        'metadata': response.metadata
                    }

    except RateLimitExceeded as e:
        error_msg = f"Rate limit exceeded ({e.limit_type}). Retry after {e.retry_after}s"

        # Build error context for rate limit errors
        error_context = WorkflowErrorContext(
            error_type="RateLimitExceeded",
            category=ErrorCategory.EXTERNAL_ERROR,
            message=error_msg,
            step_id=step.id,
            service=service_name,
            operation=operation,
            inputs=resolved_params,
            config=step.config,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
            retryable=True,
            retry_after=e.retry_after,
            suggestions=[
                f"Wait {e.retry_after} seconds before retrying",
                "Consider implementing request throttling",
                "Check API tier quota limits"
            ]
        )

        if error_mode == 'fail':
            raise ExternalAPIError(error_msg, context=error_context)

        return {
            'success': False,
            'error': error_msg,
            'rate_limited': True,
            'retry_after': e.retry_after,
            'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
        }

    except ExternalServiceError as e:
        # Build error context for external service errors
        error_context = WorkflowErrorContext(
            error_type="ExternalServiceError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message=str(e),
            step_id=step.id,
            service=service_name,
            operation=operation,
            inputs=resolved_params,
            config=step.config,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
            retryable=is_retryable_error(e),
            retry_after=get_retry_after(e),
            suggestions=get_error_suggestions(e, service_name, operation)
        )

        if error_mode == 'fail':
            raise ExternalAPIError(str(e), context=error_context)

        return {
            'success': False,
            'error': str(e),
            'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
        }

    except Exception as e:
        # Build comprehensive error context for unexpected errors
        error_context = WorkflowErrorContext(
            error_type=type(e).__name__,
            category=classify_error(e),
            message=str(e),
            step_id=step.id,
            service=service_name,
            operation=operation,
            inputs=resolved_params,
            config=step.config,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
            retryable=is_retryable_error(e),
            retry_after=get_retry_after(e),
            suggestions=get_error_suggestions(e, service_name, operation)
        )

        error_msg = f"Unexpected error in external API step: {str(e)}"

        if error_mode == 'fail':
            raise ExternalAPIError(error_msg, context=error_context)

        return {
            'success': False,
            'error': error_msg,
            'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
        }


def get_external_api_step_schema() -> Dict[str, Any]:
    """
    Get JSON schema for external_api step configuration.

    Used for workflow validation and documentation.

    Returns:
        JSON schema dictionary
    """
    return {
        "type": "object",
        "required": ["service", "operation", "config"],
        "properties": {
            "service": {
                "type": "string",
                "description": "External service name",
                "enum": service_registry.list_services()
            },
            "operation": {
                "type": "string",
                "description": "Service operation name"
            },
            "config": {
                "type": "object",
                "description": "Operation-specific configuration",
                "additionalProperties": True
            },
            "cache_ttl": {
                "type": "integer",
                "description": "Cache TTL in seconds (optional)",
                "minimum": 0
            },
            "error_mode": {
                "type": "string",
                "description": "Error handling mode",
                "enum": ["fail", "continue", "retry"],
                "default": "fail"
            }
        }
    }


def list_available_services() -> Dict[str, Any]:
    """
    List all registered external services with their operations.

    Returns:
        Dictionary mapping service names to their info
    """
    services = {}

    for service_name in service_registry.list_services():
        try:
            service_info = service_registry.get_service_info(service_name)
            services[service_name] = service_info
        except Exception as e:
            services[service_name] = {'error': str(e)}

    return services
