"""
Prompt Loading Utilities

Helper functions for loading, combining, and managing prompt templates.

Example:
    # Load multiple prompts in parallel
    prompts = await load_prompts_parallel([
        "emergency-contacts/system-prompt.md",
        "emergency-contacts/output-format.md"
    ])

    # Combine with separator
    combined = combine_prompts(*prompts, separator="\\n\\n---\\n\\n")
"""

import asyncio
import logging
from typing import List, Optional
from pathlib import Path

from app.workflows.prompt_loader import PromptLoader, get_default_loader

logger = logging.getLogger(__name__)


async def load_prompt(path: str) -> str:
    """
    Load single prompt (convenience wrapper).

    Args:
        path: Relative path to prompt file

    Returns:
        Prompt content with includes resolved
    """
    loader = get_default_loader()
    return await loader.load_prompt(path)


async def load_prompts_parallel(paths: List[str]) -> List[str]:
    """
    Load multiple prompts in parallel using asyncio.gather().

    Args:
        paths: List of relative paths to prompt files

    Returns:
        List of prompt contents (same order as paths)

    Example:
        prompts = await load_prompts_parallel([
            "emergency-contacts/system-prompt.md",
            "emergency-contacts/output-format.md",
            "shared/tone-and-voice.md"
        ])
    """
    loader = get_default_loader()
    tasks = [loader.load_prompt(path) for path in paths]
    return await asyncio.gather(*tasks)


def combine_prompts(*prompts: str, separator: str = "\n\n---\n\n") -> str:
    """
    Combine multiple prompts with separator.

    Args:
        *prompts: Variable number of prompt strings
        separator: String to insert between prompts (default: "\\n\\n---\\n\\n")

    Returns:
        Combined prompt string

    Example:
        combined = combine_prompts(
            system_prompt,
            scenario_prompt,
            output_format,
            separator="\\n\\n---\\n\\n"
        )
    """
    # Filter out None and empty strings
    valid_prompts = [p for p in prompts if p]
    return separator.join(valid_prompts)


async def build_mega_prompt(
    system_prompt_path: str,
    scenario_paths: Optional[List[str]] = None,
    variables: Optional[dict] = None,
    separator: str = "\n\n---\n\n"
) -> str:
    """
    Build mega prompt from system + scenarios (replicates main app pattern).

    Loads system prompt and multiple scenario prompts in parallel,
    then combines them with structure and variable substitution.

    Args:
        system_prompt_path: Path to system prompt file
        scenario_paths: List of paths to scenario prompts (optional)
        variables: Variables for substitution (optional)
        separator: String to separate sections

    Returns:
        Combined mega prompt with variables substituted

    Example:
        mega_prompt = await build_mega_prompt(
            system_prompt_path="mission-generation/system-prompt.md",
            scenario_paths=[
                "mission-generation/scenarios/natural-disaster.md",
                "mission-generation/scenarios/pandemic.md"
            ],
            variables={"location": "Seattle", "family_size": 4}
        )
    """
    loader = get_default_loader()

    # Prepare paths to load
    all_paths = [system_prompt_path]
    if scenario_paths:
        all_paths.extend(scenario_paths)

    # Load all in parallel
    prompts = await load_prompts_parallel(all_paths)

    # Build structured prompt
    parts = [
        "# MISSION GENERATION INSTRUCTIONS",
        "",
        prompts[0],  # System prompt
        ""
    ]

    # Add scenario sections
    if scenario_paths and len(prompts) > 1:
        for i, (path, content) in enumerate(zip(scenario_paths, prompts[1:]), 1):
            scenario_name = Path(path).stem.replace('-', ' ').title()
            parts.extend([
                f"## {scenario_name} Scenario",
                "",
                content,
                ""
            ])

    # Combine all parts
    template = "\n".join(parts)

    # Substitute variables if provided
    if variables:
        template = loader.substitute_variables(template, variables)

    return template


async def load_and_substitute(
    template_path: str,
    variables: dict
) -> str:
    """
    Load prompt and substitute variables in one call.

    Args:
        template_path: Path to template file
        variables: Variables for substitution

    Returns:
        Prompt with variables substituted

    Example:
        prompt = await load_and_substitute(
            "emergency-contacts/system-prompt.md",
            {"location": "Seattle", "family_size": 4}
        )
    """
    loader = get_default_loader()
    template = await loader.load_prompt(template_path)
    return loader.substitute_variables(template, variables)


def format_prompt_with_sections(sections: List[tuple[str, str]]) -> str:
    """
    Format prompt with named sections.

    Args:
        sections: List of (section_name, content) tuples

    Returns:
        Formatted prompt with section headers

    Example:
        prompt = format_prompt_with_sections([
            ("System Instructions", system_prompt),
            ("User Context", user_context),
            ("Output Format", output_format)
        ])
    """
    parts = []

    for section_name, content in sections:
        if not content:
            continue

        parts.extend([
            f"## {section_name}",
            "",
            content,
            ""
        ])

    return "\n".join(parts)


def count_tokens_estimate(text: str) -> int:
    """
    Rough estimate of token count (GPT tokenizer approximation).

    Args:
        text: Text to estimate tokens for

    Returns:
        Estimated token count

    Notes:
        - Uses simple heuristic: ~4 characters per token
        - Not accurate for actual LLM tokenization
        - Useful for quick estimates only
    """
    return len(text) // 4
