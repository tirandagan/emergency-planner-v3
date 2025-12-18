"""
Input Management Panel - Manage Workflow Input Parameters

Provides interface for adding, editing, and deleting workflow inputs with:
- Input name, type, description
- Required/optional flag
- Default values for optional inputs
- Rename propagation to step references
"""

from typing import Dict, Any, Optional, List
from textual.app import ComposeResult
from textual.containers import Vertical, Horizontal, ScrollableContainer
from textual.widgets import Static, Input, Label, Button, Select, Switch
from textual.message import Message
import re
import json


class InputManagePanel(ScrollableContainer):
    """
    Panel for managing workflow input parameters.

    Features:
    - Add new inputs
    - Edit existing inputs (name, type, description)
    - Delete inputs
    - Rename propagation across all step references
    """

    class InputChanged(Message):
        """Message sent when inputs are modified."""
        def __init__(self, inputs: List[Dict[str, Any]], renamed: Optional[tuple] = None) -> None:
            """
            Args:
                inputs: Updated list of input definitions
                renamed: Optional tuple of (old_name, new_name) if an input was renamed
            """
            self.inputs = inputs
            self.renamed = renamed
            super().__init__()

    def __init__(self, workflow: Optional[Dict[str, Any]] = None, **kwargs):
        """
        Initialize input management panel.

        Args:
            workflow: Optional workflow data to load inputs from
            **kwargs: Additional arguments for ScrollableContainer
        """
        super().__init__(**kwargs)
        self._workflow_data = workflow
        self._current_inputs: List[Dict[str, Any]] = []
        self._editing_index: Optional[int] = None

    def on_mount(self) -> None:
        """Load workflow inputs after widgets are mounted."""
        if self._workflow_data:
            self.call_after_refresh(self.load_inputs, self._workflow_data)

    def compose(self) -> ComposeResult:
        """Create input management layout."""
        yield Static("[bold cyan]Workflow Inputs[/bold cyan]", classes="panel-header")
        yield Vertical(id="input-manage-container")

    def load_inputs(self, workflow: Dict[str, Any]) -> None:
        """
        Load workflow inputs and display management interface.

        Args:
            workflow: Workflow dictionary with inputs
        """
        # Get inputs from workflow, or infer from ${input.xxx} references
        self._current_inputs = workflow.get("inputs", [])

        # If no explicit inputs defined, infer from step references
        if not self._current_inputs:
            inferred = self._infer_inputs_from_steps(workflow)
            self._current_inputs = inferred

        self._refresh_display()

    def _infer_inputs_from_steps(self, workflow: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Infer input definitions from step configurations.

        Args:
            workflow: Workflow dictionary

        Returns:
            List of inferred input definitions
        """
        input_names = set()
        pattern = re.compile(r'\$\{input\.([^}]+)\}')

        # Convert workflow to string and search
        workflow_str = json.dumps(workflow)
        matches = pattern.findall(workflow_str)
        input_names.update(matches)

        # Create basic input definitions
        return [
            {
                "name": name,
                "type": "string",
                "description": f"Input parameter: {name}",
                "required": True
            }
            for name in sorted(input_names)
        ]

    def _refresh_display(self) -> None:
        """Refresh the input list display."""
        container = self.query_one("#input-manage-container", Vertical)
        container.remove_children()

        # Show input list
        container.mount(Static("[bold]Defined Inputs:[/bold]"))

        if not self._current_inputs:
            container.mount(Static("[dim]No inputs defined. Click 'Add Input' to create one.[/dim]"))
        else:
            for idx, input_def in enumerate(self._current_inputs):
                self._add_input_display(container, input_def, idx)

        # Add new input button
        add_btn = Button("+ Add Input", variant="success", id="btn-add-input")
        container.mount(add_btn)

        # If editing an input, show edit form
        if self._editing_index is not None:
            container.mount(Static("─" * 50))
            self._show_edit_form(container, self._editing_index)

    def _add_input_display(self, container: Vertical, input_def: Dict[str, Any], index: int) -> None:
        """Add input display item to container."""
        name = input_def.get("name", "unnamed")
        type_str = input_def.get("type", "string")
        required = input_def.get("required", True)
        desc = input_def.get("description", "")

        # Build display text
        required_badge = "[red]required[/red]" if required else "[dim]optional[/dim]"
        display = f"[cyan]{name}[/cyan] ({type_str}) {required_badge}"
        if desc:
            display += f"\n  [dim]{desc}[/dim]"

        # Create horizontal row and mount to container
        row = Horizontal(classes="input-item")
        container.mount(row)

        # Mount widgets to the horizontal row
        row.mount(Static(display))
        edit_btn = Button("Edit", variant="primary", id=f"btn-edit-{index}")
        row.mount(edit_btn)
        delete_btn = Button("Delete", variant="error", id=f"btn-delete-{index}")
        row.mount(delete_btn)

    def _show_edit_form(self, container: Vertical, index: int) -> None:
        """Show edit form for input at index."""
        input_def = self._current_inputs[index]

        container.mount(Static(f"[bold]Editing Input: {input_def.get('name', 'unnamed')}[/bold]"))

        # Name input
        container.mount(Static("[bold]Name:[/bold]"))
        name_input = Input(
            value=input_def.get("name", ""),
            placeholder="input_name",
            id="edit-input-name"
        )
        container.mount(name_input)

        # Type selector
        container.mount(Static("[bold]Type:[/bold]"))
        type_select = Select(
            [
                ("String", "string"),
                ("Number", "number"),
                ("Boolean", "boolean"),
                ("Object", "object"),
                ("Array", "array"),
            ],
            value=input_def.get("type", "string"),
            id="edit-input-type"
        )
        container.mount(type_select)

        # Description
        container.mount(Static("[bold]Description:[/bold]"))
        desc_input = Input(
            value=input_def.get("description", ""),
            placeholder="What this input represents...",
            id="edit-input-description"
        )
        container.mount(desc_input)

        # Required checkbox
        container.mount(Static("[bold]Required:[/bold]"))
        required_switch = Switch(
            value=input_def.get("required", True),
            id="edit-input-required"
        )
        container.mount(required_switch)

        # Default value (for optional inputs)
        container.mount(Static("[bold]Default Value:[/bold] (optional inputs only)"))
        default_input = Input(
            value=str(input_def.get("default", "")) if input_def.get("default") is not None else "",
            placeholder="Default value if not provided",
            id="edit-input-default"
        )
        container.mount(default_input)

        # Action buttons
        button_row = Horizontal()
        container.mount(button_row)
        save_btn = Button("Save Changes", variant="success", id="btn-save-edit")
        button_row.mount(save_btn)
        cancel_btn = Button("Cancel", variant="default", id="btn-cancel-edit")
        button_row.mount(cancel_btn)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button clicks."""
        button_id = event.button.id

        if button_id == "btn-add-input":
            # Add new input
            self._current_inputs.append({
                "name": f"new_input_{len(self._current_inputs) + 1}",
                "type": "string",
                "description": "",
                "required": True
            })
            self._editing_index = len(self._current_inputs) - 1
            self._refresh_display()

        elif button_id and button_id.startswith("btn-edit-"):
            # Edit existing input
            index = int(button_id.split("-")[-1])
            self._editing_index = index
            self._refresh_display()

        elif button_id and button_id.startswith("btn-delete-"):
            # Delete input
            index = int(button_id.split("-")[-1])
            deleted_name = self._current_inputs[index].get("name")
            del self._current_inputs[index]
            self._editing_index = None
            self._refresh_display()
            # Post message with updated inputs
            self.post_message(self.InputChanged(self._current_inputs))

        elif button_id == "btn-save-edit":
            # Save edited input
            if self._editing_index is not None:
                self._save_current_edit()

        elif button_id == "btn-cancel-edit":
            # Cancel editing
            self._editing_index = None
            self._refresh_display()

    def _save_current_edit(self) -> None:
        """Save currently edited input."""
        if self._editing_index is None:
            return

        try:
            # Get form values
            name_input = self.query_one("#edit-input-name", Input)
            type_select = self.query_one("#edit-input-type", Select)
            desc_input = self.query_one("#edit-input-description", Input)
            required_switch = self.query_one("#edit-input-required", Switch)
            default_input = self.query_one("#edit-input-default", Input)

            old_name = self._current_inputs[self._editing_index].get("name")
            new_name = name_input.value

            # Update input definition
            updated_input = {
                "name": new_name,
                "type": type_select.value,
                "description": desc_input.value,
                "required": required_switch.value
            }

            # Add default value if provided and not required
            if not required_switch.value and default_input.value:
                updated_input["default"] = default_input.value

            self._current_inputs[self._editing_index] = updated_input
            self._editing_index = None
            self._refresh_display()

            # Post message with updated inputs and rename info
            renamed = (old_name, new_name) if old_name != new_name else None
            self.post_message(self.InputChanged(self._current_inputs, renamed))

        except Exception as e:
            # Handle errors
            print(f"Error saving input: {e}")
