"""
Interactive Workflow Editor - Create and modify workflows interactively

Features:
- Create new workflows from scratch
- Add/edit/remove steps
- Configure step parameters
- Real-time validation
- Save workflows to JSON
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import questionary
from questionary import Style
from rich.console import Console
from rich.panel import Panel
from rich import print as rprint

from app.workflows.schema import StepType
from app.workflows.transformations import TRANSFORMATION_REGISTRY
from app.workflows.external_services import service_registry
# Import services to ensure they register themselves
import app.workflows.services  # noqa: F401


console = Console()

# Custom style for questionary
custom_style = Style([
    ('qmark', 'fg:#673ab7 bold'),
    ('question', 'bold'),
    ('answer', 'fg:#2196f3 bold'),
    ('pointer', 'fg:#673ab7 bold'),
    ('highlighted', 'fg:#673ab7 bold'),
    ('selected', 'fg:#4caf50'),
    ('separator', 'fg:#cc5454'),
    ('instruction', ''),
    ('text', ''),
])


class WorkflowEditor:
    """Interactive workflow editor"""

    def __init__(self, workflow_path: Optional[Path] = None):
        """
        Initialize editor

        Args:
            workflow_path: Optional path to existing workflow to edit
        """
        self.workflow_path = workflow_path
        self.workflow_data: Dict[str, Any] = {
            "name": "",
            "version": "1.0.0",
            "description": "",
            "steps": [],
            "timeout": 300
        }

        # Load existing workflow if provided
        if workflow_path and workflow_path.exists():
            with open(workflow_path, 'r') as f:
                self.workflow_data = json.load(f)

    def run(self) -> None:
        """Run interactive editor"""
        console.print("\n[bold cyan]━━━ Workflow Editor ━━━[/bold cyan]\n")

        if not self.workflow_data.get('name'):
            self._setup_metadata()

        while True:
            action = self._main_menu()

            if action == "Edit Metadata":
                self._setup_metadata()
            elif action == "Add Step":
                self._add_step()
            elif action == "Edit Step":
                self._edit_step()
            elif action == "Remove Step":
                self._remove_step()
            elif action == "View Workflow":
                self._view_workflow()
            elif action == "Save Workflow":
                self._save_workflow()
            elif action == "Exit":
                break

        console.print("\n[bold green]✓ Editor closed[/bold green]\n")

    def _main_menu(self) -> str:
        """Display main menu"""
        choices = [
            "Edit Metadata",
            "Add Step",
            "Edit Step" if self.workflow_data['steps'] else questionary.Choice("Edit Step", disabled="No steps"),
            "Remove Step" if self.workflow_data['steps'] else questionary.Choice("Remove Step", disabled="No steps"),
            "View Workflow",
            "Save Workflow",
            "Exit"
        ]

        return questionary.select(
            f"Workflow: {self.workflow_data.get('name', 'Untitled')} (v{self.workflow_data.get('version', '1.0.0')})",
            choices=choices,
            style=custom_style
        ).ask()

    def _setup_metadata(self) -> None:
        """Setup workflow metadata"""
        console.print("\n[bold cyan]Workflow Metadata[/bold cyan]")

        self.workflow_data['name'] = questionary.text(
            "Workflow name:",
            default=self.workflow_data.get('name', ''),
            style=custom_style
        ).ask()

        self.workflow_data['version'] = questionary.text(
            "Version:",
            default=self.workflow_data.get('version', '1.0.0'),
            style=custom_style
        ).ask()

        self.workflow_data['description'] = questionary.text(
            "Description (optional):",
            default=self.workflow_data.get('description', ''),
            style=custom_style
        ).ask()

        self.workflow_data['timeout'] = int(questionary.text(
            "Timeout (seconds):",
            default=str(self.workflow_data.get('timeout', 300)),
            validate=lambda x: x.isdigit(),
            style=custom_style
        ).ask())

        console.print("[green]✓ Metadata updated[/green]\n")

    def _add_step(self) -> None:
        """Add a new step to workflow"""
        console.print("\n[bold cyan]Add Step[/bold cyan]")

        step_id = questionary.text(
            "Step ID (unique identifier):",
            validate=lambda x: len(x) > 0 and x not in [s['id'] for s in self.workflow_data['steps']],
            style=custom_style
        ).ask()

        step_type = questionary.select(
            "Step type:",
            choices=[t.value for t in StepType],
            style=custom_style
        ).ask()

        description = questionary.text(
            "Description (optional):",
            style=custom_style
        ).ask()

        # Configure step based on type
        config = {}
        if step_type == "llm":
            config = self._configure_llm_step()
        elif step_type == "transform":
            config = self._configure_transform_step()
        elif step_type == "external_api":
            config = self._configure_external_api_step()

        # Error mode
        error_mode = questionary.select(
            "Error handling mode:",
            choices=["fail", "continue", "retry"],
            default="fail",
            style=custom_style
        ).ask()

        # Create step
        step = {
            "id": step_id,
            "type": step_type,
            "config": config,
            "error_mode": error_mode
        }

        # Note: Dependencies are implicit based on step order in the array
        # Steps execute sequentially and can reference previous steps via ${steps.stepId}

        self.workflow_data['steps'].append(step)
        console.print(f"[green]✓ Step '{step_id}' added[/green]\n")

    def _configure_llm_step(self) -> Dict[str, Any]:
        """Configure LLM step"""
        use_template = questionary.confirm(
            "Use prompt template file?",
            default=True,
            style=custom_style
        ).ask()

        config = {}

        if use_template:
            config['template'] = questionary.text(
                "Prompt template path (relative to prompts/):",
                style=custom_style
            ).ask()
        else:
            config['prompt'] = questionary.text(
                "Inline prompt:",
                multiline=True,
                style=custom_style
            ).ask()

        config['model'] = questionary.select(
            "Model:",
            choices=[
                "anthropic/claude-3.5-sonnet",
                "anthropic/claude-opus-4",
                "anthropic/claude-3-haiku",
                "openai/gpt-4o",
                "openai/gpt-4o-mini"
            ],
            default="anthropic/claude-3.5-sonnet",
            style=custom_style
        ).ask()

        config['temperature'] = float(questionary.text(
            "Temperature (0.0-1.0):",
            default="0.7",
            validate=lambda x: x.replace('.', '').isdigit(),
            style=custom_style
        ).ask())

        config['max_tokens'] = int(questionary.text(
            "Max tokens:",
            default="4000",
            validate=lambda x: x.isdigit(),
            style=custom_style
        ).ask())

        return config

    def _configure_transform_step(self) -> Dict[str, Any]:
        """Configure transform step"""
        operation = questionary.select(
            "Transformation operation:",
            choices=list(TRANSFORMATION_REGISTRY.keys()),
            style=custom_style
        ).ask()

        input_ref = questionary.text(
            "Input reference (e.g., ${steps.previous_step}):",
            style=custom_style
        ).ask()

        config = {
            "operation": operation,
            "config": {
                "input": input_ref
            }
        }

        # Operation-specific configuration
        if operation == "template":
            template = questionary.text(
                "Template string (use ${var} for variables):",
                multiline=True,
                style=custom_style
            ).ask()
            config['config']['template'] = template

        elif operation == "extract_fields":
            fields = questionary.text(
                "Fields to extract (comma-separated):",
                style=custom_style
            ).ask()
            config['config']['fields'] = [f.strip() for f in fields.split(',')]

        elif operation == "filter":
            field = questionary.text(
                "Field to filter on:",
                style=custom_style
            ).ask()
            operator = questionary.select(
                "Operator:",
                choices=["==", "!=", ">", "<", ">=", "<=", "contains"],
                style=custom_style
            ).ask()
            value = questionary.text(
                "Value:",
                style=custom_style
            ).ask()
            config['config']['condition'] = f"{field} {operator} {value}"

        return config

    def _configure_external_api_step(self) -> Dict[str, Any]:
        """Configure external API step"""
        service = questionary.select(
            "External service:",
            choices=service_registry.list_services(),
            style=custom_style
        ).ask()

        # Get available operations (simplified - would need to query service)
        operation = questionary.text(
            "Operation (e.g., nearby_search, current):",
            style=custom_style
        ).ask()

        config = {
            "service": service,
            "operation": operation,
            "params": {}
        }

        # Add parameters
        add_params = questionary.confirm(
            "Add parameters?",
            default=True,
            style=custom_style
        ).ask()

        if add_params:
            while True:
                param_name = questionary.text(
                    "Parameter name (or 'done'):",
                    style=custom_style
                ).ask()

                if param_name.lower() == 'done':
                    break

                param_value = questionary.text(
                    f"Value for {param_name}:",
                    style=custom_style
                ).ask()

                config['params'][param_name] = param_value

        return config

    def _edit_step(self) -> None:
        """Edit an existing step"""
        if not self.workflow_data['steps']:
            console.print("[yellow]No steps to edit[/yellow]\n")
            return

        step_id = questionary.select(
            "Select step to edit:",
            choices=[s['id'] for s in self.workflow_data['steps']],
            style=custom_style
        ).ask()

        # Find step
        step_idx = next(i for i, s in enumerate(self.workflow_data['steps']) if s['id'] == step_id)

        # Remove and re-add (simpler than editing in place)
        self.workflow_data['steps'].pop(step_idx)
        console.print(f"[cyan]Re-configuring step '{step_id}'...[/cyan]\n")
        self._add_step()

    def _remove_step(self) -> None:
        """Remove a step"""
        if not self.workflow_data['steps']:
            console.print("[yellow]No steps to remove[/yellow]\n")
            return

        step_id = questionary.select(
            "Select step to remove:",
            choices=[s['id'] for s in self.workflow_data['steps']],
            style=custom_style
        ).ask()

        confirm = questionary.confirm(
            f"Remove step '{step_id}'?",
            default=False,
            style=custom_style
        ).ask()

        if confirm:
            self.workflow_data['steps'] = [s for s in self.workflow_data['steps'] if s['id'] != step_id]
            console.print(f"[green]✓ Step '{step_id}' removed[/green]\n")

    def _view_workflow(self) -> None:
        """View current workflow as JSON"""
        console.print("\n[bold cyan]Current Workflow:[/bold cyan]")
        json_str = json.dumps(self.workflow_data, indent=2)
        console.print(Panel(json_str, border_style="cyan"))
        console.print()

    def _save_workflow(self) -> None:
        """Save workflow to file"""
        if not self.workflow_path:
            filename = questionary.text(
                "Filename (e.g., my_workflow.json):",
                style=custom_style
            ).ask()
            self.workflow_path = Path("workflows/definitions") / filename

        # Ensure directory exists
        self.workflow_path.parent.mkdir(parents=True, exist_ok=True)

        # Save
        with open(self.workflow_path, 'w') as f:
            json.dump(self.workflow_data, f, indent=2)

        console.print(f"[green]✓ Workflow saved to {self.workflow_path}[/green]\n")


def edit_workflow(workflow_path: Optional[str] = None) -> None:
    """
    Launch interactive workflow editor

    Args:
        workflow_path: Optional path to existing workflow
    """
    editor = WorkflowEditor(Path(workflow_path) if workflow_path else None)
    editor.run()


if __name__ == "__main__":
    import sys

    workflow_path = sys.argv[1] if len(sys.argv) > 1 else None
    edit_workflow(workflow_path)
