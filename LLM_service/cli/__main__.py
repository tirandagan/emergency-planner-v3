"""
LLM Workflow CLI - Main Entry Point

Command-line interface for workflow development and management.

Usage:
    python -m cli <command> [options]

Commands:
    validate    Validate workflow JSON file
    dry-run     Preview workflow execution without API calls
    edit        Interactive workflow editor
    diagram     Generate Mermaid diagram using LLM

Examples:
    python -m cli validate workflows/definitions/emergency_contacts.json
    python -m cli dry-run workflows/definitions/emergency_contacts.json
    python -m cli edit workflows/definitions/my_workflow.json
    python -m cli diagram workflows/definitions/emergency_contacts.json
"""

import sys
import argparse
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich import print as rprint

from cli.validator import validate_workflow
from cli.dry_run import dry_run_workflow
from cli.editor import edit_workflow
from cli.diagram import generate_diagram


console = Console()


def print_banner() -> None:
    """Print modern compact CLI banner"""
    console.print(
        "[bold cyan]LLM Workflow CLI[/bold cyan] [dim]v1.0.0[/dim]  "
        "[dim]│[/dim]  Workflow Development & Management"
    )


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser with subcommands"""
    parser = argparse.ArgumentParser(
        description="LLM Workflow CLI - Development and management tools",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate a workflow
  python -m cli validate workflows/definitions/emergency_contacts.json

  # Preview workflow execution
  python -m cli dry-run workflows/definitions/emergency_contacts.json

  # Create/edit workflow interactively
  python -m cli edit
  python -m cli edit workflows/definitions/my_workflow.json

  # Generate Mermaid diagram
  python -m cli diagram workflows/definitions/emergency_contacts.json
  python -m cli diagram workflows/definitions/emergency_contacts.json -o diagram.mmd

For more information, visit: https://github.com/your-org/llm-service
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Validate command
    validate_parser = subparsers.add_parser(
        'validate',
        help='Validate workflow JSON file',
        description='Validate workflow structure, dependencies, and configurations'
    )
    validate_parser.add_argument(
        'workflow',
        help='Path to workflow JSON file'
    )
    validate_parser.add_argument(
        '-p', '--prompts',
        help='Path to prompts directory (default: workflows/prompts)',
        default=None
    )

    # Dry-run command
    dryrun_parser = subparsers.add_parser(
        'dry-run',
        help='Preview workflow execution without API calls',
        description='Simulate workflow execution and show execution plan'
    )
    dryrun_parser.add_argument(
        'workflow',
        help='Path to workflow JSON file'
    )
    dryrun_parser.add_argument(
        '-i', '--input',
        help='Path to input data JSON file',
        default=None
    )

    # Edit command
    edit_parser = subparsers.add_parser(
        'edit',
        help='Interactive workflow editor',
        description='Create or edit workflows interactively'
    )
    edit_parser.add_argument(
        'workflow',
        nargs='?',
        help='Path to workflow JSON file to edit (optional for new workflow)',
        default=None
    )

    # Diagram command
    diagram_parser = subparsers.add_parser(
        'diagram',
        help='Generate PNG workflow diagram using LLM',
        description='Generate visual workflow diagram as PNG with white or transparent background'
    )
    diagram_parser.add_argument(
        'workflow',
        help='Path to workflow JSON file'
    )
    diagram_parser.add_argument(
        '-o', '--output',
        help='Output path for PNG file (default: workflows/diagrams/<name>.png)',
        default=None
    )
    diagram_parser.add_argument(
        '-b', '--background',
        choices=['white', 'transparent'],
        default='white',
        help='PNG background color (default: white)'
    )

    return parser


def cmd_validate(args: argparse.Namespace) -> int:
    """Execute validate command"""
    try:
        success = validate_workflow(args.workflow, args.prompts)
        return 0 if success else 1
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")
        return 1


def cmd_dry_run(args: argparse.Namespace) -> int:
    """Execute dry-run command"""
    try:
        import json
        input_data = {}

        if args.input:
            with open(args.input, 'r') as f:
                input_data = json.load(f)

        dry_run_workflow(args.workflow, input_data)
        return 0
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")
        return 1


def cmd_edit(args: argparse.Namespace) -> int:
    """Execute edit command"""
    try:
        edit_workflow(args.workflow)
        return 0
    except KeyboardInterrupt:
        console.print("\n[yellow]Editor cancelled by user[/yellow]")
        return 0
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")
        return 1


def cmd_diagram(args: argparse.Namespace) -> int:
    """Execute diagram command"""
    try:
        generate_diagram(args.workflow, args.output, args.background)
        return 0
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")
        return 1


def main() -> int:
    """Main CLI entry point"""
    # Print banner
    print_banner()

    # Parse arguments
    parser = create_parser()
    args = parser.parse_args()

    # No command provided - show help
    if not args.command:
        parser.print_help()
        return 0

    # Execute command
    command_handlers = {
        'validate': cmd_validate,
        'dry-run': cmd_dry_run,
        'edit': cmd_edit,
        'diagram': cmd_diagram
    }

    handler = command_handlers.get(args.command)
    if handler:
        return handler(args)
    else:
        console.print(f"[red]Unknown command: {args.command}[/red]")
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
