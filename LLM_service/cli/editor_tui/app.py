"""
Workflow Editor TUI Application

Modern terminal UI for creating and editing LLM workflow JSON files.

Features:
- Visual workflow tree with all steps
- Real-time validation
- Undo/redo support
- Keyboard shortcuts
- Pre-populated editing
"""

import json
from pathlib import Path
from typing import Optional, Dict, Any

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Static
from textual.binding import Binding
from textual.widgets._tree import Tree

from .models.editor_state import EditorState
from .models.action_history import ActionHistory
from .models.settings import EditorSettings
from .widgets.workflow_tree import WorkflowTree
from .widgets.metadata_panel import MetadataPanel, MetadataChanged
from .widgets.step_edit_panel import StepEditPanel
from .widgets.input_manage_panel import InputManagePanel
from .widgets.context_help_panel import ContextHelpPanel
from .screens.file_browser import FileBrowserScreen
from .screens.settings_screen import SettingsScreen

# Import validation from existing CLI
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.workflows.schema import Workflow, validate_workflow_json


class WorkflowEditorApp(App):
    """
    Modern TUI workflow editor with visual navigation

    Features:
    - Tree view of all workflow steps
    - Metadata editing panel
    - Step details display
    - Real-time validation
    - Undo/redo (Ctrl+Z/Ctrl+Y)
    - Save (Ctrl+S)
    """

    CSS = """
    /* Main layout */
    #main-container {
        layout: horizontal;
        height: 100%;
    }

    /* Left panel - Tree */
    #left-panel {
        width: 35%;
        border-right: solid $primary;
    }

    /* Center panel - Details */
    #center-panel {
        width: 45%;
        border-right: solid $primary;
    }

    /* Right panel - Validation */
    #right-panel {
        width: 20%;
    }

    /* Panel headers */
    .panel-header {
        background: $boost;
        padding: 1;
        margin-bottom: 1;
    }

    /* Form styling */
    .form-row {
        height: auto;
        margin: 1 0;
    }

    .form-label {
        width: 15;
        content-align: right middle;
        padding-right: 1;
    }

    .form-input {
        width: 1fr;
    }

    /* Step details */
    .step-detail-item {
        margin: 0 1;
    }

    .step-detail-section {
        margin: 1 0;
    }

    .step-detail-spacer {
        height: 1;
    }

    .step-detail-json {
        margin: 0 2;
        color: $text-muted;
    }

    /* Validation */
    .validation-error {
        margin: 0 1;
        padding: 0 1;
    }

    .validation-success {
        margin: 1;
        color: $success;
    }

    /* Status bar */
    #status-bar {
        dock: bottom;
        height: 1;
        background: $panel;
        color: $text;
        padding: 0 1;
    }
    """

    BINDINGS = [
        Binding("ctrl+o", "open_file", "Open", priority=True),
        Binding("ctrl+s", "save", "Save", priority=True),
        Binding("ctrl+z", "undo", "Undo", priority=True),
        Binding("ctrl+y", "redo", "Redo", priority=True),
        Binding("ctrl+comma", "settings", "Settings", priority=True),
        Binding("ctrl+q", "quit", "Quit", priority=True),
        Binding("f1", "help", "Help"),
    ]

    def __init__(self, workflow_path: Optional[Path] = None):
        """
        Initialize editor app

        Args:
            workflow_path: Optional path to existing workflow to edit
        """
        super().__init__()
        self.workflow_path = workflow_path
        self.state = EditorState()
        self.action_history = ActionHistory()
        self.settings = EditorSettings.load()  # Load settings from config
        self.current_view = "default"  # Track what's shown in center panel

        # Load workflow if path provided
        if workflow_path and workflow_path.exists():
            self._load_workflow_from_path(workflow_path)

    def compose(self) -> ComposeResult:
        """Create application layout"""
        yield Header()

        with Container(id="main-container"):
            # Left: Workflow tree
            with Vertical(id="left-panel"):
                yield WorkflowTree("Workflow", id="workflow-tree")

            # Center: Dynamic panel (metadata or step edit)
            with Vertical(id="center-panel"):
                # Will be populated dynamically based on tree selection
                yield Static("[dim]Select an item from the tree to edit[/dim]", id="center-placeholder")

            # Right: Contextual help
            with Vertical(id="right-panel"):
                yield ContextHelpPanel(id="help-panel")

        # Status bar
        yield Static("Ready", id="status-bar")
        yield Footer()

    def on_mount(self) -> None:
        """Initialize UI after mounting"""
        # Set title
        workflow_name = self.state.workflow.get("name", "Untitled")
        self.title = f"Workflow Editor - {workflow_name}"

        # Load initial data into widgets
        self._refresh_all_widgets()

        # Initial validation
        self._validate_workflow()

    def _refresh_all_widgets(self) -> None:
        """Refresh all widgets with current state"""
        # Update tree
        tree = self.query_one("#workflow-tree", WorkflowTree)
        tree.load_workflow(self.state.workflow, self.state.validation_errors)

        # Update center panel if showing metadata or step
        if self.current_view == "metadata":
            try:
                metadata_panel = self.query_one("#metadata-panel", MetadataPanel)
                metadata_panel.load_metadata(self.state.workflow)
            except:
                pass
        elif self.current_view == "step" and self.state.selected_step_index >= 0:
            try:
                step_edit = self.query_one("#step-edit-panel", StepEditPanel)
                step = self.state.get_selected_step()
                step_edit.load_step(step, self.state.selected_step_index)
            except:
                pass

        # Update status bar
        self._update_status_bar()

    def _update_status_bar(self) -> None:
        """Update status bar text"""
        status_bar = self.query_one("#status-bar", Static)

        # Build status message
        parts = []

        # File status
        if self.state.workflow_path:
            filename = Path(self.state.workflow_path).name
            parts.append(f"📄 {filename}")
        else:
            parts.append("📄 New Workflow")

        # Unsaved changes
        if self.state.unsaved_changes:
            parts.append("[yellow]●[/yellow] Modified")

        # Undo/redo availability
        if self.action_history.can_undo():
            parts.append(f"↶ {self.action_history.get_undo_description()}")
        if self.action_history.can_redo():
            parts.append(f"↷ {self.action_history.get_redo_description()}")

        # Step count
        step_count = len(self.state.workflow.get("steps", []))
        parts.append(f"📝 {step_count} steps")

        status_bar.update(" | ".join(parts))

    def _validate_workflow(self) -> None:
        """Validate current workflow and update validation panel"""
        errors = []

        try:
            # Basic validation
            workflow_data = self.state.workflow

            # Check required fields
            if not workflow_data.get("name"):
                errors.append({
                    "severity": "error",
                    "message": "Workflow name is required"
                })

            # Validate steps
            for i, step in enumerate(workflow_data.get("steps", [])):
                step_id = step.get("id")
                if not step_id:
                    errors.append({
                        "severity": "error",
                        "message": "Step ID is required",
                        "step_index": i
                    })
                elif not self.state.validate_step_id_unique(step_id, i):
                    errors.append({
                        "severity": "error",
                        "message": f"Duplicate step ID: {step_id}",
                        "step_id": step_id,
                        "step_index": i
                    })

            # Try Pydantic validation
            try:
                validate_workflow_json(workflow_data)
            except Exception as e:
                errors.append({
                    "severity": "error",
                    "message": f"Schema validation failed: {str(e)}"
                })

        except Exception as e:
            errors.append({
                "severity": "error",
                "message": f"Validation error: {str(e)}"
            })

        # Update state and help panel
        self.state.validation_errors = errors
        help_panel = self.query_one("#help-panel", ContextHelpPanel)
        help_panel.show_validation_errors(errors)

    def on_tree_node_selected(self, event: Tree.NodeSelected) -> None:
        """Handle step selection in tree - dynamically update center panel"""
        tree = self.query_one("#workflow-tree", WorkflowTree)
        center_panel = self.query_one("#center-panel", Vertical)
        help_panel = self.query_one("#help-panel", ContextHelpPanel)

        # Check if metadata node or step node was selected
        node_data = event.node.data if hasattr(event.node, 'data') else None

        if isinstance(node_data, dict) and node_data.get("type") == "metadata":
            # Show metadata panel
            self._show_metadata_panel(center_panel, help_panel)
        elif isinstance(node_data, dict) and node_data.get("type") == "inputs_header":
            # Show input management panel
            self._show_inputs_panel(center_panel, help_panel)
        else:
            # Check if it's a step
            step_index = tree.get_selected_step_index()
            if step_index is not None:
                # Show step edit panel
                self.state.selected_step_index = step_index
                step = self.state.get_selected_step()
                self._show_step_panel(center_panel, help_panel, step, step_index)
            else:
                # Unknown selection - show placeholder
                self._show_placeholder(center_panel, help_panel)

    def _show_metadata_panel(self, container: Vertical, help_panel: ContextHelpPanel) -> None:
        """Show metadata editing panel in center."""
        # Remove existing content
        container.remove_children()

        # Mount metadata panel with workflow data
        metadata_panel = MetadataPanel(workflow=self.state.workflow, id="metadata-panel")
        container.mount(metadata_panel)

        # Update help panel
        help_panel.show_metadata_help()

        # Track current view
        self.current_view = "metadata"

    def _show_step_panel(self, container: Vertical, help_panel: ContextHelpPanel, step: Dict[str, Any], step_index: int) -> None:
        """Show step editing panel in center."""
        # Remove existing content
        container.remove_children()

        # Mount step edit panel with step data
        step_edit = StepEditPanel(step=step, step_index=step_index, id="step-edit-panel")
        container.mount(step_edit)

        # Update help panel based on step type
        step_type = step.get("type", "llm")
        help_panel.show_step_type_help(step_type)

        # Track current view
        self.current_view = "step"

    def _show_inputs_panel(self, container: Vertical, help_panel: ContextHelpPanel) -> None:
        """Show input management panel in center."""
        # Remove existing content
        container.remove_children()

        # Mount input management panel with workflow data
        inputs_panel = InputManagePanel(workflow=self.state.workflow, id="inputs-panel")
        container.mount(inputs_panel)

        # Update help panel
        help_panel.show_inputs_help()

        # Track current view
        self.current_view = "inputs"

    def _show_placeholder(self, container: Vertical, help_panel: ContextHelpPanel) -> None:
        """Show placeholder message in center."""
        container.remove_children()
        container.mount(Static("[dim]Select an item from the tree to edit[/dim]", id="center-placeholder"))
        help_panel.show_default_help()
        self.current_view = "default"

    def on_metadata_changed(self, message: MetadataChanged) -> None:
        """Handle metadata field changes"""
        # Record action for undo/redo
        before_snapshot = self.state.get_snapshot()

        # Update workflow data
        self.state.workflow[message.field] = message.value
        self.state.unsaved_changes = True

        after_snapshot = self.state.get_snapshot()
        self.action_history.record_action(
            f"Update {message.field}",
            before_snapshot,
            after_snapshot
        )

        # Update title if name changed
        if message.field == "name":
            self.title = f"Workflow Editor - {message.value or 'Untitled'}"

        # Revalidate and refresh
        self._validate_workflow()
        self._refresh_all_widgets()

    def on_step_edit_panel_step_changed(self, message: StepEditPanel.StepChanged) -> None:
        """Handle step configuration changes from edit panel"""
        # Record action for undo/redo
        before_snapshot = self.state.get_snapshot()

        # Update step in workflow
        steps = self.state.workflow.get("steps", [])
        if 0 <= message.step_index < len(steps):
            steps[message.step_index] = message.step_data
            self.state.unsaved_changes = True

            after_snapshot = self.state.get_snapshot()
            self.action_history.record_action(
                f"Update step {message.step_data.get('id', 'unknown')}",
                before_snapshot,
                after_snapshot
            )

            # Revalidate and refresh
            self._validate_workflow()
            self._refresh_all_widgets()

            self.notify("✓ Step updated", severity="information")

    def on_step_edit_panel_selection_changed(self, message: StepEditPanel.SelectionChanged) -> None:
        """Handle selection changes in step edit panel - update contextual help"""
        help_panel = self.query_one("#help-panel", ContextHelpPanel)

        if message.selection_type == "service":
            help_panel.show_service_help(message.selection_value)
        elif message.selection_type == "operation":
            # Need to get current service from step edit panel
            try:
                step_edit = self.query_one("#step-edit-panel", StepEditPanel)
                if step_edit.selected_service:
                    help_panel.show_operation_help(step_edit.selected_service, message.selection_value)
            except:
                pass
        elif message.selection_type == "step_type":
            help_panel.show_step_type_help(message.selection_value)

    def on_input_manage_panel_input_changed(self, message: InputManagePanel.InputChanged) -> None:
        """Handle input changes from input management panel"""
        import re

        # Record action for undo/redo
        before_snapshot = self.state.get_snapshot()

        # Update workflow inputs
        self.state.workflow["inputs"] = message.inputs
        self.state.unsaved_changes = True

        # Handle input rename - propagate to all step references
        if message.renamed:
            old_name, new_name = message.renamed
            self._propagate_input_rename(old_name, new_name)

        after_snapshot = self.state.get_snapshot()
        self.action_history.record_action(
            f"Update workflow inputs",
            before_snapshot,
            after_snapshot
        )

        # Revalidate and refresh
        self._validate_workflow()
        self._refresh_all_widgets()

        self.notify("✓ Inputs updated", severity="information")

    def _propagate_input_rename(self, old_name: str, new_name: str) -> None:
        """
        Propagate input rename across all step references.

        Args:
            old_name: Old input name
            new_name: New input name
        """
        import json
        import re

        # Pattern to find ${input.old_name}
        pattern = re.compile(re.escape(f"${{input.{old_name}}}"))

        # Convert workflow to JSON string
        workflow_str = json.dumps(self.state.workflow)

        # Replace all occurrences
        updated_str = pattern.sub(f"${{input.{new_name}}}", workflow_str)

        # Parse back to dict
        self.state.workflow = json.loads(updated_str)

    def action_save(self) -> None:
        """Save workflow to file"""
        try:
            # Get save path
            if not self.state.workflow_path:
                # Auto-generate path in configured workflow folder
                name = self.state.workflow.get("name", "untitled")
                name = name.replace(" ", "_").lower()
                workflow_folder = self.settings.get_workflow_folder_path()
                save_path = workflow_folder / f"{name}.json"
            else:
                save_path = Path(self.state.workflow_path)

            # Ensure directory exists
            save_path.parent.mkdir(parents=True, exist_ok=True)

            # Save workflow
            with open(save_path, 'w') as f:
                json.dump(self.state.workflow, f, indent=2)

            self.state.workflow_path = str(save_path)
            self.state.unsaved_changes = False

            # Add to recent files
            self.settings.add_recent_file(str(save_path))
            self.settings.save()

            self.notify(f"✓ Saved to {save_path}", severity="information")
            self._update_status_bar()

        except Exception as e:
            self.notify(f"✗ Save failed: {str(e)}", severity="error")

    def action_undo(self) -> None:
        """Undo last action"""
        snapshot = self.action_history.undo()
        if snapshot:
            self.state.restore_snapshot(snapshot)
            self._validate_workflow()
            self._refresh_all_widgets()
            self.notify("↶ Undo", severity="information")
        else:
            self.notify("Nothing to undo", severity="warning")

    def action_redo(self) -> None:
        """Redo next action"""
        snapshot = self.action_history.redo()
        if snapshot:
            self.state.restore_snapshot(snapshot)
            self._validate_workflow()
            self._refresh_all_widgets()
            self.notify("↷ Redo", severity="information")
        else:
            self.notify("Nothing to redo", severity="warning")

    def action_open_file(self) -> None:
        """Show file browser to open workflow"""
        workflow_folder = self.settings.get_workflow_folder_path()

        # Create file browser screen
        def handle_file_selection(result):
            if result:
                self._load_workflow_from_path(result)

        self.push_screen(
            FileBrowserScreen(workflow_folder, self.settings.recent_files),
            handle_file_selection
        )

    def action_settings(self) -> None:
        """Show settings screen"""
        def handle_settings_saved(result):
            if result:
                self.settings = result
                self.notify("✓ Settings saved", severity="information")

        self.push_screen(SettingsScreen(self.settings), handle_settings_saved)

    def _load_workflow_from_path(self, workflow_path: Path) -> None:
        """
        Load workflow from file path

        Args:
            workflow_path: Path to workflow JSON file
        """
        try:
            with open(workflow_path, 'r') as f:
                self.state.workflow = json.load(f)
                self.state.workflow_path = str(workflow_path)
                self.state.unsaved_changes = False
                self.workflow_path = workflow_path

            # Add to recent files
            self.settings.add_recent_file(str(workflow_path))
            self.settings.save()

            # Update UI
            workflow_name = self.state.workflow.get("name", "Untitled")
            self.title = f"Workflow Editor - {workflow_name}"
            self._validate_workflow()
            self._refresh_all_widgets()

            self.notify(f"✓ Loaded {workflow_path.name}", severity="information")

        except Exception as e:
            self.notify(f"✗ Failed to load workflow: {str(e)}", severity="error")

    def action_help(self) -> None:
        """Show help screen"""
        help_text = """
[bold cyan]Workflow Editor - Keyboard Shortcuts[/bold cyan]

[bold]File Operations:[/bold]
  Ctrl+O    Open workflow
  Ctrl+S    Save workflow
  Ctrl+,    Settings
  Ctrl+Q    Quit editor

[bold]Editing:[/bold]
  Ctrl+Z    Undo last action
  Ctrl+Y    Redo action

[bold]Navigation:[/bold]
  ↑/↓       Navigate tree
  Enter     Expand/collapse node

[bold]Help:[/bold]
  F1        Show this help
        """
        self.notify(help_text.strip(), timeout=10)


def run_editor(workflow_path: Optional[str] = None) -> None:
    """
    Launch workflow editor TUI

    Args:
        workflow_path: Optional path to existing workflow file
    """
    path = Path(workflow_path) if workflow_path else None
    app = WorkflowEditorApp(path)
    app.run()


if __name__ == "__main__":
    import sys
    workflow_path = sys.argv[1] if len(sys.argv) > 1 else None
    run_editor(workflow_path)
