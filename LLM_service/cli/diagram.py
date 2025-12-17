"""
Mermaid Diagram Generator - Generate visual workflow diagrams using LLM

Generates Mermaid flowchart syntax from workflow JSON using Claude.
The LLM analyzes the workflow structure and creates a beautiful diagram.
"""

import json
import asyncio
import base64
import zlib
from pathlib import Path
from typing import Dict, Any
from io import BytesIO
import httpx
from PIL import Image
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.text import Text
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.columns import Columns
from rich import print as rprint

from app.workflows.schema import Workflow
from app.services import get_llm_provider, Message
from app.config import settings


console = Console()


DIAGRAM_PROMPT = """You are a workflow visualization expert. Generate a Mermaid flowchart diagram from the following workflow JSON.

WORKFLOW JSON:
```json
{workflow_json}
```

REQUIREMENTS:
1. Use Mermaid flowchart syntax (flowchart TD or LR)
2. Show all steps with clear labels - IMPORTANT: Use ONLY alphanumeric characters, spaces, and underscores in labels
3. DO NOT use HTML tags like <br/> - use simple text labels only
4. Include step type in parentheses after the step name (e.g., "Fetch Weather (external_api)")
5. Show dependencies with arrows
6. Use different node shapes for different step types:
   - LLM steps: rounded boxes ((text))
   - Transform steps: trapezoids [/text\\]
   - External API steps: stadium-shaped ([text])
   - Conditional steps: diamonds {{text}}
7. Color-code by step type using classDef
8. Keep node labels concise (under 40 characters)

OUTPUT ONLY THE MERMAID CODE - no explanation, no markdown code blocks, just the raw Mermaid syntax.

Example format:
flowchart TD
    A[Start] --> B((Generate Analysis))
    B --> C[/Transform Data\\]
    C --> D([Call External API])

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
        # Load workflow
        if not self._load_workflow():
            return None

        # Display workflow info in a clean panel
        self._display_workflow_info()

        # Generate diagram using LLM with progress indicator
        diagram_code = await self._call_llm()

        return diagram_code

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
        """Display workflow metadata in a compact format"""
        if not self.workflow:
            return

        # Count step types
        from collections import Counter
        step_types = Counter(step.type.value for step in self.workflow.steps)

        # Create compact info display
        console.print(
            f"\n[cyan]Workflow[/cyan] [bold]{self.workflow.name}[/bold] [dim]v{self.workflow.version}[/dim]  "
            f"[dim]│[/dim]  [cyan]{len(self.workflow.steps)}[/cyan] steps  "
            f"[dim]│[/dim]  " +
            " ".join([f"[dim]{st}[/dim] [cyan]{ct}[/cyan]" for st, ct in sorted(step_types.items())])
        )
        console.print()

    async def _call_llm(self) -> str | None:
        """Call LLM to generate diagram"""
        try:
            # Get LLM provider
            provider = get_llm_provider("openrouter")

            # Build prompt
            prompt = DIAGRAM_PROMPT.format(workflow_json=self.workflow_json)

            # Call LLM with progress indicator
            with Progress(
                SpinnerColumn(),
                TextColumn("[cyan]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Generating diagram with Claude...", total=None)

                response = await provider.generate(
                    messages=[Message(role="user", content=prompt)],
                    model="anthropic/claude-3.5-sonnet",
                    temperature=0.3,
                    max_tokens=2000
                )

            # Extract diagram code
            diagram_code = response.content.strip()

            # Remove markdown code blocks if present
            if diagram_code.startswith("```"):
                lines = diagram_code.split('\n')
                diagram_code = '\n'.join(lines[1:-1])

            # Display success with compact metrics
            console.print(
                f"[green]✓[/green] Diagram generated  "
                f"[dim]│[/dim]  {response.usage.total_tokens:,} tokens  "
                f"[dim]│[/dim]  ${response.cost_usd:.4f}  "
                f"[dim]│[/dim]  Claude 3.5 Sonnet"
            )

            return diagram_code

        except Exception as e:
            console.print(f"[red]✗[/red] Generation failed  [dim]│[/dim]  {str(e)}")
            return None


async def generate_png_from_mermaid(diagram_code: str, output_path: Path, background: str = 'white') -> bool:
    """
    Generate image from Mermaid diagram code using Kroki API.

    Kroki is an open-source diagram rendering service that supports Mermaid
    and handles larger diagrams using compressed payloads.

    For white backgrounds, uses JPEG format (no transparency support).
    For transparent backgrounds, uses PNG format.

    Args:
        diagram_code: Mermaid diagram syntax
        output_path: Path to save image file
        background: Background color ('white' or 'transparent')

    Returns:
        True if successful, False otherwise
    """
    try:
        # Compress and encode diagram for Kroki API
        # Kroki expects: base64(zlib(diagram_code))
        compressed = zlib.compress(diagram_code.encode('utf-8'), level=9)
        encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')

        # Always download as PNG from Kroki (Mermaid doesn't support JPEG)
        api_url = f"https://kroki.io/mermaid/png/{encoded}"

        # Download PNG with progress indicator
        with Progress(
            SpinnerColumn(),
            TextColumn("[cyan]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Rendering PNG image...", total=None)

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(api_url)
                response.raise_for_status()
                png_data = response.content

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Process image based on background preference
        if background == 'white':
            # Composite transparent PNG onto white background
            img = Image.open(BytesIO(png_data))

            # Create white background
            if img.mode in ('RGBA', 'LA'):
                background_img = Image.new('RGB', img.size, (255, 255, 255))
                # Paste PNG onto white background using alpha channel as mask
                if img.mode == 'RGBA':
                    background_img.paste(img, (0, 0), img.split()[3])
                else:
                    background_img.paste(img, (0, 0), img.split()[1])
                img = background_img

            # Save as PNG with white background
            img.save(output_path, 'PNG', optimize=True)
            bytes_written = output_path.stat().st_size

        else:  # transparent
            # Save PNG as-is
            with open(output_path, 'wb') as f:
                bytes_written = f.write(png_data)

        # Display success with compact file info
        bg_icon = "⬜" if background == 'white' else "▢"
        console.print(
            f"[green]✓[/green] PNG saved  "
            f"[dim]│[/dim]  {bytes_written:,} bytes  "
            f"[dim]│[/dim]  {bg_icon} {background}  "
            f"[dim]│[/dim]  [blue]{output_path}[/blue]"
        )
        console.print()

        return True

    except Exception as e:
        console.print(f"\n[red]✗[/red] PNG generation failed  [dim]│[/dim]  {str(e)}\n")
        return False


async def generate_diagram_async(workflow_path: str, output_path: str | None = None, background: str = 'white') -> None:
    """
    Generate diagram image from workflow

    Args:
        workflow_path: Path to workflow JSON file
        output_path: Optional path to save image file (defaults to workflows/diagrams/<workflow>.jpg for white, .png for transparent)
        background: Background color ('white' or 'transparent')
    """
    generator = MermaidDiagramGenerator(Path(workflow_path))
    diagram_code = await generator.generate()

    if diagram_code:
        # Determine output path
        if not output_path:
            workflow_stem = Path(workflow_path).stem
            output_path = f"workflows/diagrams/{workflow_stem}.png"

        output_file = Path(output_path)
        # Ensure .png extension
        if output_file.suffix.lower() != '.png':
            output_file = output_file.with_suffix('.png')

        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Generate PNG with specified background
        await generate_png_from_mermaid(diagram_code, output_file, background)


def generate_diagram(workflow_path: str, output_path: str | None = None, background: str = 'white') -> None:
    """
    Generate PNG diagram (synchronous wrapper)

    Args:
        workflow_path: Path to workflow JSON file
        output_path: Optional path to save PNG file
        background: Background color ('white' or 'transparent')
    """
    asyncio.run(generate_diagram_async(workflow_path, output_path, background))


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        console.print("[red]Usage: python -m cli.diagram <workflow.json> [output.mmd][/red]")
        sys.exit(1)

    workflow_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    generate_diagram(workflow_path, output_path)
