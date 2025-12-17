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


DIAGRAM_PROMPT = """You are a workflow visualization expert. Generate a CLEAN, READABLE PlantUML activity diagram from the following workflow JSON.

WORKFLOW JSON:
```json
{workflow_json}
```

{prompt_dependencies}

DESIGN PRINCIPLES - CREATE A USER-FRIENDLY DIAGRAM:
1. **Clarity over completeness** - Show what matters, hide technical details
2. **Scannable hierarchy** - Users should understand the flow in 5 seconds
3. **Plain language** - Avoid jargon, use simple descriptions
4. **Visual breathing room** - Don't cram too much into nodes

REQUIREMENTS:
1. Use PlantUML activity diagram syntax
2. Use skinparam for clean, modern styling
3. Keep activities CONCISE (max 3-4 lines per activity)

4. **SHOW INPUT REQUIREMENTS**: Create a partition showing:
   - All required input variables the caller must provide
   - Use note or separate activity listing inputs clearly

5. For EACH step:
   - **Clear activity name**: "Step 1: Format Bundles"
   - **Description**: What it does in plain English
   - **For LLM steps**: Add note showing complete prompt dependency tree:
     * **CRITICAL**: If PROMPT FILE DEPENDENCIES section is provided, you MUST show EVERY SINGLE included file listed - do not abbreviate or summarize
     * List each include file on its own line with a bullet point
     * Also show workflow variables that get injected
     * Example:
     ```
     note right
       📁 **Prompt:** mission-generation/mega-prompt.md
       **Includes:**
       • system-prompt.md
       • output-format.md
       • risk-assessment.md
       • simulation-generation.md
       • bundle-recommendations/selection-criteria.md
       • shared/safety-disclaimers.md
       • shared/tone-and-voice.md

       **Variables:**
       • bundle-context (from workflow)
       • location data (from workflow)
     end note
     ```

6. Use arrow labels to show data flow:
   - Label transitions with key data being passed
   - Example: `-> formatted bundles;`

7. Use partitions to organize workflow phases:
   - "Input Requirements" partition
   - "Data Preparation" partition
   - "AI Generation" partition
   - "Output Delivery" partition

8. Color coding (modern, professional):
   - Input partition: #E8F5E9 (soft green)
   - Data prep: #FFF3E0 (soft orange)
   - AI/LLM: #F3E5F5 (soft purple)
   - Output: #C8E6C9 (dark green)

9. **CRITICAL**: Keep diagram clean - aim for 8-12 activities maximum

OUTPUT ONLY THE PLANTUML CODE - no explanation, no markdown code blocks, just the raw PlantUML syntax starting with @startuml and ending with @enduml.

Example of GOOD readable format:
@startuml
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #666666
skinparam ActivityBorderThickness 2
skinparam ArrowColor #666666
skinparam PartitionBackgroundColor #F5F5F5
skinparam PartitionBorderColor #999999

start

partition "Input Requirements" #E8F5E9 {{
  :📥 **Required Inputs**
  • input.bundles
  • input.formData
  • input.familyDetails
  • input.mobility
  • input.budgetTierLabel;
}}

partition "Data Preparation" #FFF3E0 {{
  :Step 1: Format Bundles
  Transform product data into LLM context;
  -> formatted bundles;

  :Step 2: Build User Prompt
  Combine form data scenarios and location;
  -> complete prompt;
}}

partition "AI Generation" #F3E5F5 {{
  :Step 3: Generate Mission Plan
  Create comprehensive plan with Claude 3.5;

  note right
    📁 **Prompt:** mission-generation/mega-prompt.md

    **Includes:**
    • system-prompt.md
    • output-format.md
    • risk-assessment.md
    • simulation-generation.md
    • bundle-recommendations/selection-criteria.md
    • shared/safety-disclaimers.md
    • shared/tone-and-voice.md

    **Variables:**
    • bundle-context
    • location data
    • family details
  end note

  -> mission report;
}}

partition "Output Delivery" #C8E6C9 {{
  :Step 4: Parse Sections
  Extract structured content sections;

  :📦 **Deliverables**
  • Complete mission report
  • Parsed sections
  • Bundle recommendations
  • Usage metrics;
}}

stop

@enduml
"""


class PlantUMLDiagramGenerator:
    """Generate PlantUML diagrams using LLM"""

    def __init__(self, workflow_path: Path):
        """
        Initialize diagram generator

        Args:
            workflow_path: Path to workflow JSON file
        """
        self.workflow_path = workflow_path
        self.workflow: Workflow | None = None
        self.workflow_json: str = ""
        self.prompt_dependencies: Dict[str, List[str]] = {}  # Maps prompt file to its includes

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
                self.workflow_data = json.loads(self.workflow_json)

            self.workflow = Workflow(**self.workflow_data)

            # Parse prompt dependencies for LLM steps
            self._parse_prompt_dependencies()

            return True
        except Exception as e:
            console.print(f"[red]Failed to load workflow: {str(e)}[/red]")
            return False

    def _inject_prompt_includes(self, diagram_code: str) -> str:
        """Inject prompt file includes into the diagram note"""
        import re

        # Find the prompt file reference in the note
        for prompt_file, includes in self.prompt_dependencies.items():
            # Check if includes section already exists (Claude might have added it)
            if "**Includes:**" in diagram_code:
                # Includes already present, skip injection
                continue

            # Build the includes section
            includes_section = "    \n    **Includes:**\n"
            for inc in includes:
                includes_section += f"    • {inc}\n"

            # Simple pattern: find the line with the prompt filename and add includes after it
            prompt_line = f"📁 **Prompt:** {prompt_file}"

            if prompt_line in diagram_code:
                # Insert includes section after the prompt line
                diagram_code = diagram_code.replace(
                    prompt_line + "\n",
                    prompt_line + "\n" + includes_section
                )

        return diagram_code

    def _parse_prompt_dependencies(self) -> None:
        """Parse prompt files to extract included dependencies"""
        if not hasattr(self, 'workflow_data'):
            return

        import re

        # Find prompts directory relative to workflow file
        prompts_dir = self.workflow_path.parent.parent / "prompts"

        # Use raw JSON data instead of Workflow model
        for step_data in self.workflow_data.get('steps', []):
            step_type = step_data.get('type')

            if step_type == "llm":
                # prompt_template is a direct field in the JSON
                prompt_template = step_data.get('prompt_template')

                if prompt_template:
                        prompt_path = prompts_dir / prompt_template
                        if prompt_path.exists():
                            try:
                                with open(prompt_path, 'r') as f:
                                    content = f.read()

                                # Extract {{include:...}} directives
                                includes = re.findall(r'\{\{include:([^}]+)\}\}', content)

                                if includes:
                                    self.prompt_dependencies[prompt_template] = includes

                            except Exception as e:
                                pass  # Silently skip prompt files that can't be parsed

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

            # Build prompt dependencies section
            dependencies_info = ""
            if self.prompt_dependencies:
                dependencies_info = "\n\n**PROMPT FILE DEPENDENCIES** (MUST be shown in diagram):\n"
                for prompt_file, includes in self.prompt_dependencies.items():
                    dependencies_info += f"\n**{prompt_file}** includes these files:\n"
                    for inc in includes:
                        dependencies_info += f"  • {inc}\n"
                dependencies_info += "\n**IMPORTANT**: Show ALL of these includes in the note for the LLM step.\n"

            # Build prompt
            prompt = DIAGRAM_PROMPT.format(
                workflow_json=self.workflow_json,
                prompt_dependencies=dependencies_info
            )

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
                    max_tokens=3000
                )

            # Extract diagram code
            diagram_code = response.content.strip()

            # Remove markdown code blocks if present
            if diagram_code.startswith("```"):
                lines = diagram_code.split('\n')
                # Remove first line (```plantuml or ```) and last line (```)
                diagram_code = '\n'.join(lines[1:-1]) if len(lines) > 2 else diagram_code

            # Verify PlantUML syntax
            if not diagram_code.startswith('@startuml'):
                raise ValueError(f"Generated code doesn't start with @startuml: {diagram_code[:100]}")

            # Inject prompt includes into the diagram
            if self.prompt_dependencies:
                diagram_code = self._inject_prompt_includes(diagram_code)

            # Display success with compact metrics
            console.print(
                f"[green]✓[/green] Diagram generated  "
                f"[dim]│[/dim]  {response.usage.total_tokens:,} tokens  "
                f"[dim]│[/dim]  ${response.cost_usd:.4f}  "
                f"[dim]│[/dim]  Claude 3.5 Sonnet"
            )

            return diagram_code

        except Exception as e:
            import traceback
            console.print(f"[red]✗[/red] Generation failed  [dim]│[/dim]  {str(e)}")
            console.print(f"[dim]{traceback.format_exc()}[/dim]")
            return None


async def generate_png_from_plantuml(diagram_code: str, output_path: Path, background: str = 'white') -> bool:
    """
    Generate image from PlantUML diagram code using Kroki API.

    Kroki is an open-source diagram rendering service that supports PlantUML
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

        # Always download as PNG from Kroki
        api_url = f"https://kroki.io/plantuml/png/{encoded}"

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
    generator = PlantUMLDiagramGenerator(Path(workflow_path))
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
        await generate_png_from_plantuml(diagram_code, output_file, background)


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
