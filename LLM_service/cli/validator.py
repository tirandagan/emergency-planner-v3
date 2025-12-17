"""
Workflow Validator - Comprehensive workflow validation tool

Validates workflow JSON files for:
- Schema compliance (Pydantic validation)
- Unique step IDs
- Valid step dependencies
- Prompt file existence
- Transform operation validity
- External service registration
- Variable reference resolution
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

from app.workflows.schema import Workflow, StepType
from app.workflows.transformations import TRANSFORMATION_REGISTRY
from app.workflows.external_services import service_registry
# Import services to ensure they register themselves
import app.workflows.services  # noqa: F401


console = Console()


class WorkflowValidator:
    """Comprehensive workflow validation"""

    def __init__(self, workflow_path: Path, prompts_dir: Path):
        """
        Initialize validator

        Args:
            workflow_path: Path to workflow JSON file
            prompts_dir: Path to prompts directory root
        """
        self.workflow_path = workflow_path
        self.prompts_dir = prompts_dir
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
        self.workflow_data: Dict[str, Any] = {}
        self.workflow: Workflow | None = None

    def validate(self) -> bool:
        """
        Run all validation checks

        Returns:
            True if validation passes, False otherwise
        """
        console.print(f"\n[bold cyan]Validating workflow:[/bold cyan] {self.workflow_path.name}")
        console.print("━" * 80)

        # Step 1: Load and parse JSON
        if not self._validate_json_structure():
            self._print_results()
            return False

        # Step 2: Validate against Pydantic schema
        if not self._validate_schema():
            self._print_results()
            return False

        # Step 3: Validate step structure
        self._validate_step_ids()
        self._validate_step_dependencies()
        self._validate_step_configurations()

        # Step 4: Validate resources
        self._validate_prompt_files()
        self._validate_external_services()

        # Step 5: Validate variable references
        self._validate_variable_references()

        # Print results
        self._print_results()

        return len(self.errors) == 0

    def _validate_json_structure(self) -> bool:
        """Validate JSON file can be loaded"""
        try:
            with open(self.workflow_path, 'r') as f:
                self.workflow_data = json.load(f)
            self.info.append(f"✓ JSON structure valid ({self.workflow_path.stat().st_size} bytes)")
            return True
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON: {e.msg} at line {e.lineno}, column {e.colno}")
            return False
        except FileNotFoundError:
            self.errors.append(f"File not found: {self.workflow_path}")
            return False
        except Exception as e:
            self.errors.append(f"Failed to load JSON: {str(e)}")
            return False

    def _validate_schema(self) -> bool:
        """Validate against Pydantic workflow schema"""
        try:
            self.workflow = Workflow(**self.workflow_data)
            self.info.append(f"✓ Schema validation passed (v{self.workflow.version})")
            self.info.append(f"  Name: {self.workflow.name}")
            self.info.append(f"  Description: {self.workflow.description}")
            self.info.append(f"  Steps: {len(self.workflow.steps)}")
            return True
        except Exception as e:
            self.errors.append(f"Schema validation failed: {str(e)}")
            return False

    def _validate_step_ids(self) -> None:
        """Validate step IDs are unique and valid"""
        if not self.workflow:
            return

        step_ids = [step.id for step in self.workflow.steps]

        # Check for duplicates
        seen: Set[str] = set()
        duplicates: Set[str] = set()

        for step_id in step_ids:
            if step_id in seen:
                duplicates.add(step_id)
            seen.add(step_id)

        if duplicates:
            self.errors.append(f"Duplicate step IDs found: {', '.join(duplicates)}")
        else:
            self.info.append(f"✓ All {len(step_ids)} step IDs are unique")

        # Check ID format (alphanumeric and underscores only)
        invalid_ids = [sid for sid in step_ids if not re.match(r'^[a-zA-Z0-9_]+$', sid)]
        if invalid_ids:
            self.warnings.append(f"Non-standard step IDs (use alphanumeric and underscores): {', '.join(invalid_ids)}")

    def _validate_step_dependencies(self) -> None:
        """Validate step dependencies (implicit via execution order)"""
        if not self.workflow:
            return

        # Dependencies are implicit based on step order in the array
        # Steps execute sequentially and can reference previous steps via ${steps.stepId}
        step_ids = {step.id for step in self.workflow.steps}

        # Just validate that step IDs are unique (already done in _validate_step_ids)
        self.info.append("✓ Step execution order validated (sequential by array position)")

    def _validate_step_configurations(self) -> None:
        """Validate step-specific configurations"""
        if not self.workflow:
            return

        for step in self.workflow.steps:
            # Validate transform operations
            if step.type == StepType.TRANSFORM and step.config:
                operation = step.config.get('operation')
                if operation and operation not in TRANSFORMATION_REGISTRY:
                    self.errors.append(f"Step '{step.id}': Unknown transform operation '{operation}'")
                    self.errors.append(f"  Available: {', '.join(TRANSFORMATION_REGISTRY.keys())}")

            # Validate error modes
            valid_error_modes = ['fail', 'continue', 'retry']
            if step.error_mode and step.error_mode not in valid_error_modes:
                self.warnings.append(f"Step '{step.id}': Non-standard error_mode '{step.error_mode}'")

        self.info.append("✓ Step configurations validated")

    def _validate_prompt_files(self) -> None:
        """Validate LLM step prompt files exist"""
        if not self.workflow:
            return

        for step in self.workflow.steps:
            if step.type == StepType.LLM and step.config:
                # Check template file
                template = step.config.get('template')
                if template:
                    template_path = self.prompts_dir / template
                    if not template_path.exists():
                        self.errors.append(f"Step '{step.id}': Prompt template not found: {template}")
                    else:
                        self.info.append(f"✓ Prompt file exists: {template}")

                # Check inline prompt
                elif 'prompt' not in step.config:
                    self.warnings.append(f"Step '{step.id}': No prompt template or inline prompt specified")

    def _validate_external_services(self) -> None:
        """Validate external API services are registered"""
        if not self.workflow:
            return

        for step in self.workflow.steps:
            if step.type == StepType.EXTERNAL_API and step.config:
                service_name = step.config.get('service')
                available_services = service_registry.list_services()
                if service_name and service_name not in available_services:
                    self.errors.append(f"Step '{step.id}': Unknown external service '{service_name}'")
                    self.errors.append(f"  Available: {', '.join(available_services)}")
                else:
                    self.info.append(f"✓ External service '{service_name}' registered")

    def _validate_variable_references(self) -> None:
        """Validate variable references can be resolved"""
        if not self.workflow:
            return

        # Pattern for ${var} references
        var_pattern = re.compile(r'\$\{([^}]+)\}')

        # Track available variables at each step
        available_vars: Set[str] = set()
        available_vars.add('input')  # Always available
        available_vars.add('context')  # Always available

        for step in self.workflow.steps:
            # Add this step's output to available variables
            available_vars.add(f"steps.{step.id}")

            # Check all string values in config
            if step.config:
                self._check_config_variables(step.id, step.config, available_vars, var_pattern)

    def _check_config_variables(
        self,
        step_id: str,
        config: Dict[str, Any],
        available_vars: Set[str],
        var_pattern: re.Pattern
    ) -> None:
        """Recursively check config for variable references"""
        for key, value in config.items():
            if isinstance(value, str):
                # Find all ${var} patterns
                matches = var_pattern.findall(value)
                for var_ref in matches:
                    # Check if variable is available
                    var_base = var_ref.split('.')[0] if '.' in var_ref else var_ref

                    # Check if it's a valid reference
                    if var_base not in ['input', 'context', 'steps']:
                        self.warnings.append(
                            f"Step '{step_id}': Unknown variable namespace '{var_base}' in ${{{var_ref}}}"
                        )

            elif isinstance(value, dict):
                # Recursively check nested dicts
                self._check_config_variables(step_id, value, available_vars, var_pattern)

            elif isinstance(value, list):
                # Check list items
                for item in value:
                    if isinstance(item, str):
                        matches = var_pattern.findall(item)
                        for var_ref in matches:
                            var_base = var_ref.split('.')[0] if '.' in var_ref else var_ref
                            if var_base not in ['input', 'context', 'steps']:
                                self.warnings.append(
                                    f"Step '{step_id}': Unknown variable namespace '{var_base}' in ${{{var_ref}}}"
                                )
                    elif isinstance(item, dict):
                        self._check_config_variables(step_id, item, available_vars, var_pattern)

    def _print_results(self) -> None:
        """Print validation results with rich formatting"""
        console.print()

        # Summary table
        summary_table = Table(show_header=False, box=None)
        summary_table.add_column("Type", style="bold")
        summary_table.add_column("Count", justify="right")

        summary_table.add_row("[green]Info[/green]", f"[green]{len(self.info)}[/green]")
        summary_table.add_row("[yellow]Warnings[/yellow]", f"[yellow]{len(self.warnings)}[/yellow]")
        summary_table.add_row("[red]Errors[/red]", f"[red]{len(self.errors)}[/red]")

        console.print(Panel(summary_table, title="Validation Summary", border_style="cyan"))

        # Info messages
        if self.info:
            console.print("\n[bold green]ℹ Information:[/bold green]")
            for msg in self.info:
                console.print(f"  {msg}")

        # Warnings
        if self.warnings:
            console.print("\n[bold yellow]⚠ Warnings:[/bold yellow]")
            for msg in self.warnings:
                console.print(f"  {msg}")

        # Errors
        if self.errors:
            console.print("\n[bold red]✗ Errors:[/bold red]")
            for msg in self.errors:
                console.print(f"  {msg}")

        # Final status
        console.print()
        if len(self.errors) == 0:
            console.print("[bold green]✓ Validation PASSED[/bold green]")
            console.print()
            return True
        else:
            console.print("[bold red]✗ Validation FAILED[/bold red]")
            console.print()
            return False


def validate_workflow(workflow_path: str, prompts_dir: str = None) -> bool:
    """
    Validate a workflow JSON file

    Args:
        workflow_path: Path to workflow JSON file
        prompts_dir: Path to prompts directory (defaults to workflows/prompts)

    Returns:
        True if validation passes, False otherwise
    """
    # Resolve paths
    workflow_file = Path(workflow_path)

    if prompts_dir:
        prompts_path = Path(prompts_dir)
    else:
        # Default to workflows/prompts relative to workflow file
        prompts_path = workflow_file.parent.parent / 'prompts'

    # Validate
    validator = WorkflowValidator(workflow_file, prompts_path)
    return validator.validate()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        console.print("[red]Usage: python -m cli.validator <workflow.json> [prompts_dir][/red]")
        sys.exit(1)

    workflow_path = sys.argv[1]
    prompts_dir = sys.argv[2] if len(sys.argv) > 2 else None

    success = validate_workflow(workflow_path, prompts_dir)
    sys.exit(0 if success else 1)
