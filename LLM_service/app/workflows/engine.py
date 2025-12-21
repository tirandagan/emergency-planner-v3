"""
Workflow Engine

Orchestrates workflow execution by:
- Loading workflow definitions from JSON files
- Executing steps sequentially with context management
- Handling errors according to step error modes
- Storing step outputs for subsequent steps
- Returning final workflow results with metadata
- Preserving error context through all execution layers

Integration:
- Phase 3: Supports LLM steps via LLMStepExecutor
- Phase 4: Supports transformation steps via TransformExecutor
- Phase 5: Supports external API steps via ExternalAPIExecutor
- Phase 9: Enhanced error handling with comprehensive context
"""

import logging
import json
import time
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List, Callable
from pydantic import ValidationError

# Detect if running under eventlet for event loop management
try:
    import eventlet
    RUNNING_UNDER_EVENTLET = True
    logger_temp = logging.getLogger(__name__)
    logger_temp.debug("Detected eventlet runtime environment")
except ImportError:
    RUNNING_UNDER_EVENTLET = False

# Conditionally import and apply nest_asyncio only when uvloop is not available
# nest_asyncio is incompatible with uvloop (used by Gunicorn + uvicorn[standard])
# but required for Celery workers using eventlet pool
try:
    import uvloop
    # uvloop is installed - skip nest_asyncio entirely to avoid conflicts
    # FastAPI/Gunicorn doesn't need nested event loops anyway
except ImportError:
    # uvloop not installed - safe to use nest_asyncio for Celery compatibility
    try:
        import nest_asyncio
        nest_asyncio.apply()
    except (ValueError, RuntimeError, ImportError):
        # Already applied, incompatible, or not installed
        pass

from app.workflows.schema import (
    Workflow,
    WorkflowStep,
    StepType,
    ErrorMode,
    TransformStepConfig,
)
from app.workflows.context import WorkflowContext
from app.workflows.prompt_loader import PromptLoader
from app.workflows.llm_executor import LLMStepExecutor, LLMStepExecutionError
from app.workflows.transform_executor import execute_transform_step
from app.workflows.external_api_executor import execute_external_api_step
from app.workflows.errors import WorkflowErrorContext, WorkflowErrorBase
from app.services import LLMResponse

logger = logging.getLogger(__name__)


class WorkflowEngineError(Exception):
    """Base exception for workflow engine errors."""
    pass


class WorkflowLoadError(WorkflowEngineError):
    """Error loading workflow definition."""
    pass


class WorkflowExecutionError(WorkflowEngineError):
    """Error during workflow execution."""
    pass


class WorkflowTimeoutError(WorkflowExecutionError):
    """Workflow execution exceeded timeout."""
    pass


class WorkflowResult:
    """
    Workflow execution result with metadata.

    Contains:
    - Final workflow output (from last step or combined results)
    - Step execution history with outputs and errors
    - Execution metadata (duration, tokens, cost)
    - Success/failure status
    """

    def __init__(
        self,
        workflow_name: str,
        success: bool,
        output: Any,
        steps_executed: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ):
        self.workflow_name = workflow_name
        self.success = success
        self.output = output
        self.steps_executed = steps_executed
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for serialization."""
        return {
            "workflow_name": self.workflow_name,
            "success": self.success,
            "output": self.output,
            "steps_executed": self.steps_executed,
            "metadata": self.metadata
        }


class WorkflowEngine:
    """
    Workflow orchestration engine.

    Loads workflow definitions from JSON files and executes them
    by coordinating step executors (LLM, transform, external API).

    Example usage:
        engine = WorkflowEngine(
            workflows_dir="workflows/definitions",
            prompts_dir="workflows/prompts"
        )

        # Load workflow
        workflow = engine.load_workflow("emergency_contacts")

        # Execute with input data
        result = await engine.execute_workflow(
            workflow=workflow,
            input_data={"location": "Seattle, WA", "family_size": 4}
        )

        # Access results
        print(result.output)  # Final workflow output
        print(result.metadata)  # Execution metadata
    """

    def __init__(
        self,
        workflows_dir: str = "workflows/definitions",
        prompts_dir: str = "workflows/prompts",
        llm_provider: str = "openrouter"
    ):
        """
        Initialize workflow engine.

        Args:
            workflows_dir: Directory containing workflow JSON files
            prompts_dir: Directory containing prompt templates
            llm_provider: LLM provider name (default: "openrouter")
        """
        self.workflows_dir = Path(workflows_dir)
        self.prompts_dir = Path(prompts_dir)

        # Initialize prompt loader
        self.prompt_loader = PromptLoader(base_dir=str(prompts_dir))

        # Initialize step executors
        self.llm_executor = LLMStepExecutor(
            prompt_loader=self.prompt_loader,
            provider_name=llm_provider
        )

    def load_workflow(self, workflow_name: str) -> Workflow:
        """
        Load and validate workflow definition from JSON file.

        Args:
            workflow_name: Workflow name (e.g., "emergency_contacts")

        Returns:
            Validated Workflow instance

        Raises:
            WorkflowLoadError: Workflow file not found or invalid

        Example:
            workflow = engine.load_workflow("emergency_contacts")
            # Loads from workflows/definitions/emergency_contacts.json
        """
        workflow_file = self.workflows_dir / f"{workflow_name}.json"

        if not workflow_file.exists():
            raise WorkflowLoadError(
                f"Workflow file not found: {workflow_file}"
            )

        try:
            with open(workflow_file, 'r') as f:
                workflow_data = json.load(f)

            # Validate with Pydantic
            workflow = Workflow(**workflow_data)

            logger.info(
                f"Loaded workflow '{workflow.name}' v{workflow.version} "
                f"with {len(workflow.steps)} steps"
            )

            return workflow

        except json.JSONDecodeError as e:
            raise WorkflowLoadError(
                f"Invalid JSON in workflow file '{workflow_file}': {e}"
            ) from e

        except ValidationError as e:
            raise WorkflowLoadError(
                f"Workflow validation failed for '{workflow_name}': {e}"
            ) from e

        except Exception as e:
            raise WorkflowLoadError(
                f"Error loading workflow '{workflow_name}': {e}"
            ) from e

    def execute_sync(
        self,
        workflow_name: str,
        input_data: Dict[str, Any],
        progress_callback: Optional[Callable] = None,
        timeout_override: Optional[int] = None
    ) -> WorkflowResult:
        """
        Pure synchronous execution path for workflow.
        COMPLETELY AVOIDS ANYIO/ASYNCIO for heavy I/O.
        Best for eventlet Celery workers.
        """
        start_time = time.time()
        workflow = self.load_workflow(workflow_name)
        timeout = timeout_override or workflow.timeout_seconds
        context = WorkflowContext(input_data)
        steps_executed = []
        total_cost = 0.0
        total_tokens = 0
        llm_calls = []

        try:
            for i, step in enumerate(workflow.steps, start=1):
                elapsed = time.time() - start_time
                if elapsed > timeout:
                    raise WorkflowTimeoutError(f"Workflow timeout")

                step_start = time.time()
                
                # EXECUTE STEP SYNC
                step_result = None
                if step.type == StepType.LLM:
                    step_result = self.llm_executor.execute_sync(step, context)
                elif step.type == StepType.TRANSFORM:
                    # Pure sync execution for transforms to avoid loop issues
                    from .transformations import execute_transformation
                    
                    config_dict = step.config or {}
                    operation = config_dict.get('operation')
                    transform_config = config_dict.get('config', {})
                    
                    # Resolve input
                    input_path = config_dict.get('input')
                    if input_path:
                        if input_path.startswith("${") and input_path.endswith("}"):
                            input_path = input_path[2:-1]
                        input_data_for_transform = context.get_value(input_path)
                    else:
                        input_data_for_transform = context.get_all_data()
                        
                    # Resolve config variables
                    from .transform_executor import _resolve_config_variables
                    resolved_transform_config = _resolve_config_variables(transform_config, context)
                    
                    step_result = execute_transformation(
                        operation=operation,
                        input_data=input_data_for_transform,
                        config=resolved_transform_config,
                        error_mode=ErrorMode.CONTINUE if step.error_mode == ErrorMode.CONTINUE else ErrorMode.FAIL
                    )
                elif step.type == StepType.EXTERNAL_API:
                    # USE PURE SYNC PATH FOR EXTERNAL API
                    from .external_api_executor import execute_external_api_step_sync
                    result = execute_external_api_step_sync(step, context)
                    step_result = result.get("data")
                
                step_duration = int((time.time() - step_start) * 1000)
                step_info = {
                    "step_id": step.id,
                    "step_type": step.type.value,
                    "duration_ms": step_duration,
                    "success": step_result is not None,
                }

                if step_result is not None:
                    if isinstance(step_result, LLMResponse):
                        context.set_step_output(step.id, step_result.model_dump())
                        step_info["tokens"] = step_result.usage.total_tokens
                        step_info["cost_usd"] = step_result.cost_usd
                        total_cost += step_result.cost_usd
                        total_tokens += step_result.usage.total_tokens
                        llm_calls.append({
                            "provider": step_result.provider,
                            "model": step_result.model,
                            "input_tokens": step_result.usage.input_tokens,
                            "output_tokens": step_result.usage.output_tokens,
                            "total_tokens": step_result.usage.total_tokens,
                            "cost_usd": step_result.cost_usd,
                            "duration_ms": step_result.duration_ms,
                            "metadata": {"step_id": step.id}
                        })
                    else:
                        context.set_step_output(step.id, step_result)
                    
                    step_info["output"] = self._serialize_output(step_result)

                steps_executed.append(step_info)
                if progress_callback:
                    progress_callback(step.id, i, len(workflow.steps), step_result)

            final_output = self._build_final_output(workflow, context)
            return WorkflowResult(
                workflow_name=workflow.name,
                success=True,
                output=final_output,
                steps_executed=steps_executed,
                metadata={
                    "workflow_version": workflow.version,
                    "total_steps": len(workflow.steps),
                    "duration_ms": int((time.time() - start_time) * 1000),
                    "total_tokens": total_tokens,
                    "total_cost_usd": round(total_cost, 6),
                    "llm_calls": llm_calls
                }
            )
        except Exception as e:
            logger.error(f"Sync workflow failed: {e}")
            return WorkflowResult(
                workflow_name=workflow.name,
                success=False,
                output=None,
                steps_executed=steps_executed,
                metadata={"error": str(e)}
            )

    def execute(
        self,
        workflow_name: str,
        input_data: Dict[str, Any],
        progress_callback: Optional[Callable] = None,
        timeout_override: Optional[int] = None
    ) -> WorkflowResult:
        """
        Synchronous execution path for workflow.
        Safely handles loop management for both eventlet and standard environments.
        """
        # Load workflow
        workflow = self.load_workflow(workflow_name)

        # Get the correct loop for the current thread/greenlet
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # nest_asyncio is required to allow loop.run_until_complete()
        # when the loop is already running (common in eventlet).
        try:
            import nest_asyncio
            nest_asyncio.apply(loop)
        except ImportError:
            pass
            
        return loop.run_until_complete(
            self.execute_workflow(
                workflow=workflow,
                input_data=input_data,
                timeout_override=timeout_override,
                progress_callback=progress_callback
            )
        )

    async def execute_workflow(
        self,
        workflow: Workflow,
        input_data: Dict[str, Any],
        timeout_override: Optional[int] = None,
        progress_callback: Optional[Callable] = None
    ) -> WorkflowResult:
        """
        Execute workflow with provided input data.

        Process:
        1. Initialize workflow context with input data
        2. Execute steps sequentially
        3. Store step outputs in context for subsequent steps
        4. Handle errors according to step error modes
        5. Return final result with metadata

        Args:
            workflow: Workflow definition to execute
            input_data: Input data for workflow context
            timeout_override: Optional timeout override (seconds)

        Returns:
            WorkflowResult with output, step history, and metadata

        Raises:
            WorkflowExecutionError: Workflow execution failed
            WorkflowTimeoutError: Workflow exceeded timeout

        Example:
            result = await engine.execute_workflow(
                workflow=workflow,
                input_data={"location": "Seattle", "family_size": 4}
            )

            # Access final output
            contacts = result.output["contacts"]

            # Access execution metadata
            total_cost = result.metadata["total_cost_usd"]
            duration = result.metadata["duration_ms"]
        """
        start_time = time.time()
        timeout = timeout_override or workflow.timeout_seconds

        # Initialize workflow context
        context = WorkflowContext(input_data)

        # Track execution history
        steps_executed = []
        total_cost = 0.0
        total_tokens = 0
        llm_calls = []  # Track LLM calls for storage

        logger.info(
            f"Executing workflow '{workflow.name}' with {len(workflow.steps)} steps"
        )

        try:
            # Execute steps sequentially
            for i, step in enumerate(workflow.steps, start=1):
                # Check timeout
                elapsed = time.time() - start_time
                if elapsed > timeout:
                    raise WorkflowTimeoutError(
                        f"Workflow '{workflow.name}' exceeded timeout "
                        f"({timeout}s) at step {i}/{len(workflow.steps)}"
                    )

                logger.info(
                    f"Executing step {i}/{len(workflow.steps)}: "
                    f"'{step.id}' (type: {step.type})"
                )

                # Execute step
                step_start = time.time()
                step_result = await self._execute_step(step, context)
                step_duration = int((time.time() - step_start) * 1000)

                # Store step execution info
                step_info = {
                    "step_id": step.id,
                    "step_type": step.type.value,
                    "duration_ms": step_duration,
                    "success": step_result is not None,
                }

                # Store output in context if step succeeded
                if step_result is not None:
                    # Convert Pydantic models to dict for context storage
                    # This ensures dictionary access works in variable resolution
                    if isinstance(step_result, LLMResponse):
                        # Convert LLMResponse to dict before storing
                        context.set_step_output(step.id, step_result.model_dump())
                    else:
                        # Store dict directly
                        context.set_step_output(step.id, step_result)

                    # Track metadata for LLM steps
                    if isinstance(step_result, LLMResponse):
                        step_info["tokens"] = step_result.usage.total_tokens
                        step_info["cost_usd"] = step_result.cost_usd
                        total_cost += step_result.cost_usd
                        total_tokens += step_result.usage.total_tokens

                        # Collect LLM call data for database storage
                        llm_calls.append({
                            "provider": step_result.provider,
                            "model": step_result.model,
                            "input_tokens": step_result.usage.input_tokens,
                            "output_tokens": step_result.usage.output_tokens,
                            "total_tokens": step_result.usage.total_tokens,
                            "cost_usd": step_result.cost_usd,
                            "duration_ms": step_result.duration_ms,
                            "metadata": {
                                "step_id": step.id,
                                "response_id": getattr(step_result, 'response_id', None)
                            }
                        })

                    step_info["output"] = self._serialize_output(step_result)

                steps_executed.append(step_info)

                logger.info(
                    f"Step '{step.id}' completed in {step_duration}ms"
                )

                # Call progress callback if provided
                if progress_callback:
                    try:
                        progress_callback(step.id, i, len(workflow.steps), step_result)
                    except Exception as e:
                        logger.warning(f"Progress callback failed: {e}")

            # Calculate total duration
            total_duration = int((time.time() - start_time) * 1000)

            # Build final result
            final_output = self._build_final_output(workflow, context)

            result = WorkflowResult(
                workflow_name=workflow.name,
                success=True,
                output=final_output,
                steps_executed=steps_executed,
                metadata={
                    "workflow_version": workflow.version,
                    "total_steps": len(workflow.steps),
                    "duration_ms": total_duration,
                    "total_tokens": total_tokens,
                    "total_cost_usd": round(total_cost, 6),
                    "llm_calls": llm_calls  # Include LLM calls for database storage
                }
            )

            logger.info(
                f"Workflow '{workflow.name}' completed successfully: "
                f"{total_duration}ms, {total_tokens} tokens, ${total_cost:.6f}"
            )

            return result

        except WorkflowTimeoutError:
            raise  # Re-raise timeout errors

        except Exception as e:
            logger.error(f"Workflow '{workflow.name}' failed: {e}", exc_info=True)

            # Build error result with context preservation
            total_duration = int((time.time() - start_time) * 1000)

            # Extract error context if available
            error_metadata = {"error": str(e)}
            if isinstance(e, WorkflowErrorBase) and hasattr(e, 'context'):
                # Preserve structured error context in metadata
                error_metadata["error_context"] = e.context.to_dict(include_sensitive=False)
                logger.error(
                    f"Workflow error details: type={e.context.error_type}, "
                    f"category={e.context.category}, step_id={e.context.step_id}"
                )

            result = WorkflowResult(
                workflow_name=workflow.name,
                success=False,
                output=None,
                steps_executed=steps_executed,
                metadata={
                    "workflow_version": workflow.version,
                    "total_steps": len(workflow.steps),
                    "steps_completed": len(steps_executed),
                    "duration_ms": total_duration,
                    **error_metadata  # Include error and error_context
                }
            )

            return result

    async def _execute_step(
        self,
        step: WorkflowStep,
        context: WorkflowContext
    ) -> Optional[Any]:
        """
        Execute single workflow step using appropriate executor.

        Args:
            step: Step to execute
            context: Workflow execution context

        Returns:
            Step output (type depends on step type):
            - LLM steps: LLMResponse
            - Transform steps: Any (Phase 4)
            - External API steps: Dict (Phase 5)
            Returns None if step failed but error_mode=continue

        Raises:
            WorkflowExecutionError: Step execution failed (if error_mode=fail)
        """
        try:
            if step.type == StepType.LLM:
                # Execute LLM step
                return await self.llm_executor.execute(step, context)

            elif step.type == StepType.TRANSFORM:
                # Phase 4: Transform step execution
                config = TransformStepConfig(**step.config)
                result = await execute_transform_step(step.id, config, context)
                return result["output"]

            elif step.type == StepType.EXTERNAL_API:
                # Phase 5: External API step execution
                return await execute_external_api_step(step, context)

            else:
                raise WorkflowExecutionError(
                    f"Unknown step type '{step.type}' for step '{step.id}'"
                )

        except Exception as e:
            # Error already handled by executor if error_mode=continue
            if step.error_mode == ErrorMode.CONTINUE:
                logger.warning(
                    f"Step '{step.id}' failed but continuing: {e}"
                )
                return None

            # Re-raise for error_mode=fail, preserving error context
            if isinstance(e, WorkflowErrorBase):
                # Preserve existing error context
                raise e
            else:
                # Wrap exceptions without context
                raise WorkflowExecutionError(
                    f"Step '{step.id}' execution failed: {e}"
                ) from e

    def _build_final_output(
        self,
        workflow: Workflow,
        context: WorkflowContext
    ) -> Any:
        """
        Build final workflow output from context.

        Currently returns output from the last step.
        Future: Support custom output transformations.

        Args:
            workflow: Workflow definition
            context: Workflow execution context

        Returns:
            Final workflow output
        """
        # Get last step output
        if workflow.steps:
            last_step_id = workflow.steps[-1].id
            output = context.get_value(f"steps.{last_step_id}.output")

            # For LLM responses, extract content
            if isinstance(output, LLMResponse):
                return {
                    "content": output.content,
                    "model": output.model,
                    "tokens": output.usage.total_tokens,
                    "cost_usd": output.cost_usd
                }

            return output

        return None

    def _serialize_output(self, output: Any) -> Any:
        """
        Serialize step output for storage in step history.

        Handles special types like LLMResponse.

        Args:
            output: Step output to serialize

        Returns:
            JSON-serializable representation
        """
        if isinstance(output, LLMResponse):
            return {
                "content": output.content[:200] + "..." if len(output.content) > 200 else output.content,
                "model": output.model,
                "tokens": output.usage.total_tokens,
                "cost_usd": output.cost_usd,
                "duration_ms": output.duration_ms
            }

        return output
