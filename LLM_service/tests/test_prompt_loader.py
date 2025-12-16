"""
Unit tests for prompt template loader.

Tests async file loading, include resolution, variable substitution,
caching, and security validation.
"""

import pytest
import tempfile
from pathlib import Path

from app.workflows.prompt_loader import (
    PromptLoader,
    PromptLoadError,
    PromptNotFoundError,
    CircularIncludeError,
    MaxDepthExceededError,
    get_default_loader,
    set_default_loader,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def temp_prompts_dir(tmp_path):
    """Create temporary prompts directory with test files."""
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()

    # Create subdirectories
    (prompts_dir / "shared").mkdir()
    (prompts_dir / "emergency-contacts").mkdir()

    # Create simple prompt
    (prompts_dir / "simple.md").write_text("Hello {{name}}!")

    # Create prompt with include
    (prompts_dir / "with-include.md").write_text(
        "Start\n{{include:simple.md}}\nEnd"
    )

    # Create nested includes
    (prompts_dir / "shared" / "tone.md").write_text("Be professional and clear.")
    (prompts_dir / "with-nested-include.md").write_text(
        "Instructions:\n{{include:shared/tone.md}}"
    )

    # Create circular includes (A includes B, B includes A)
    (prompts_dir / "circular-a.md").write_text("A: {{include:circular-b.md}}")
    (prompts_dir / "circular-b.md").write_text("B: {{include:circular-a.md}}")

    # Create prompt for variable substitution
    (prompts_dir / "variables.md").write_text(
        "Location: ${location}, Size: ${family_size}, Data: ${data.count}"
    )

    # Create emergency contacts prompt
    (prompts_dir / "emergency-contacts" / "system.md").write_text(
        "Emergency Contacts System\n{{include:../shared/tone.md}}"
    )

    return prompts_dir


@pytest.fixture
def loader(temp_prompts_dir):
    """Create PromptLoader instance with temp directory."""
    return PromptLoader(base_dir=str(temp_prompts_dir))


# ============================================================================
# Basic Loading Tests
# ============================================================================

@pytest.mark.asyncio
async def test_load_simple_prompt(loader):
    """Test loading a simple prompt without includes."""
    content = await loader.load_prompt("simple.md")
    assert content == "Hello {{name}}!"


@pytest.mark.asyncio
async def test_load_nonexistent_prompt(loader):
    """Test loading nonexistent file raises error."""
    with pytest.raises(PromptNotFoundError, match="Prompt file not found"):
        await loader.load_prompt("nonexistent.md")


@pytest.mark.asyncio
async def test_load_with_subdirectory(loader):
    """Test loading from subdirectory."""
    content = await loader.load_prompt("shared/tone.md")
    assert content == "Be professional and clear."


# ============================================================================
# Include Resolution Tests
# ============================================================================

@pytest.mark.asyncio
async def test_resolve_simple_include(loader):
    """Test resolving simple include directive."""
    content = await loader.load_prompt("with-include.md")
    assert content == "Start\nHello {{name}}!\nEnd"


@pytest.mark.asyncio
async def test_resolve_nested_include(loader):
    """Test resolving nested include (subdirectory)."""
    content = await loader.load_prompt("with-nested-include.md")
    assert content == "Instructions:\nBe professional and clear."


@pytest.mark.asyncio
async def test_resolve_relative_include(loader):
    """Test resolving relative include path (../shared)."""
    content = await loader.load_prompt("emergency-contacts/system.md")
    assert "Emergency Contacts System" in content
    assert "Be professional and clear." in content


@pytest.mark.asyncio
async def test_circular_include_detection(temp_prompts_dir):
    """Test circular include raises error with strict mode."""
    loader = PromptLoader(
        base_dir=str(temp_prompts_dir),
        fail_on_missing_include=True
    )

    with pytest.raises(CircularIncludeError, match="Circular include detected"):
        await loader.load_prompt("circular-a.md")


@pytest.mark.asyncio
async def test_circular_include_graceful_with_flag(temp_prompts_dir):
    """Test circular include is skipped when fail_on_missing_include=False."""
    loader = PromptLoader(
        base_dir=str(temp_prompts_dir),
        fail_on_missing_include=False
    )

    content = await loader.load_prompt("circular-a.md")
    assert "<!-- Include skipped: circular dependency -->" in content


@pytest.mark.asyncio
async def test_max_depth_exceeded(temp_prompts_dir):
    """Test max include depth is enforced."""
    # Create deep nesting
    for i in range(15):
        (temp_prompts_dir / f"level-{i}.md").write_text(
            f"Level {i}\n{{{{include:level-{i+1}.md}}}}"
        )
    (temp_prompts_dir / "level-15.md").write_text("Bottom")

    loader = PromptLoader(base_dir=str(temp_prompts_dir), max_include_depth=10)

    with pytest.raises(MaxDepthExceededError, match="Maximum include depth"):
        await loader.load_prompt("level-0.md")


@pytest.mark.asyncio
async def test_missing_include_graceful(temp_prompts_dir):
    """Test missing include is skipped gracefully."""
    (temp_prompts_dir / "with-missing.md").write_text(
        "Start\n{{include:missing.md}}\nEnd"
    )

    loader = PromptLoader(
        base_dir=str(temp_prompts_dir),
        fail_on_missing_include=False
    )

    content = await loader.load_prompt("with-missing.md")
    assert "Start" in content
    assert "End" in content
    assert "<!-- Include not found:" in content


# ============================================================================
# Variable Substitution Tests
# ============================================================================

def test_substitute_simple_variables(loader):
    """Test simple variable substitution."""
    template = "Hello ${name}, you are ${age} years old."
    variables = {"name": "Alice", "age": 30}

    result = loader.substitute_variables(template, variables)
    assert result == "Hello Alice, you are 30 years old."


def test_substitute_nested_variables(loader):
    """Test nested variable substitution."""
    template = "City: ${location.city}, State: ${location.state}"
    variables = {
        "location": {
            "city": "Seattle",
            "state": "WA"
        }
    }

    result = loader.substitute_variables(template, variables)
    assert result == "City: Seattle, State: WA"


def test_substitute_array_variables(loader):
    """Test array variable substitution."""
    template = "First: ${items[0]}, Second: ${items[1]}"
    variables = {
        "items": ["Apple", "Banana", "Cherry"]
    }

    result = loader.substitute_variables(template, variables)
    assert result == "First: Apple, Second: Banana"


def test_substitute_missing_variables(loader):
    """Test missing variables are kept as-is."""
    template = "Hello ${name}, you are ${missing} years old."
    variables = {"name": "Alice"}

    result = loader.substitute_variables(template, variables)
    assert result == "Hello Alice, you are ${missing} years old."


def test_substitute_boolean_variables(loader):
    """Test boolean variables are coerced to strings."""
    template = "Active: ${active}, Inactive: ${inactive}"
    variables = {"active": True, "inactive": False}

    result = loader.substitute_variables(template, variables)
    assert result == "Active: true, Inactive: false"


def test_substitute_null_variables(loader):
    """Test null variables are coerced to 'null'."""
    template = "Value: ${value}"
    variables = {"value": None}

    result = loader.substitute_variables(template, variables)
    assert result == "Value: null"


def test_substitute_dict_variables(loader):
    """Test dict variables are JSON-encoded."""
    template = "Data: ${data}"
    variables = {"data": {"count": 10, "results": []}}

    result = loader.substitute_variables(template, variables)
    assert '"count": 10' in result
    assert '"results": []' in result


# ============================================================================
# Caching Tests
# ============================================================================

@pytest.mark.asyncio
async def test_caching_enabled(loader):
    """Test prompts are cached after first load."""
    # Load once
    content1 = await loader.load_prompt("simple.md")

    # Check cache stats
    stats = loader.get_cache_stats()
    assert stats["size"] == 1

    # Load again (should hit cache)
    content2 = await loader.load_prompt("simple.md")

    assert content1 == content2
    assert stats["size"] == 1  # Still just 1 item


@pytest.mark.asyncio
async def test_cache_eviction(temp_prompts_dir):
    """Test LRU cache eviction when at capacity."""
    # Create loader with small cache
    loader = PromptLoader(base_dir=str(temp_prompts_dir), max_cache_size=2)

    # Create multiple prompt files
    (temp_prompts_dir / "prompt1.md").write_text("Prompt 1")
    (temp_prompts_dir / "prompt2.md").write_text("Prompt 2")
    (temp_prompts_dir / "prompt3.md").write_text("Prompt 3")

    # Load 3 prompts (should evict first one)
    await loader.load_prompt("prompt1.md")
    await loader.load_prompt("prompt2.md")
    await loader.load_prompt("prompt3.md")

    stats = loader.get_cache_stats()
    assert stats["size"] == 2
    assert stats["max_size"] == 2


@pytest.mark.asyncio
async def test_clear_cache(loader):
    """Test cache can be cleared."""
    await loader.load_prompt("simple.md")

    stats = loader.get_cache_stats()
    assert stats["size"] == 1

    loader.clear_cache()

    stats = loader.get_cache_stats()
    assert stats["size"] == 0


# ============================================================================
# Path Security Tests
# ============================================================================

def test_validate_path_directory_traversal(loader):
    """Test path validation prevents directory traversal."""
    with pytest.raises(ValueError, match="Path outside base directory"):
        loader._validate_path("../../../etc/passwd")


def test_validate_path_absolute_path(loader):
    """Test absolute paths are blocked."""
    with pytest.raises(ValueError, match="Path outside base directory"):
        loader._validate_path("/etc/passwd")


def test_validate_path_valid_subdirectory(loader):
    """Test valid subdirectory paths are allowed."""
    path = loader._validate_path("shared/tone.md")
    assert path.is_absolute()
    assert "shared" in str(path)


# ============================================================================
# Global Loader Tests
# ============================================================================

def test_get_default_loader():
    """Test get_default_loader returns singleton."""
    loader1 = get_default_loader()
    loader2 = get_default_loader()

    assert loader1 is loader2


def test_set_default_loader(temp_prompts_dir):
    """Test set_default_loader changes default instance."""
    custom_loader = PromptLoader(base_dir=str(temp_prompts_dir))
    set_default_loader(custom_loader)

    default = get_default_loader()
    assert default is custom_loader


# ============================================================================
# Edge Cases
# ============================================================================

@pytest.mark.asyncio
async def test_load_with_resolve_includes_false(loader):
    """Test loading without resolving includes."""
    content = await loader.load_prompt("with-include.md", resolve_includes=False)
    assert "{{include:simple.md}}" in content


@pytest.mark.asyncio
async def test_multiple_includes_same_line(temp_prompts_dir):
    """Test multiple include directives on same line."""
    (temp_prompts_dir / "multi-include.md").write_text(
        "{{include:simple.md}} and {{include:shared/tone.md}}"
    )

    loader = PromptLoader(base_dir=str(temp_prompts_dir))
    content = await loader.load_prompt("multi-include.md")

    assert "Hello {{name}}!" in content
    assert "Be professional and clear." in content


@pytest.mark.asyncio
async def test_empty_prompt_file(temp_prompts_dir):
    """Test loading empty file."""
    (temp_prompts_dir / "empty.md").write_text("")

    loader = PromptLoader(base_dir=str(temp_prompts_dir))
    content = await loader.load_prompt("empty.md")

    assert content == ""


def test_cache_stats_usage_percent(temp_prompts_dir):
    """Test cache usage percentage calculation."""
    loader = PromptLoader(base_dir=str(temp_prompts_dir), max_cache_size=10)

    # Add 5 items to cache (simulate)
    for i in range(5):
        loader._cache[f"item{i}"] = (f"content{i}", "hash")

    stats = loader.get_cache_stats()
    assert stats["usage_percent"] == 50
