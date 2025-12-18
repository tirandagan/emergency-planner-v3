"""
Step Edit Panel - Form-based step configuration

Provides user-friendly forms for editing workflow steps with:
- Service/operation dropdowns
- Parameter forms with appropriate input types
- Variable substitution support
- Real-time validation
"""

from typing import Dict, Any, Optional, List
from textual.app import ComposeResult
from textual.containers import Vertical, Horizontal, ScrollableContainer
from textual.widgets import Static, Input, Select, Label, Button
from textual.message import Message
from textual.reactive import reactive

from ..models.service_discovery import service_discovery


class StepEditPanel(ScrollableContainer):
    """
    Panel for editing workflow step configuration.

    Features:
    - Type selector (LLM, Transform, External API)
    - Service dropdown (for external API steps)
    - Operation dropdown (for external API steps)
    - Parameter forms with appropriate widgets
    - Error mode selector
    """

    # Reactive state
    step_data: reactive[Optional[Dict[str, Any]]] = reactive(None)
    step_index: reactive[int] = reactive(-1)
    selected_service: reactive[Optional[str]] = reactive(None)
    selected_operation: reactive[Optional[str]] = reactive(None)

    def __init__(self, step: Optional[Dict[str, Any]] = None, step_index: int = -1, **kwargs):
        """
        Initialize step edit panel.

        Args:
            step: Optional step data to load on mount
            step_index: Index of step in workflow
            **kwargs: Additional arguments for ScrollableContainer
        """
        super().__init__(**kwargs)
        self._step_data = step
        self._step_index = step_index

    def on_mount(self) -> None:
        """Load step data after widgets are mounted."""
        if self._step_data:
            # Defer loading until after widgets are fully ready
            self.call_after_refresh(self.load_step, self._step_data, self._step_index)

    class StepChanged(Message):
        """Message sent when step configuration changes."""
        def __init__(self, step_index: int, step_data: Dict[str, Any]) -> None:
            self.step_index = step_index
            self.step_data = step_data
            super().__init__()

    class SelectionChanged(Message):
        """Message sent when user selects service/operation (for contextual help)."""
        def __init__(self, selection_type: str, selection_value: str) -> None:
            self.selection_type = selection_type  # 'service', 'operation', 'step_type'
            self.selection_value = selection_value
            super().__init__()

    def compose(self) -> ComposeResult:
        """Create step edit form layout."""
        yield Static("[bold cyan]Step Configuration[/bold cyan]", classes="panel-header")
        yield Vertical(id="step-edit-form")

    def load_step(self, step: Dict[str, Any], step_index: int) -> None:
        """
        Load step data and build appropriate form.

        Args:
            step: Step configuration dictionary
            step_index: Index of step in workflow
        """
        self.step_data = step
        self.step_index = step_index

        # Extract step type and config
        step_type = step.get("type", "llm")
        step_id = step.get("id", "")
        error_mode = step.get("error_mode", "fail")

        # Clear and rebuild form
        form_container = self.query_one("#step-edit-form", Vertical)
        form_container.remove_children()

        # Build form based on step type
        if step_type == "llm":
            self._build_llm_form(form_container, step)
        elif step_type == "external_api":
            self._build_external_api_form(form_container, step)
        elif step_type == "transform":
            self._build_transform_form(form_container, step)
        else:
            form_container.mount(Static(f"[yellow]Unknown step type: {step_type}[/yellow]"))

    def _build_llm_form(self, container: Vertical, step: Dict[str, Any]) -> None:
        """Build form for LLM step configuration."""
        config = step.get("config", {})

        # Step ID
        container.mount(Static("[bold]Step ID:[/bold]", classes="form-label"))
        step_id_input = Input(
            value=step.get("id", ""),
            placeholder="unique_step_id",
            id="input-step-id"
        )
        container.mount(step_id_input)

        # Model selection
        container.mount(Static("[bold]Model:[/bold]", classes="form-label"))
        model_select = Select(
            [
                ("Claude 3.5 Sonnet", "anthropic/claude-3.5-sonnet"),
                ("Claude 3 Opus", "anthropic/claude-3-opus"),
                ("Claude 3 Haiku", "anthropic/claude-3-haiku"),
            ],
            value=config.get("model", "anthropic/claude-3.5-sonnet"),
            id="select-model"
        )
        container.mount(model_select)

        # Prompt template
        container.mount(Static("[bold]Prompt Template:[/bold]", classes="form-label"))
        prompt_input = Input(
            value=config.get("prompt_template", ""),
            placeholder="path/to/prompt.md",
            id="input-prompt-template"
        )
        container.mount(prompt_input)

        # Temperature
        container.mount(Static("[bold]Temperature:[/bold] (0.0-1.0)", classes="form-label"))
        temp_input = Input(
            value=str(config.get("temperature", 0.7)),
            placeholder="0.7",
            id="input-temperature"
        )
        container.mount(temp_input)

        # Max tokens
        container.mount(Static("[bold]Max Tokens:[/bold]", classes="form-label"))
        tokens_input = Input(
            value=str(config.get("max_tokens", 4000)),
            placeholder="4000",
            id="input-max-tokens"
        )
        container.mount(tokens_input)

        # Error mode
        self._add_error_mode_selector(container, step.get("error_mode", "fail"))

        # Save button
        save_btn = Button("Save Changes", variant="primary", id="btn-save-step")
        container.mount(save_btn)

    def _build_external_api_form(self, container: Vertical, step: Dict[str, Any]) -> None:
        """Build form for External API step configuration."""
        config = step.get("config", {})

        # Step ID
        container.mount(Static("[bold]Step ID:[/bold]", classes="form-label"))
        step_id_input = Input(
            value=step.get("id", ""),
            placeholder="unique_step_id",
            id="input-step-id"
        )
        container.mount(step_id_input)

        # Service selection
        container.mount(Static("[bold]Service:[/bold]", classes="form-label"))
        service_options = [(s.display_name, s.service_name) for s in service_discovery.get_all_services()]
        if not service_options:
            service_options = [("No services available", "")]

        current_service = config.get("service", "")
        service_select = Select(
            service_options,
            value=current_service if current_service else service_options[0][1],
            id="select-service"
        )
        container.mount(service_select)
        self.selected_service = current_service

        # Operation selection (depends on service)
        # Support both 'method' and 'operation' field names
        container.mount(Static("[bold]Operation:[/bold]", classes="form-label"))
        operation_options = self._get_operation_options(current_service)
        current_operation = config.get("method", config.get("operation", ""))
        operation_select = Select(
            operation_options,
            value=current_operation if current_operation and operation_options else (operation_options[0][1] if operation_options else ""),
            id="select-operation",
            disabled=not operation_options
        )
        container.mount(operation_select)
        self.selected_operation = current_operation

        # Parameters section
        container.mount(Static("[bold]Parameters:[/bold]", classes="form-label"))
        params_container = Vertical(id="params-container")
        container.mount(params_container)

        # Build parameter inputs based on selected operation
        # Support both 'parameters' and nested 'config' field names
        if current_service and current_operation:
            current_params = config.get("parameters", config.get("config", {}))
            self._build_parameter_inputs(params_container, current_service, current_operation, current_params)

        # Cache TTL
        container.mount(Static("[bold]Cache TTL:[/bold] (seconds)", classes="form-label"))
        cache_input = Input(
            value=str(config.get("cache_ttl", 3600)),
            placeholder="3600",
            id="input-cache-ttl"
        )
        container.mount(cache_input)

        # Error mode
        self._add_error_mode_selector(container, step.get("error_mode", "fail"))

        # Save button
        save_btn = Button("Save Changes", variant="primary", id="btn-save-step")
        container.mount(save_btn)

    def _build_transform_form(self, container: Vertical, step: Dict[str, Any]) -> None:
        """Build form for Transform step configuration."""
        config = step.get("config", {})

        # Step ID
        container.mount(Static("[bold]Step ID:[/bold]", classes="form-label"))
        step_id_input = Input(
            value=step.get("id", ""),
            placeholder="unique_step_id",
            id="input-step-id"
        )
        container.mount(step_id_input)

        # Operation
        container.mount(Static("[bold]Operation:[/bold]", classes="form-label"))
        operation_select = Select(
            [
                ("Markdown to JSON", "markdown_to_json"),
                ("Extract Fields", "extract_fields"),
                ("Filter", "filter"),
                ("Map", "map"),
            ],
            value=config.get("operation", "markdown_to_json"),
            id="select-transform-operation"
        )
        container.mount(operation_select)

        # Input path
        container.mount(Static("[bold]Input:[/bold]", classes="form-label"))
        input_path = Input(
            value=config.get("input", ""),
            placeholder="${steps.previous_step.output}",
            id="input-transform-input"
        )
        container.mount(input_path)

        # Config (JSON)
        container.mount(Static("[bold]Config:[/bold] (JSON)", classes="form-label"))
        config_input = Input(
            value=str(config.get("config", {})),
            placeholder='{"key": "value"}',
            id="input-transform-config"
        )
        container.mount(config_input)

        # Error mode
        self._add_error_mode_selector(container, step.get("error_mode", "fail"))

        # Save button
        save_btn = Button("Save Changes", variant="primary", id="btn-save-step")
        container.mount(save_btn)

    def _add_error_mode_selector(self, container: Vertical, current_mode: str) -> None:
        """Add error mode selector to form."""
        container.mount(Static("[bold]Error Mode:[/bold]", classes="form-label"))
        error_mode_select = Select(
            [
                ("Fail (stop workflow)", "fail"),
                ("Continue (log and proceed)", "continue"),
                ("Retry (with backoff)", "retry"),
            ],
            value=current_mode,
            id="select-error-mode"
        )
        container.mount(error_mode_select)

    def _get_operation_options(self, service_name: str) -> List[tuple[str, str]]:
        """Get operation options for a service."""
        if not service_name:
            return [("Select a service first", "")]

        operations = service_discovery.get_operations(service_name)
        if not operations:
            return [("No operations available", "")]

        return [(op, op) for op in operations]

    def _build_parameter_inputs(
        self,
        container: Vertical,
        service_name: str,
        operation_name: str,
        current_params: Dict[str, Any]
    ) -> None:
        """Build parameter input fields based on operation requirements."""
        operation = service_discovery.get_operation(service_name, operation_name)
        if not operation:
            container.mount(Static("[dim]No parameter information available[/dim]"))
            return

        # Required parameters
        if operation.required_params:
            container.mount(Static("[bold yellow]Required Parameters:[/bold yellow]"))
            for param in operation.required_params:
                description = operation.param_descriptions.get(param, "")
                container.mount(Static(f"[cyan]{param}:[/cyan] {description}", classes="param-description"))
                param_input = Input(
                    value=str(current_params.get(param, "")),
                    placeholder=description,
                    id=f"param-{param}"
                )
                container.mount(param_input)

        # Optional parameters
        if operation.optional_params:
            container.mount(Static("[bold]Optional Parameters:[/bold]"))
            for param in operation.optional_params:
                description = operation.param_descriptions.get(param, "")
                container.mount(Static(f"[cyan]{param}:[/cyan] {description}", classes="param-description"))
                param_input = Input(
                    value=str(current_params.get(param, "")),
                    placeholder=description,
                    id=f"param-{param}"
                )
                container.mount(param_input)

    def on_select_changed(self, event: Select.Changed) -> None:
        """Handle selection changes in dropdowns."""
        if event.select.id == "select-service":
            # Service changed - update operations list
            self.selected_service = event.value

            # Post message for contextual help
            self.post_message(self.SelectionChanged("service", event.value))

            # Update operation dropdown
            operation_select = self.query_one("#select-operation", Select)
            operation_options = self._get_operation_options(event.value)
            operation_select.set_options(operation_options)

            # Clear and rebuild parameter inputs
            params_container = self.query_one("#params-container", Vertical)
            params_container.remove_children()

        elif event.select.id == "select-operation":
            # Operation changed - rebuild parameter form
            self.selected_operation = event.value

            # Post message for contextual help
            self.post_message(self.SelectionChanged("operation", event.value))

            if self.selected_service:
                params_container = self.query_one("#params-container", Vertical)
                params_container.remove_children()
                config = self.step_data.get("config", {}) if self.step_data else {}
                # Support both 'parameters' and nested 'config' field names
                current_params = config.get("parameters", config.get("config", {}))
                self._build_parameter_inputs(
                    params_container,
                    self.selected_service,
                    event.value,
                    current_params
                )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button clicks."""
        if event.button.id == "btn-save-step":
            self._save_step_changes()

    def _save_step_changes(self) -> None:
        """Collect form data and save step changes."""
        if not self.step_data:
            return

        # Collect form data based on step type
        step_type = self.step_data.get("type")

        try:
            # Get step ID (common to all types)
            step_id_input = self.query_one("#input-step-id", Input)
            step_id = step_id_input.value

            # Get error mode (common to all types)
            error_mode_select = self.query_one("#select-error-mode", Select)
            error_mode = error_mode_select.value

            # Build updated step data
            updated_step = {
                "id": step_id,
                "type": step_type,
                "error_mode": error_mode,
                "config": {}
            }

            if step_type == "llm":
                updated_step["config"] = self._collect_llm_config()
            elif step_type == "external_api":
                updated_step["config"] = self._collect_external_api_config()
            elif step_type == "transform":
                updated_step["config"] = self._collect_transform_config()

            # Post message with updated step
            self.post_message(self.StepChanged(self.step_index, updated_step))

        except Exception as e:
            # Handle errors (e.g., missing widgets)
            print(f"Error saving step: {e}")

    def _collect_llm_config(self) -> Dict[str, Any]:
        """Collect LLM configuration from form."""
        model_select = self.query_one("#select-model", Select)
        prompt_input = self.query_one("#input-prompt-template", Input)
        temp_input = self.query_one("#input-temperature", Input)
        tokens_input = self.query_one("#input-max-tokens", Input)

        return {
            "model": model_select.value,
            "prompt_template": prompt_input.value,
            "temperature": float(temp_input.value) if temp_input.value else 0.7,
            "max_tokens": int(tokens_input.value) if tokens_input.value else 4000
        }

    def _collect_external_api_config(self) -> Dict[str, Any]:
        """Collect External API configuration from form."""
        service_select = self.query_one("#select-service", Select)
        operation_select = self.query_one("#select-operation", Select)
        cache_input = self.query_one("#input-cache-ttl", Input)

        # Collect parameters
        parameters = {}
        operation = service_discovery.get_operation(service_select.value, operation_select.value)
        if operation:
            all_params = operation.required_params + operation.optional_params
            for param in all_params:
                try:
                    param_input = self.query_one(f"#param-{param}", Input)
                    if param_input.value:
                        parameters[param] = param_input.value
                except:
                    # Parameter input not found
                    pass

        return {
            "service": service_select.value,
            "method": operation_select.value,
            "parameters": parameters,
            "cache_ttl": int(cache_input.value) if cache_input.value else 3600
        }

    def _collect_transform_config(self) -> Dict[str, Any]:
        """Collect Transform configuration from form."""
        operation_select = self.query_one("#select-transform-operation", Select)
        input_path = self.query_one("#input-transform-input", Input)
        config_input = self.query_one("#input-transform-config", Input)

        return {
            "operation": operation_select.value,
            "input": input_path.value,
            "config": eval(config_input.value) if config_input.value else {}
        }
