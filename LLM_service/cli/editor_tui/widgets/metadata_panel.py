"""
Metadata Panel - Workflow-Level Configuration

Editable panel for workflow metadata including:
- Name
- Version
- Description
- Timeout
"""

from textual.app import ComposeResult
from textual.containers import Vertical, Horizontal
from textual.widgets import Static, Input, Label
from textual.message import Message
from typing import Dict, Any, Optional


class MetadataChanged(Message):
    """Message sent when metadata is changed"""

    def __init__(self, field: str, value: Any) -> None:
        self.field = field
        self.value = value
        super().__init__()


class MetadataPanel(Vertical):
    """
    Panel for editing workflow metadata

    Provides form fields for:
    - Workflow name
    - Version string
    - Description
    - Timeout (seconds)
    """

    def __init__(self, workflow: Optional[Dict[str, Any]] = None, **kwargs):
        """
        Initialize metadata panel.

        Args:
            workflow: Optional workflow data to load on mount
            **kwargs: Additional arguments for Vertical container
        """
        super().__init__(**kwargs)
        self._workflow_data = workflow

    def on_mount(self) -> None:
        """Load workflow data after widgets are mounted."""
        if self._workflow_data:
            # Defer loading until after widgets are fully ready
            self.call_after_refresh(self.load_metadata, self._workflow_data)

    def compose(self) -> ComposeResult:
        """Create metadata form fields"""
        yield Static("📋 [bold cyan]Workflow Metadata[/bold cyan]", classes="panel-header")

        with Horizontal(classes="form-row"):
            yield Label("Name:", classes="form-label")
            yield Input(
                placeholder="my_workflow",
                id="metadata-name",
                classes="form-input"
            )

        with Horizontal(classes="form-row"):
            yield Label("Version:", classes="form-label")
            yield Input(
                placeholder="1.0.0",
                id="metadata-version",
                classes="form-input"
            )

        with Horizontal(classes="form-row"):
            yield Label("Description:", classes="form-label")
            yield Input(
                placeholder="Workflow description (optional)",
                id="metadata-description",
                classes="form-input"
            )

        with Horizontal(classes="form-row"):
            yield Label("Timeout (s):", classes="form-label")
            yield Input(
                placeholder="300",
                id="metadata-timeout",
                classes="form-input",
                type="integer"
            )

    def load_metadata(self, workflow: Dict[str, Any]) -> None:
        """
        Load workflow metadata into form fields

        Args:
            workflow: Workflow dictionary with metadata
        """
        name_input = self.query_one("#metadata-name", Input)
        name_input.value = workflow.get("name", "")

        version_input = self.query_one("#metadata-version", Input)
        version_input.value = workflow.get("version", "1.0.0")

        desc_input = self.query_one("#metadata-description", Input)
        desc_input.value = workflow.get("description", "")

        timeout_input = self.query_one("#metadata-timeout", Input)
        timeout_input.value = str(workflow.get("timeout_seconds", 300))

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get current metadata values from form

        Returns:
            Dictionary with workflow metadata
        """
        name_input = self.query_one("#metadata-name", Input)
        version_input = self.query_one("#metadata-version", Input)
        desc_input = self.query_one("#metadata-description", Input)
        timeout_input = self.query_one("#metadata-timeout", Input)

        timeout_value = 300
        try:
            timeout_value = int(timeout_input.value) if timeout_input.value else 300
        except ValueError:
            pass

        return {
            "name": name_input.value,
            "version": version_input.value,
            "description": desc_input.value,
            "timeout_seconds": timeout_value
        }

    def on_input_changed(self, event: Input.Changed) -> None:
        """Handle input field changes"""
        if event.input.id == "metadata-name":
            self.post_message(MetadataChanged("name", event.value))
        elif event.input.id == "metadata-version":
            self.post_message(MetadataChanged("version", event.value))
        elif event.input.id == "metadata-description":
            self.post_message(MetadataChanged("description", event.value))
        elif event.input.id == "metadata-timeout":
            try:
                timeout = int(event.value) if event.value else 300
                self.post_message(MetadataChanged("timeout_seconds", timeout))
            except ValueError:
                pass  # Invalid timeout, ignore
