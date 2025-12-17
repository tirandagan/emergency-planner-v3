"""
Mermaid Diagram Generator - Generate visual workflow diagrams using LLM

Generates Mermaid flowchart syntax from workflow JSON using Claude.
The LLM analyzes the workflow structure and creates a beautiful diagram.
"""

import json
import asyncio
from pathlib import Path
from typing import Dict, Any
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich import print as rprint

from app.workflows.schema import Workflow
from app.services import get_llm_provider
from app.config import settings


console = Console()


DIAGRAM_PROMPT = """You are a workflow visualization expert. Generate a Mermaid flowchart diagram from the following workflow JSON.

WORKFLOW JSON:
```json
{workflow_json}
```

REQUIREMENTS:
1. Use Mermaid flowchart syntax (flowchart TD or LR)
2. Show all steps with clear labels
3. Include step types in parentheses (e.g., "Fetch Data (external_api)")
4. Show dependencies with arrows
5. Use different node shapes for different step types:
   - LLM steps: rounded boxes ((text))
   - Transform steps: trapezoids [/text\\]
   - External API steps: stadium-shaped ([text])
   - Conditional steps: diamonds {text}
6. Color-code by step type using classDef
7. Add a legend explaining colors and shapes

OUTPUT ONLY THE MERMAID CODE - no explanation, no markdown code blocks, just the raw Mermaid syntax.

Example format:
flowchart TD
    A[Start] --> B((LLM Step))
    B --> C[/Transform\\]
    C --> D([External API])

    classDef llmStyle fill:#e1f5ff,stroke:#2196f3
    classDef transformStyle fill:#fff3e0,stroke:#ff9800
    classDef apiStyle fill:#e8f5e9,stroke:#4caf50

    class B llmStyle
    class C transformStyle
    class D apiStyle
"""


class MermaidDiagramGenerator:
    """Generate Mermaid diagrams using LLM"""

    def __init__(self, workflow_path: Path):
        """
        Initialize diagram generator

        Args:
            workflow_path: Path to workflow JSON file
        """
        self.workflow_path = workflow_path
        self.workflow: Workflow | None = None
        self.workflow_json: str = ""

    async def generate(self) -> str | None:
        """
        Generate Mermaid diagram

        Returns:
            Mermaid diagram code or None if failed
        """
        console.print(f"\n[bold cyan]Generating diagram for:[/bold cyan] {self.workflow_path.name}")
        console.print("━" * 80)

        # Load workflow
        if not self._load_workflow():
            return None

        # Display workflow info
        self._display_workflow_info()

        # Generate diagram using LLM
        console.print("\n[cyan]🤖 Calling LLM to generate diagram...[/cyan]")
        diagram_code = await self._call_llm()

        if diagram_code:
            console.print("\n[bold green]✓ Diagram generated successfully[/bold green]")
            return diagram_code
        else:
            console.print("\n[bold red]✗ Failed to generate diagram[/bold red]")
            return None

    def _load_workflow(self) -> bool:
        """Load and validate workflow"""
        try:
            with open(self.workflow_path, 'r') as f:
                self.workflow_json = f.read()
                workflow_data = json.loads(self.workflow_json)

            self.workflow = Workflow(**workflow_data)
            return True
        except Exception as e:
            console.print(f"[red]Failed to load workflow: {str(e)}[/red]")
            return False

    def _display_workflow_info(self) -> None:
        """Display workflow metadata"""
        if not self.workflow:
            return

        console.print(f"\n[bold]Workflow:[/bold] {self.workflow.name} (v{self.workflow.version})")
        console.print(f"[bold]Steps:[/bold] {len(self.workflow.steps)}")

        # Count step types
        from collections import Counter
        step_types = Counter(step.type.value for step in self.workflow.steps)
        console.print(f"[bold]Step Types:[/bold]")
        for step_type, count in step_types.items():
            console.print(f"  - {step_type}: {count}")

    async def _call_llm(self) -> str | None:
        """Call LLM to generate diagram"""
        try:
            # Get LLM provider
            provider = get_llm_provider(settings.LLM_PROVIDER)

            # Build prompt
            prompt = DIAGRAM_PROMPT.format(workflow_json=self.workflow_json)

            # Call LLM
            response = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model=settings.LLM_MODEL,
                temperature=0.3,  # Lower temperature for more consistent output
                max_tokens=2000
            )

            # Extract diagram code
            diagram_code = response.content.strip()

            # Remove markdown code blocks if present
            if diagram_code.startswith("```"):
                lines = diagram_code.split('\n')
                # Remove first and last lines (```)
                diagram_code = '\n'.join(lines[1:-1])

            # Display cost
            console.print(f"\n[dim]LLM Usage: {response.usage.total_tokens} tokens, ${response.cost_usd:.4f}[/dim]")

            return diagram_code

        except Exception as e:
            console.print(f"[red]LLM error: {str(e)}[/red]")
            return None


async def generate_diagram_async(workflow_path: str, output_path: str | None = None) -> None:
    """
    Generate Mermaid diagram from workflow

    Args:
        workflow_path: Path to workflow JSON file
        output_path: Optional path to save diagram (defaults to <workflow>.mmd)
    """
    generator = MermaidDiagramGenerator(Path(workflow_path))
    diagram_code = await generator.generate()

    if diagram_code:
        # Display diagram
        console.print("\n[bold cyan]Generated Mermaid Diagram:[/bold cyan]")
        console.print(Panel(diagram_code, border_style="green"))

        # Save to file
        if not output_path:
            workflow_stem = Path(workflow_path).stem
            output_path = f"workflows/diagrams/{workflow_stem}.mmd"

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            f.write(diagram_code)

        console.print(f"\n[green]✓ Diagram saved to {output_file}[/green]")

        # Instructions
        console.print("\n[bold cyan]How to view:[/bold cyan]")
        console.print("1. Copy the diagram code above")
        console.print("2. Visit https://mermaid.live/")
        console.print("3. Paste the code to see the visual diagram")
        console.print(f"4. Or open {output_file} with a Mermaid viewer\n")


def generate_diagram(workflow_path: str, output_path: str | None = None) -> None:
    """
    Generate Mermaid diagram (synchronous wrapper)

    Args:
        workflow_path: Path to workflow JSON file
        output_path: Optional path to save diagram
    """
    asyncio.run(generate_diagram_async(workflow_path, output_path))


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        console.print("[red]Usage: python -m cli.diagram <workflow.json> [output.mmd][/red]")
        sys.exit(1)

    workflow_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    generate_diagram(workflow_path, output_path)
