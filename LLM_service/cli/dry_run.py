"""
Dry-Run Executor - Preview workflow execution without API calls

Simulates workflow execution to show:
- Execution order
- Variable resolution
- Step dependencies
- Resource usage estimates
- Cost estimates
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from rich.console import Console
from rich.table import Table
from rich.tree import Tree
from rich.panel import Panel
from rich import print as rprint

from app.workflows.schema import Workflow, StepType
from app.services.cost_calculator import CostCalculator


console = Console()
cost_calculator = CostCalculator()


class DryRunExecutor:
    """Simulate workflow execution without API calls"""

    def __init__(self, workflow_path: Path, input_data: Dict[str, Any] = None):
        """
        Initialize dry-run executor

        Args:
            workflow_path: Path to workflow JSON file
            input_data: Input data for workflow context
        """
        self.workflow_path = workflow_path
        self.input_data = input_data or {}
        self.workflow: Workflow | None = None

    def execute(self) -> None:
        """Execute dry-run simulation"""
        console.print(f"\n[bold cyan]Dry-Run Execution:[/bold cyan] {self.workflow_path.name}")
        console.print("━" * 80)

        # Load workflow
        if not self._load_workflow():
            return

        # Display workflow info
        self._display_workflow_info()

        # Display execution plan
        self._display_execution_plan()

        # Display variable flow
        self._display_variable_flow()

        # Display resource estimates
        self._display_resource_estimates()

        # Display cost estimates
        self._display_cost_estimates()

        console.print("\n[bold green]✓ Dry-run complete - No API calls were made[/bold green]\n")

    def _load_workflow(self) -> bool:
        """Load and validate workflow"""
        try:
            with open(self.workflow_path, 'r') as f:
                workflow_data = json.load(f)
            self.workflow = Workflow(**workflow_data)
            return True
        except Exception as e:
            console.print(f"[red]Failed to load workflow: {str(e)}[/red]")
            return False

    def _display_workflow_info(self) -> None:
        """Display workflow metadata"""
        if not self.workflow:
            return

        info_table = Table(show_header=False, box=None, padding=(0, 2))
        info_table.add_column("Property", style="bold cyan")
        info_table.add_column("Value")

        info_table.add_row("Name", self.workflow.name)
        info_table.add_row("Version", self.workflow.version)
        info_table.add_row("Description", self.workflow.description or "N/A")
        info_table.add_row("Steps", str(len(self.workflow.steps)))
        info_table.add_row("Timeout", f"{self.workflow.timeout_seconds}s")

        console.print(Panel(info_table, title="Workflow Information", border_style="cyan"))

    def _display_execution_plan(self) -> None:
        """Display step-by-step execution plan"""
        if not self.workflow:
            return

        console.print("\n[bold cyan]Execution Plan:[/bold cyan]")

        # Create execution tree
        tree = Tree("🎯 Workflow Execution", guide_style="cyan")

        for idx, step in enumerate(self.workflow.steps, 1):
            # Step info
            step_label = f"[bold]{idx}. {step.id}[/bold] ({step.type.value})"

            step_branch = tree.add(step_label)

            # Add config details
            if step.config:
                config_details = self._format_step_config(step.type, step.config)
                for detail in config_details:
                    step_branch.add(f"[dim]{detail}[/dim]")

            # Add error handling
            if step.error_mode:
                step_branch.add(f"[yellow]⚠ Error mode: {step.error_mode}[/yellow]")

        console.print(tree)

    def _format_step_config(self, step_type: StepType, config: Dict[str, Any]) -> List[str]:
        """Format step configuration details"""
        details = []

        if step_type == StepType.LLM:
            if 'model' in config:
                details.append(f"🤖 Model: {config['model']}")
            if 'template' in config:
                details.append(f"📄 Template: {config['template']}")
            elif 'prompt' in config:
                prompt_preview = config['prompt'][:60] + "..." if len(config['prompt']) > 60 else config['prompt']
                details.append(f"💬 Prompt: {prompt_preview}")

        elif step_type == StepType.TRANSFORM:
            if 'operation' in config:
                details.append(f"🔄 Operation: {config['operation']}")
            if 'input' in config:
                details.append(f"📥 Input: {config['input']}")

        elif step_type == StepType.EXTERNAL_API:
            if 'service' in config:
                details.append(f"🌐 Service: {config['service']}")
            if 'operation' in config:
                details.append(f"⚡ Operation: {config['operation']}")

        return details

    def _display_variable_flow(self) -> None:
        """Display variable availability at each step"""
        if not self.workflow:
            return

        console.print("\n[bold cyan]Variable Flow:[/bold cyan]")

        # Track available variables
        available = ["input", "context"]

        flow_table = Table(show_header=True)
        flow_table.add_column("Step", style="bold")
        flow_table.add_column("Produces", style="green")
        flow_table.add_column("Available After", style="cyan")

        for step in self.workflow.steps:
            produces = f"steps.{step.id}"
            available.append(produces)

            flow_table.add_row(
                step.id,
                produces,
                ", ".join(available[-3:]) + ("..." if len(available) > 3 else "")
            )

        console.print(flow_table)

    def _display_resource_estimates(self) -> None:
        """Display estimated resource usage"""
        if not self.workflow:
            return

        # Count step types
        llm_steps = sum(1 for s in self.workflow.steps if s.type == StepType.LLM)
        api_steps = sum(1 for s in self.workflow.steps if s.type == StepType.EXTERNAL_API)
        transform_steps = sum(1 for s in self.workflow.steps if s.type == StepType.TRANSFORM)

        resource_table = Table(show_header=True)
        resource_table.add_column("Resource", style="bold")
        resource_table.add_column("Count", justify="right", style="cyan")
        resource_table.add_column("Estimate", style="yellow")

        resource_table.add_row("LLM API Calls", str(llm_steps), f"~{llm_steps * 3}s" if llm_steps else "N/A")
        resource_table.add_row("External API Calls", str(api_steps), f"~{api_steps * 0.5}s" if api_steps else "N/A")
        resource_table.add_row("Transformations", str(transform_steps), "<0.1s" if transform_steps else "N/A")

        # Total time estimate
        total_time = (llm_steps * 3) + (api_steps * 0.5)
        resource_table.add_row(
            "[bold]Total Duration[/bold]",
            "",
            f"[bold]~{total_time:.1f}s[/bold]"
        )

        console.print("\n[bold cyan]Resource Estimates:[/bold cyan]")
        console.print(resource_table)

    def _display_cost_estimates(self) -> None:
        """Display estimated costs for LLM calls"""
        if not self.workflow:
            return

        llm_steps = [s for s in self.workflow.steps if s.type == StepType.LLM]

        if not llm_steps:
            return

        console.print("\n[bold cyan]Cost Estimates:[/bold cyan]")

        cost_table = Table(show_header=True)
        cost_table.add_column("Step", style="bold")
        cost_table.add_column("Model", style="cyan")
        cost_table.add_column("Est. Tokens", justify="right", style="yellow")
        cost_table.add_column("Est. Cost", justify="right", style="green")

        total_tokens = 0
        total_cost = 0.0

        for step in llm_steps:
            model = step.config.get('model', 'anthropic/claude-3.5-sonnet')

            # Rough token estimate based on prompt
            estimated_tokens = 2000  # Conservative estimate

            # Get model pricing
            pricing = cost_calculator.get_model_pricing(model)

            if pricing:
                # Assume 50/50 input/output split for estimate
                est_cost = cost_calculator.calculate(
                    model=model,
                    input_tokens=estimated_tokens // 2,
                    output_tokens=estimated_tokens // 2
                )
                total_cost += est_cost
                total_tokens += estimated_tokens

                cost_table.add_row(
                    step.id,
                    model.split('/')[-1],  # Show model name only
                    f"{estimated_tokens:,}",
                    f"${est_cost:.4f}"
                )
            else:
                cost_table.add_row(
                    step.id,
                    model.split('/')[-1],
                    "Unknown",
                    "Unknown"
                )

        # Total row
        if total_cost > 0:
            cost_table.add_row(
                "[bold]Total[/bold]",
                "",
                f"[bold]{total_tokens:,}[/bold]",
                f"[bold]${total_cost:.4f}[/bold]"
            )

        console.print(cost_table)
        console.print(f"\n[dim]Note: Token estimates are conservative. Actual costs may vary.[/dim]")


def dry_run_workflow(workflow_path: str, input_data: Dict[str, Any] = None) -> None:
    """
    Execute dry-run simulation of a workflow

    Args:
        workflow_path: Path to workflow JSON file
        input_data: Optional input data for context
    """
    executor = DryRunExecutor(Path(workflow_path), input_data)
    executor.execute()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        console.print("[red]Usage: python -m cli.dry_run <workflow.json> [input.json][/red]")
        sys.exit(1)

    workflow_path = sys.argv[1]

    # Load input data if provided
    input_data = {}
    if len(sys.argv) > 2:
        try:
            with open(sys.argv[2], 'r') as f:
                input_data = json.load(f)
        except Exception as e:
            console.print(f"[yellow]Warning: Failed to load input data: {e}[/yellow]")

    dry_run_workflow(workflow_path, input_data)
