"""
LLM Step Executor

Executes LLM workflow steps by:
- Loading prompt templates or using inline prompts
- Substituting variables from workflow context
- Calling LLM provider with proper error handling
- Returning standardized LLM response

Integration:
- Phase 2: Uses LLMProvider interface (OpenRouter, Anthropic, OpenAI)
- Phase 3: Integrates with WorkflowContext and PromptLoader
"""

import logging
import time
from typing import Dict, Any, Optional
from pathlib import Path

from app.workflows.schema import WorkflowStep, StepType, LLMStepConfig, ErrorMode
from app.workflows.context import WorkflowContext
from app.workflows.prompt_loader import PromptLoader, PromptLoadError
from app.services import (
    get_llm_provider,
    LLMProvider,
    LLMResponse,
    Message,
    LLMProviderError,
)

logger = logging.getLogger(__name__)


class LLMStepExecutionError(Exception):
    """Error during LLM step execution."""
    pass


class LLMStepConfigError(LLMStepExecutionError):
    """Invalid LLM step configuration."""
    pass


class LLMStepExecutor:
    """
    Executor for LLM workflow steps.

    Handles prompt loading, variable substitution, and LLM API calls.
    Supports both template-based prompts (.md files) and inline prompts.
    """

    def __init__(
        self,
        prompt_loader: PromptLoader,
        provider_name: str = "openrouter",
        provider: Optional[LLMProvider] = None
    ) -> None:
        """
        Initialize LLM step executor.

        Args:
            prompt_loader: Prompt template loader instance
            provider_name: LLM provider identifier (default: "openrouter")
            provider: Optional pre-configured LLM provider (for testing)
        """
        self.prompt_loader = prompt_loader
        self.provider_name = provider_name
        self._provider = provider  # For testing/dependency injection

    def execute_sync(
        self,
        step: WorkflowStep,
        context: WorkflowContext
    ) -> LLMResponse:
        """
        Execute LLM step synchronously.
        """
        # Validate step type
        if step.type != StepType.LLM:
            raise LLMStepConfigError(
                f"Step '{step.id}' has type '{step.type}', expected 'llm'"
            )

        # Parse configuration
        config = self._parse_config(step.config)

        # Build prompt synchronously
        prompt = self.prompt_loader.load_prompt_sync(config.prompt_template) if config.prompt_template else config.prompt_text
        
        # Build variable substitution map
        variables = self._resolve_variables(config.variables or {}, context)

        # Substitute variables in prompt
        prompt = self.prompt_loader.substitute_variables(prompt, variables)

        try:
            # Get or create LLM provider
            provider = self._provider or get_llm_provider(self.provider_name)

            # Update timeout if specified in config
            if config.timeout and hasattr(provider, 'timeout_val'):
                provider.timeout_val = config.timeout

            # Call LLM API synchronously
            response = provider.generate_sync(
                messages=[Message(role="user", content=prompt)],
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p
            )

            logger.info(
                f"LLM step '{step.id}' completed (sync): "
                f"{response.usage.total_tokens} tokens, "
                f"${response.cost_usd:.6f} cost, "
                f"{response.duration_ms}ms"
            )

            return response

        except Exception as e:
            # Handle errors according to error_mode
            if step.error_mode == ErrorMode.FAIL:
                logger.error(f"LLM step '{step.id}' failed (sync): {e}")
                raise LLMStepExecutionError(
                    f"LLM step '{step.id}' execution failed: {e}"
                ) from e
            elif step.error_mode == ErrorMode.CONTINUE:
                logger.warning(
                    f"LLM step '{step.id}' failed (sync) but continuing: {e}"
                )
                return None
            else:
                raise

    async def execute(
        self,
        step: WorkflowStep,
        context: WorkflowContext
    ) -> LLMResponse:
        """
        Execute LLM step with proper error handling.
        """
        # Validate step type
        if step.type != StepType.LLM:
            raise LLMStepConfigError(
                f"Step '{step.id}' has type '{step.type}', expected 'llm'"
            )

        # Parse configuration
        config = self._parse_config(step.config)

        # Build final prompt
        prompt = await self._build_prompt(config, context)

        try:
            # Get or create LLM provider
            provider = self._provider or get_llm_provider(self.provider_name)

            # Update timeout if specified in config
            if config.timeout and hasattr(provider, 'timeout_val'):
                provider.timeout_val = config.timeout

            try:
                # Call LLM API
                response = await self._call_llm(provider, prompt, config)

                logger.info(
                    f"LLM step '{step.id}' completed: "
                    f"{response.usage.total_tokens} tokens, "
                    f"${response.cost_usd:.6f} cost, "
                    f"{response.duration_ms}ms"
                )

                return response

            finally:
                # No cleanup needed for shared global client
                pass

        except Exception as e:
            # Handle errors according to error_mode
            if step.error_mode == ErrorMode.FAIL:
                logger.error(f"LLM step '{step.id}' failed: {e}")
                raise LLMStepExecutionError(
                    f"LLM step '{step.id}' execution failed: {e}"
                ) from e

            elif step.error_mode == ErrorMode.CONTINUE:
                logger.warning(
                    f"LLM step '{step.id}' failed but continuing: {e}"
                )
                return None  # Signal to workflow engine to continue

            elif step.error_mode == ErrorMode.RETRY:
                logger.error(
                    f"LLM step '{step.id}' failed. "
                    f"Retry mode not implemented."
                )
                raise LLMStepExecutionError(
                    f"Retry mode not supported (step '{step.id}')"
                ) from e

    def _parse_config(self, config_dict: Dict[str, Any]) -> LLMStepConfig:
        """
        Parse and validate LLM step configuration.
        """
        try:
            config = LLMStepConfig(**config_dict)
            if not config.prompt_template and not config.prompt_text:
                raise ValueError(
                    "Must provide either 'prompt_template' or 'prompt_text'"
                )
            return config
        except Exception as e:
            raise LLMStepConfigError(
                f"Invalid LLM step configuration: {e}"
            ) from e

    async def _build_prompt(
        self,
        config: LLMStepConfig,
        context: WorkflowContext
    ) -> str:
        """
        Build final prompt from template or inline text.
        """
        try:
            # Load prompt template or use inline text
            if config.prompt_template:
                # Load from file with includes resolved
                prompt = await self.prompt_loader.load_prompt(
                    config.prompt_template
                )
            else:
                # Use inline text directly
                prompt = config.prompt_text

            # Build variable substitution map
            variables = self._resolve_variables(config.variables or {}, context)

            # Substitute variables in prompt
            prompt = self.prompt_loader.substitute_variables(prompt, variables)

            return prompt

        except PromptLoadError as e:
            raise LLMStepConfigError(
                f"Error loading prompt template '{config.prompt_template}': {e}"
            ) from e
        except Exception as e:
            raise LLMStepConfigError(
                f"Error building prompt: {e}"
            ) from e

    def _resolve_variables(
        self,
        variable_map: Dict[str, str],
        context: WorkflowContext
    ) -> Dict[str, Any]:
        """
        Resolve variable references from workflow context.
        """
        resolved = {}

        for var_name, var_ref in variable_map.items():
            if isinstance(var_ref, str):
                # Use context.resolve_string to handle single or multiple placeholders
                resolved[var_name] = context.resolve_string(var_ref)
            else:
                # Literal value (no substitution)
                resolved[var_name] = var_ref

        return resolved

    async def _call_llm(
        self,
        provider: LLMProvider,
        prompt: str,
        config: LLMStepConfig
    ) -> LLMResponse:
        """
        Call LLM provider with proper configuration.
        """
        # Build message list (currently single user message)
        messages = [Message(role="user", content=prompt)]

        # Call provider
        response = await provider.generate(
            messages=messages,
            model=config.model,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            top_p=config.top_p
        )

        return response
