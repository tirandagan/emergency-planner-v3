"""
Step Details Panel - Display Selected Step Configuration

Shows detailed configuration for the currently selected step with:
- Step metadata (ID, type, error mode)
- Type-specific configuration
- Read-only view (editing to be added later)
"""

from textual.app import ComposeResult
from textual.containers import Vertical, VerticalScroll
from textual.widgets import Static, Label
from typing import Dict, Any, Optional
import json


class StepDetailsPanel(Vertical):
    """
    Panel displaying detailed step configuration

    Shows:
    - Step ID, type, error mode
    - Configuration details based on step type
    - Variable references
    """

    def compose(self) -> ComposeResult:
        """Create step details layout"""
        yield Static("🔍 [bold cyan]Step Details[/bold cyan]", classes="panel-header")
        yield VerticalScroll(id="step-details-content")

    def load_step(self, step: Optional[Dict[str, Any]], step_index: int = -1) -> None:
        """
        Load step configuration into details panel

        Args:
            step: Step dictionary or None to clear
            step_index: Index of step in workflow
        """
        content = self.query_one("#step-details-content", VerticalScroll)
        content.remove_children()

        if not step:
            content.mount(Label("[dim]No step selected[/dim]", classes="step-detail-item"))
            return

        # Basic info
        step_id = step.get("id", f"step_{step_index}")
        step_type = step.get("type", "unknown")
        error_mode = step.get("error_mode", "fail")

        content.mount(Label(f"[bold]ID:[/bold] {step_id}", classes="step-detail-item"))
        content.mount(Label(f"[bold]Type:[/bold] {step_type}", classes="step-detail-item"))
        content.mount(Label(f"[bold]Error Mode:[/bold] {error_mode}", classes="step-detail-item"))
        content.mount(Label("", classes="step-detail-spacer"))

        # Configuration details
        config = step.get("config", {})

        if step_type == "llm":
            self._display_llm_config(content, config)
        elif step_type == "transform":
            self._display_transform_config(content, config)
        elif step_type == "external_api":
            self._display_external_api_config(content, config)
        else:
            # Generic JSON display
            content.mount(Label("[bold]Configuration:[/bold]", classes="step-detail-item"))
            config_json = json.dumps(config, indent=2)
            content.mount(Label(config_json, classes="step-detail-json"))

    def _display_llm_config(self, content: VerticalScroll, config: Dict[str, Any]) -> None:
        """Display LLM step configuration"""
        content.mount(Label("[bold cyan]LLM Configuration:[/bold cyan]", classes="step-detail-section"))

        model = config.get("model", "unknown")
        temp = config.get("temperature", 0.7)
        max_tokens = config.get("max_tokens", 4000)
        prompt_template = config.get("prompt_template")
        prompt_text = config.get("prompt_text")

        content.mount(Label(f"Model: {model}", classes="step-detail-item"))
        content.mount(Label(f"Temperature: {temp}", classes="step-detail-item"))
        content.mount(Label(f"Max Tokens: {max_tokens}", classes="step-detail-item"))

        if prompt_template:
            content.mount(Label(f"Template: {prompt_template}", classes="step-detail-item"))
        elif prompt_text:
            content.mount(Label("Prompt: (inline)", classes="step-detail-item"))

        # Variables
        variables = config.get("variables", {})
        if variables:
            content.mount(Label("", classes="step-detail-spacer"))
            content.mount(Label("[bold]Variables:[/bold]", classes="step-detail-item"))
            for key, value in variables.items():
                content.mount(Label(f"  {key}: {value}", classes="step-detail-item"))

    def _display_transform_config(self, content: VerticalScroll, config: Dict[str, Any]) -> None:
        """Display transform step configuration"""
        content.mount(Label("[bold cyan]Transform Configuration:[/bold cyan]", classes="step-detail-section"))

        operation = config.get("operation", "unknown")
        input_ref = config.get("input")
        transform_config = config.get("config", {})

        content.mount(Label(f"Operation: {operation}", classes="step-detail-item"))

        if input_ref:
            content.mount(Label(f"Input: {input_ref}", classes="step-detail-item"))

        if transform_config:
            content.mount(Label("", classes="step-detail-spacer"))
            content.mount(Label("[bold]Operation Config:[/bold]", classes="step-detail-item"))
            config_json = json.dumps(transform_config, indent=2)
            content.mount(Label(config_json, classes="step-detail-json"))

    def _display_external_api_config(self, content: VerticalScroll, config: Dict[str, Any]) -> None:
        """Display external API step configuration"""
        content.mount(Label("[bold cyan]External API Configuration:[/bold cyan]", classes="step-detail-section"))

        service = config.get("service", "unknown")
        operation = config.get("operation", "unknown")
        cache_ttl = config.get("cache_ttl")
        api_config = config.get("config", {})

        content.mount(Label(f"Service: {service}", classes="step-detail-item"))
        content.mount(Label(f"Operation: {operation}", classes="step-detail-item"))

        if cache_ttl:
            content.mount(Label(f"Cache TTL: {cache_ttl}s", classes="step-detail-item"))

        if api_config:
            content.mount(Label("", classes="step-detail-spacer"))
            content.mount(Label("[bold]API Parameters:[/bold]", classes="step-detail-item"))
            config_json = json.dumps(api_config, indent=2)
            content.mount(Label(config_json, classes="step-detail-json"))

    def clear(self) -> None:
        """Clear step details"""
        self.load_step(None)
