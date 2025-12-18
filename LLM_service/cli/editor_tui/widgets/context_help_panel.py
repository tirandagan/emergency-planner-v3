"""
Context Help Panel - Dynamic help based on user's current context

Shows contextual information in the right pane:
- Service descriptions when selecting services
- Operation details and parameters when selecting operations
- Output variable usage examples
- Validation errors when present
"""

from typing import Dict, Any, List, Optional
from textual.app import ComposeResult
from textual.containers import Vertical, ScrollableContainer
from textual.widgets import Static
from textual.reactive import reactive

from ..models.service_discovery import service_discovery, ServiceInfo, ServiceOperation


class ContextHelpPanel(ScrollableContainer):
    """
    Panel showing context-sensitive help and documentation.

    Displays different content based on what user is currently doing:
    - Workflow metadata: General workflow help
    - Service selection: Service description and capabilities
    - Operation selection: Operation details, parameters, examples
    - Validation errors: Current validation issues
    """

    # Reactive state
    current_context: reactive[str] = reactive("default")
    validation_errors: reactive[List[Dict[str, Any]]] = reactive([])

    def compose(self) -> ComposeResult:
        """Create help panel layout."""
        yield Static("[bold cyan]Context Help[/bold cyan]", classes="panel-header")
        yield Vertical(id="help-content")

    def on_mount(self) -> None:
        """Initialize with default help."""
        self.show_default_help()

    def show_default_help(self) -> None:
        """Show default workflow editing help."""
        self.current_context = "default"
        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        help_text = """[bold]Workflow Editor Help[/bold]

[cyan]Navigation:[/cyan]
• Click on [bold]Metadata[/bold] to edit workflow info
• Click on [bold]Steps[/bold] to edit individual steps
• Use ↑/↓ to navigate tree

[cyan]Editing:[/cyan]
• Forms adapt to step type
• Required fields marked in [yellow]yellow[/yellow]
• Use [cyan]${...}[/cyan] for variables

[cyan]Shortcuts:[/cyan]
• Ctrl+S - Save workflow
• Ctrl+Z/Y - Undo/Redo
• Ctrl+O - Open workflow"""
        content.mount(Static(help_text.strip()))

    def show_validation_errors(self, errors: List[Dict[str, Any]]) -> None:
        """Show validation errors."""
        self.validation_errors = errors
        self.current_context = "validation"

        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        if not errors:
            content.mount(Static("[green]✓ No validation errors[/green]", classes="validation-success"))
            return

        content.mount(Static(f"[bold red]⚠️ {len(errors)} Validation Errors[/bold red]"))

        for error in errors:
            severity = error.get("severity", "error")
            message = error.get("message", "Unknown error")

            if severity == "error":
                icon = "❌"
                color = "red"
            elif severity == "warning":
                icon = "⚠️"
                color = "yellow"
            else:
                icon = "ℹ️"
                color = "blue"

            error_text = f"[{color}]{icon} {message}[/{color}]"

            # Add step reference if available
            if "step_id" in error:
                error_text += f"\n  [dim]Step: {error['step_id']}[/dim]"
            elif "step_index" in error:
                error_text += f"\n  [dim]Step index: {error['step_index']}[/dim]"

            content.mount(Static(error_text, classes="validation-error"))

    def show_service_help(self, service_name: str) -> None:
        """Show help for a specific service."""
        self.current_context = f"service:{service_name}"

        service = service_discovery.get_service(service_name)
        if not service:
            self.show_default_help()
            return

        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        help_text = f"""[bold cyan]{service.display_name}[/bold cyan]

{service.description}

[bold]Available Operations:[/bold]"""
        for op in service.operations:
            help_text += f"\n• [yellow]{op.name}[/yellow]"

        help_text += """

[bold]Usage in Workflow:[/bold]
Select an operation to see detailed parameters and examples."""

        content.mount(Static(help_text.strip()))

    def show_operation_help(self, service_name: str, operation_name: str) -> None:
        """Show help for a specific operation."""
        self.current_context = f"operation:{service_name}:{operation_name}"

        operation = service_discovery.get_operation(service_name, operation_name)
        if not operation:
            self.show_default_help()
            return

        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        # Build operation help
        help_text = f"""[bold cyan]{operation_name}[/bold cyan]

[bold yellow]Required Parameters:[/bold yellow]"""
        if operation.required_params:
            for param in operation.required_params:
                desc = operation.param_descriptions.get(param, "")
                help_text += f"\n• [cyan]{param}[/cyan]: {desc}"
        else:
            help_text += "\n[dim]None[/dim]"

        help_text += "\n\n[bold]Optional Parameters:[/bold]"
        if operation.optional_params:
            for param in operation.optional_params:
                desc = operation.param_descriptions.get(param, "")
                help_text += f"\n• [cyan]{param}[/cyan]: {desc}"
        else:
            help_text += "\n[dim]None[/dim]"

        # Add output usage example
        help_text += """

[bold]Output Usage:[/bold]
After this step executes, access its output in subsequent steps:

[cyan]${{steps.your_step_id.output}}[/cyan]

The output structure depends on the operation:"""

        # Add operation-specific output examples
        if service_name == "google_places":
            if operation_name == "nearby_search" or operation_name == "text_search":
                help_text += """
• [cyan]results[/cyan] - Array of place objects
• [cyan]status[/cyan] - API status code"""
            elif operation_name == "place_details":
                help_text += """
• [cyan]result[/cyan] - Single place object
• [cyan]status[/cyan] - API status code"""
        elif service_name == "weatherapi":
            help_text += """
• [cyan]location[/cyan] - Location data
• [cyan]current[/cyan] - Current weather conditions"""

        content.mount(Static(help_text.strip()))

    def show_step_type_help(self, step_type: str) -> None:
        """Show help for a step type."""
        self.current_context = f"step_type:{step_type}"

        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        help_text = ""

        if step_type == "llm":
            help_text = """[bold cyan]LLM Step[/bold cyan]

Generate text using Large Language Models (Claude, GPT, etc.)

[bold]Configuration:[/bold]
• [cyan]Model[/cyan]: Which AI model to use
• [cyan]Prompt Template[/cyan]: Path to prompt file
• [cyan]Temperature[/cyan]: Randomness (0.0-1.0)
• [cyan]Max Tokens[/cyan]: Maximum response length

[bold]Output:[/bold]
Access generated text via:
[cyan]${steps.step_id.output.content}[/cyan]

[bold]Use Cases:[/bold]
• Text generation
• Data analysis
• Recommendations
• Content creation"""
        elif step_type == "external_api":
            help_text = """[bold cyan]External API Step[/bold cyan]

Call external services like Google Places or WeatherAPI.

[bold]Configuration:[/bold]
• [cyan]Service[/cyan]: Which external service to use
• [cyan]Operation[/cyan]: Which API method to call
• [cyan]Parameters[/cyan]: Operation-specific parameters
• [cyan]Cache TTL[/cyan]: How long to cache results

[bold]Features:[/bold]
• Automatic caching
• Rate limiting
• Error handling
• Variable substitution

Select a service to see available operations."""
        elif step_type == "transform":
            help_text = """[bold cyan]Transform Step[/bold cyan]

Transform data between steps.

[bold]Operations:[/bold]
• [cyan]markdown_to_json[/cyan]: Parse markdown to JSON
• [cyan]extract_fields[/cyan]: Extract specific fields
• [cyan]filter[/cyan]: Filter data by criteria
• [cyan]map[/cyan]: Transform array elements

[bold]Configuration:[/bold]
• [cyan]Operation[/cyan]: Which transformation to apply
• [cyan]Input[/cyan]: Source data path
• [cyan]Config[/cyan]: Operation-specific settings

[bold]Use Cases:[/bold]
• Format conversion
• Data extraction
• Data filtering
• Data restructuring"""

        if help_text:
            content.mount(Static(help_text.strip()))
        else:
            self.show_default_help()

    def show_metadata_help(self) -> None:
        """Show help for workflow metadata editing."""
        self.current_context = "metadata"

        content = self.query_one("#help-content", Vertical)
        content.remove_children()

        help_text = """[bold cyan]Workflow Metadata[/bold cyan]

Configure general workflow settings.

[bold]Fields:[/bold]

• [cyan]Name[/cyan]: Unique workflow identifier
  Used when loading workflows programmatically

• [cyan]Version[/cyan]: Semantic versioning (e.g., 1.0.0)
  Increment when making changes

• [cyan]Description[/cyan]: Human-readable description
  Helps document what the workflow does

• [cyan]Timeout[/cyan]: Maximum execution time (seconds)
  Prevents runaway workflows

• [cyan]Default Error Mode[/cyan]: How to handle errors
  - [yellow]fail[/yellow]: Stop workflow on error
  - [yellow]continue[/yellow]: Log error and continue
  - [yellow]retry[/yellow]: Retry with backoff

[bold]Best Practices:[/bold]
• Use descriptive names
• Document purpose in description
• Set realistic timeouts
• Use fail mode for critical steps"""

        content.mount(Static(help_text.strip()))
