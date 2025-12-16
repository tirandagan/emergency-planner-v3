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

    Example usage:
        executor = LLMStepExecutor(
            prompt_loader=PromptLoader(base_dir="workflows/prompts"),
            provider_name="openrouter"
        )

        step = WorkflowStep(
            id="generate_analysis",
            type=StepType.LLM,
            config={
                "model": "anthropic/claude-3.5-sonnet",
                "prompt_template": "emergency-contacts/system-prompt.md",
                "temperature": 0.7,
                "max_tokens": 4000,
                "variables": {
                    "location": "${input.location}",
                    "family_size": "${input.family_size}"
                }
            }
        )

        response = await executor.execute(step, context)
        # response is LLMResponse with content, tokens, cost
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

    async def execute(
        self,
        step: WorkflowStep,
        context: WorkflowContext
    ) -> LLMResponse:
        """
        Execute LLM step with proper error handling.

        Process:
        1. Validate step type and configuration
        2. Load prompt (template or inline)
        3. Resolve variables from workflow context
        4. Call LLM provider
        5. Return standardized response

        Args:
            step: Workflow step with type="llm" and LLMStepConfig
            context: Workflow execution context for variable resolution

        Returns:
            LLMResponse with content, tokens, cost, and metadata

        Raises:
            LLMStepConfigError: Invalid step configuration
            LLMStepExecutionError: Error during execution (if error_mode="fail")

        Note:
            If error_mode="continue", logs error and returns None instead of raising
        """
        # Validate step type
        if step.type != StepType.LLM:
            raise LLMStepConfigError(
                f"Step '{step.id}' has type '{step.type}', expected 'llm'"
            )

        # Parse and validate LLM configuration (don't catch config errors)
        config = self._parse_config(step.config)

        # Build final prompt (don't catch config errors)
        prompt = await self._build_prompt(config, context)

        try:
            # Get or create LLM provider
            provider = self._provider or get_llm_provider(self.provider_name)

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
                # Clean up provider if we created it
                if not self._provider:
                    await provider.close()

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
                # Phase 3: Retry not implemented yet
                logger.error(
                    f"LLM step '{step.id}' failed. "
                    f"Retry mode not implemented in Phase 3."
                )
                raise LLMStepExecutionError(
                    f"Retry mode not supported (step '{step.id}')"
                ) from e

    def _parse_config(self, config_dict: Dict[str, Any]) -> LLMStepConfig:
        """
        Parse and validate LLM step configuration.

        Args:
            config_dict: Raw configuration dictionary from workflow JSON

        Returns:
            Validated LLMStepConfig instance

        Raises:
            LLMStepConfigError: Invalid configuration
        """
        try:
            config = LLMStepConfig(**config_dict)

            # Validate at least one prompt source
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

        Process:
        1. Load template file OR use inline text
        2. Resolve {{include:...}} directives (if template)
        3. Substitute ${...} variables from context

        Args:
            config: LLM step configuration
            context: Workflow execution context

        Returns:
            Final prompt text with all includes and variables resolved

        Raises:
            LLMStepConfigError: Error loading or processing prompt
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

        Handles variable references like:
        - "${input.location}" -> context.get_value("input.location")
        - "${steps.fetch.output.count}" -> context.get_value("steps.fetch.output.count")
        - "Seattle" -> "Seattle" (literal string, no substitution)

        Args:
            variable_map: Variable name -> reference mapping from config
            context: Workflow execution context

        Returns:
            Dict mapping variable names to resolved values

        Example:
            config.variables = {
                "location": "${input.location}",
                "count": "${steps.fetch.output.count}",
                "static_value": "Seattle"
            }

            # Resolves to:
            {
                "location": "Seattle, WA",
                "count": 10,
                "static_value": "Seattle"
            }
        """
        resolved = {}

        for var_name, var_ref in variable_map.items():
            # Check if it's a variable reference (${...})
            if isinstance(var_ref, str) and var_ref.startswith("${") and var_ref.endswith("}"):
                # Extract path: "${input.location}" -> "input.location"
                path = var_ref[2:-1]

                # Resolve from context
                value = context.get_value(path)
                resolved[var_name] = value
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

        Args:
            provider: LLM provider instance
            prompt: Final prompt text (variables substituted)
            config: LLM step configuration

        Returns:
            LLMResponse with content, tokens, cost, and metadata

        Raises:
            LLMProviderError: API call failed
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
