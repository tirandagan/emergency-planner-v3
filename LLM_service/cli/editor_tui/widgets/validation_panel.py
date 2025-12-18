"""
Validation Panel - Real-Time Error Display

Shows validation errors and warnings with:
- Severity indicators
- Error messages
- Affected steps
- Scrollable list
"""

from textual.app import ComposeResult
from textual.containers import Vertical, VerticalScroll
from textual.widgets import Static, Label
from typing import List, Dict, Any


class ValidationPanel(Vertical):
    """
    Panel displaying validation errors and warnings

    Features:
    - Real-time validation feedback
    - Severity-based color coding
    - Scrollable error list
    - Clear error messages
    """

    def compose(self) -> ComposeResult:
        """Create validation panel layout"""
        yield Static("✓ [bold green]Validation[/bold green]", classes="panel-header", id="validation-header")
        yield VerticalScroll(id="validation-list")

    def update_validation(self, errors: List[Dict[str, Any]]) -> None:
        """
        Update validation panel with current errors

        Args:
            errors: List of validation error dictionaries with keys:
                - severity: "error" | "warning" | "info"
                - message: Error message
                - step_id: Optional step identifier
                - step_index: Optional step index
        """
        error_list = self.query_one("#validation-list", VerticalScroll)
        error_list.remove_children()

        if not errors:
            # No errors - show success
            header = self.query_one("#validation-header", Static)
            header.update("✓ [bold green]Validation Passed[/bold green]")
            error_list.mount(Label("[green]No errors found[/green]", classes="validation-success"))
            return

        # Has errors - update header
        error_count = sum(1 for e in errors if e.get("severity") == "error")
        warning_count = sum(1 for e in errors if e.get("severity") == "warning")

        header_text = "❌ [bold red]Validation Failed[/bold red]"
        if error_count == 0 and warning_count > 0:
            header_text = "⚠️  [bold yellow]Warnings[/bold yellow]"

        header = self.query_one("#validation-header", Static)
        header.update(header_text)

        # Add error messages
        for error in errors:
            severity = error.get("severity", "error")
            message = error.get("message", "Unknown error")
            step_id = error.get("step_id")
            step_index = error.get("step_index")

            # Format message with severity and step info
            if severity == "error":
                icon = "❌"
                style = "red"
            elif severity == "warning":
                icon = "⚠️"
                style = "yellow"
            else:
                icon = "ℹ️"
                style = "blue"

            if step_id:
                label_text = f"{icon} [{style}]{step_id}:[/{style}] {message}"
            elif step_index is not None:
                label_text = f"{icon} [{style}]Step {step_index}:[/{style}] {message}"
            else:
                label_text = f"{icon} [{style}]{message}[/{style}]"

            error_list.mount(Label(label_text, classes="validation-error"))

    def clear_errors(self) -> None:
        """Clear all validation errors"""
        self.update_validation([])
