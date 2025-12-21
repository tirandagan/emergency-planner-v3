"""
Prompt Template Loader

Loads markdown prompt templates with support for:
- {{include:path.md}} directives (recursive resolution)
- ${variable} substitution
- LRU caching for performance
- Path security validation

Example:
    loader = PromptLoader(base_dir="workflows/prompts")

    # Load with includes resolved
    prompt = await loader.load_prompt("emergency-contacts/system-prompt.md")

    # Substitute variables
    prompt = loader.substitute_variables(prompt, {"location": "Seattle"})
"""

import re
import logging
import hashlib
import json
from pathlib import Path
from typing import Dict, Any, Set, Optional

logger = logging.getLogger(__name__)


class PromptLoadError(Exception):
    """Base exception for prompt loading errors."""
    pass


class PromptNotFoundError(PromptLoadError):
    """Prompt file not found."""
    pass


class CircularIncludeError(PromptLoadError):
    """Circular include dependency detected."""
    pass


class MaxDepthExceededError(PromptLoadError):
    """Maximum include depth exceeded."""
    pass


class PromptLoader:
    """
    Async prompt template loader with include resolution and caching.

    Features:
    - Recursive {{include:path.md}} resolution
    - In-memory LRU cache
    - Path validation (prevent directory traversal)
    - Circular dependency detection
    - Variable substitution (${variable}, ${path.to.value})

    Example:
        loader = PromptLoader(base_dir="workflows/prompts")

        # Load single prompt
        content = await loader.load_prompt("emergency-contacts/system-prompt.md")

        # Load and substitute variables
        content = await loader.load_prompt("emergency-contacts/system-prompt.md")
        content = loader.substitute_variables(content, {"location": "Seattle"})
    """

    def __init__(
        self,
        base_dir: str = "workflows/prompts",
        max_cache_size: int = 128,
        max_include_depth: int = 10,
        fail_on_missing_include: bool = False
    ) -> None:
        """
        Initialize prompt loader.

        Args:
            base_dir: Base directory for prompt files (relative to project root)
            max_cache_size: Maximum number of prompts to cache (LRU eviction)
            max_include_depth: Maximum depth for recursive includes (prevent infinite loops)
            fail_on_missing_include: If True, raise error on missing include; if False, skip silently
        """
        self.base_dir = Path(base_dir).resolve()
        self.max_cache_size = max_cache_size
        self.max_include_depth = max_include_depth
        self.fail_on_missing_include = fail_on_missing_include

        # Cache: path → (content, md5_hash)
        self._cache: Dict[str, tuple[str, str]] = {}

        logger.info(f"PromptLoader initialized with base_dir: {self.base_dir}")

    def load_prompt_sync(self, relative_path: str, resolve_includes: bool = True) -> str:
        """
        Synchronous version of load_prompt for eventlet/worker compatibility.
        """
        # Validate and resolve path
        full_path = self._validate_path(relative_path)

        # Check cache
        if relative_path in self._cache:
            return self._cache[relative_path][0]

        # Read file
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            raise PromptLoadError(f"Failed to read prompt file: {relative_path}") from e

        # Resolve includes if requested (synchronously)
        if resolve_includes:
            content = self._resolve_includes_sync(
                content,
                full_path.parent,
                depth=0,
                visited=set()
            )

        # Cache result
        self._add_to_cache(relative_path, content)
        return content

    def _resolve_includes_sync(
        self,
        content: str,
        current_dir: Path,
        depth: int,
        visited: Set[Path]
    ) -> str:
        """Synchronous include resolution."""
        if depth > self.max_include_depth:
            raise MaxDepthExceededError(f"Maximum include depth exceeded")

        include_pattern = r'\{\{include:([^}]+)\}\}'
        matches = list(re.finditer(include_pattern, content))

        if not matches:
            return content

        for match in matches:
            include_path_str = match.group(1).strip()
            try:
                include_path = (current_dir / include_path_str).resolve()
                if not self._is_safe_path(include_path) or include_path in visited:
                    continue
                if not include_path.exists():
                    continue

                with open(include_path, 'r', encoding='utf-8') as f:
                    included_content = f.read()

                included_content = self._resolve_includes_sync(
                    included_content,
                    include_path.parent,
                    depth + 1,
                    visited | {include_path}
                )
                content = content.replace(match.group(0), included_content)
            except Exception:
                continue

        return content

    def load_prompt_sync(self, relative_path: str, resolve_includes: bool = True) -> str:
        """
        Synchronous version of load_prompt for eventlet/worker compatibility.
        """
        # Validate and resolve path
        full_path = self._validate_path(relative_path)

        # Check cache
        if relative_path in self._cache:
            return self._cache[relative_path][0]

        # Read file
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            raise PromptLoadError(f"Failed to read prompt file: {relative_path}") from e

        # Resolve includes if requested (synchronously)
        if resolve_includes:
            content = self._resolve_includes_sync(
                content,
                full_path.parent,
                depth=0,
                visited=set()
            )

        # Cache result
        self._add_to_cache(relative_path, content)
        return content

    def _resolve_includes_sync(
        self,
        content: str,
        current_dir: Path,
        depth: int,
        visited: Set[Path]
    ) -> str:
        """Synchronous include resolution."""
        if depth > self.max_include_depth:
            raise MaxDepthExceededError(f"Maximum include depth exceeded")

        include_pattern = r'\{\{include:([^}]+)\}\}'
        matches = list(re.finditer(include_pattern, content))

        if not matches:
            return content

        for match in matches:
            include_path_str = match.group(1).strip()
            try:
                include_path = (current_dir / include_path_str).resolve()
                if not self._is_safe_path(include_path) or include_path in visited:
                    continue
                if not include_path.exists():
                    continue

                with open(include_path, 'r', encoding='utf-8') as f:
                    included_content = f.read()

                included_content = self._resolve_includes_sync(
                    included_content,
                    include_path.parent,
                    depth + 1,
                    visited | {include_path}
                )
                content = content.replace(match.group(0), included_content)
            except Exception:
                continue

        return content

    async def load_prompt(self, relative_path: str, resolve_includes: bool = True) -> str:
        """
        Load prompt with includes resolved.

        Args:
            relative_path: Path relative to base_dir (e.g., "emergency-contacts/system-prompt.md")
            resolve_includes: If True, resolve {{include:...}} directives

        Returns:
            Prompt content with includes resolved

        Raises:
            PromptNotFoundError: If file not found
            CircularIncludeError: If circular include detected
            MaxDepthExceededError: If max depth exceeded
        """
        # Validate and resolve path
        full_path = self._validate_path(relative_path)

        # Check cache
        if relative_path in self._cache:
            logger.debug(f"Cache hit for prompt: {relative_path}")
            return self._cache[relative_path][0]

        logger.debug(f"Loading prompt: {relative_path}")

        # Check if file exists
        if not full_path.exists():
            logger.error(f"Prompt file NOT FOUND at: {full_path}")
            raise PromptNotFoundError(
                f"Prompt file not found: {relative_path} (resolved to {full_path})"
            )

        # Read file
        try:
            logger.debug(f"Opening prompt file: {full_path}")
            # Use synchronous open as it's more reliable in eventlet environments
            # and file sizes are small. eventlet will handle the yield.
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read prompt file {full_path}: {e}")
            raise PromptLoadError(f"Failed to read prompt file: {relative_path}") from e

        # Resolve includes if requested
        if resolve_includes:
            content = await self._resolve_includes(
                content,
                full_path.parent,
                depth=0,
                visited=set()
            )

        # Cache result
        self._add_to_cache(relative_path, content)

        logger.info(f"Loaded prompt: {relative_path} ({len(content)} chars)")
        return content

    async def _resolve_includes(
        self,
        content: str,
        current_dir: Path,
        depth: int,
        visited: Set[Path]
    ) -> str:
        """
        Recursively resolve {{include:path.md}} directives.

        Supports:
        - Relative paths: {{include:../shared/tone.md}}
        - Nested includes: included files can have their own includes
        - Circular detection: raises error if circular reference found

        Args:
            content: Content to process
            current_dir: Current file's directory (for resolving relative paths)
            depth: Current recursion depth
            visited: Set of already visited file paths (for circular detection)

        Returns:
            Content with all includes resolved

        Raises:
            CircularIncludeError: If circular include detected
            MaxDepthExceededError: If max depth exceeded
        """
        # Check max depth
        if depth > self.max_include_depth:
            raise MaxDepthExceededError(
                f"Maximum include depth ({self.max_include_depth}) exceeded"
            )

        # Find all {{include:...}} patterns
        include_pattern = r'\{\{include:([^}]+)\}\}'
        matches = list(re.finditer(include_pattern, content))

        if not matches:
            return content

        logger.debug(f"Found {len(matches)} include directives at depth {depth}")

        # Process each include
        for match in matches:
            include_path_str = match.group(1).strip()

            try:
                # Resolve relative to current file's directory
                include_path = (current_dir / include_path_str).resolve()

                # Security check
                if not self._is_safe_path(include_path):
                    error_msg = f"Path outside base directory: {include_path_str}"
                    if self.fail_on_missing_include:
                        raise PromptLoadError(error_msg)
                    else:
                        logger.warning(error_msg)
                        # Replace with HTML comment
                        content = content.replace(
                            match.group(0),
                            f"<!-- Include failed: {error_msg} -->"
                        )
                        continue

                # Circular dependency check
                if include_path in visited:
                    error_msg = f"Circular include detected: {include_path}"
                    if self.fail_on_missing_include:
                        raise CircularIncludeError(error_msg)
                    else:
                        logger.warning(error_msg)
                        content = content.replace(
                            match.group(0),
                            f"<!-- Include skipped: circular dependency -->"
                        )
                        continue

                # Check if file exists
                if not include_path.exists():
                    error_msg = f"Include file not found: {include_path_str}"
                    if self.fail_on_missing_include:
                        raise PromptNotFoundError(error_msg)
                    else:
                        logger.warning(error_msg)
                        content = content.replace(
                            match.group(0),
                            f"<!-- Include not found: {include_path_str} -->"
                        )
                        continue

                # Read included file
                with open(include_path, 'r', encoding='utf-8') as f:
                    included_content = f.read()

                # Recursively resolve includes in included file
                included_content = await self._resolve_includes(
                    included_content,
                    include_path.parent,
                    depth + 1,
                    visited | {include_path}
                )

                # Replace directive with content
                content = content.replace(match.group(0), included_content)

                logger.debug(f"Resolved include: {include_path_str} ({len(included_content)} chars)")

            except (PromptLoadError, CircularIncludeError, MaxDepthExceededError):
                raise
            except Exception as e:
                error_msg = f"Failed to resolve include: {include_path_str}"
                if self.fail_on_missing_include:
                    raise PromptLoadError(error_msg) from e
                else:
                    logger.warning(f"{error_msg}: {e}")
                    content = content.replace(
                        match.group(0),
                        f"<!-- Include failed: {error_msg} -->"
                    )

        return content

    def substitute_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Replace ${variable} and ${path.to.value} with actual values.

        Supports:
        - Simple: ${name} → variables['name']
        - Nested: ${steps.fetch.output} → variables['steps']['fetch']['output']

        Args:
            template: Template string with ${...} placeholders
            variables: Dict with variable values (can be nested)

        Returns:
            Template with variables substituted

        Notes:
            - Missing variables are kept as-is (not replaced)
            - Values are coerced to strings
        """
        # Pattern: ${...}
        pattern = r'\$\{([^}]+)\}'

        def replacer(match):
            var_path = match.group(1)
            try:
                value = self._resolve_variable_path(variables, var_path)
                return self._coerce_to_string(value)
            except (KeyError, IndexError, TypeError) as e:
                logger.warning(f"Variable not found or invalid: {var_path} ({e})")
                return match.group(0)  # Keep original if not found

        return re.sub(pattern, replacer, template)

    def _resolve_variable_path(self, data: Dict[str, Any], path: str) -> Any:
        """
        Resolve nested variable path.

        Examples:
            - "name" → data["name"]
            - "user.location" → data["user"]["location"]
            - "results[0].name" → data["results"][0]["name"]

        Args:
            data: Data dict
            path: Variable path

        Returns:
            Resolved value

        Raises:
            KeyError: If path not found
        """
        parts = path.split('.')
        current = data

        for part in parts:
            if '[' in part:
                # Handle array indexing
                key, rest = part.split('[', 1)
                if key:
                    current = current[key]

                # Extract index
                idx_str = rest.rstrip(']')
                idx = int(idx_str)
                current = current[idx]
            else:
                current = current[part]

        return current

    def _coerce_to_string(self, value: Any) -> str:
        """
        Convert Python value to string for template substitution.

        Args:
            value: Value to convert

        Returns:
            String representation
        """
        if isinstance(value, str):
            return value
        elif isinstance(value, bool):
            return "true" if value else "false"
        elif value is None:
            return "null"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, (list, dict)):
            return json.dumps(value)
        else:
            return str(value)

    def _validate_path(self, relative_path: str) -> Path:
        """
        Validate and resolve path to prevent directory traversal.

        Args:
            relative_path: Path relative to base_dir

        Returns:
            Resolved absolute path

        Raises:
            ValueError: If path is outside base directory
        """
        # Resolve to absolute path
        full_path = (self.base_dir / relative_path).resolve()

        # Check if within base_dir
        if not self._is_safe_path(full_path):
            raise ValueError(
                f"Path outside base directory: {relative_path} "
                f"(resolved to {full_path}, base: {self.base_dir})"
            )

        return full_path

    def _is_safe_path(self, path: Path) -> bool:
        """
        Check if path is within base directory.

        Args:
            path: Path to check (should be resolved)

        Returns:
            True if path is safe
        """
        try:
            path.relative_to(self.base_dir)
            return True
        except ValueError:
            return False

    def _add_to_cache(self, key: str, content: str) -> None:
        """
        Add prompt to LRU cache.

        Args:
            key: Cache key (relative path)
            content: Prompt content
        """
        # Evict oldest if at capacity
        if len(self._cache) >= self.max_cache_size:
            # Remove first item (oldest in insertion order)
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            logger.debug(f"Cache evicted: {oldest_key}")

        # Add new item (moves to end in Python 3.7+)
        content_hash = hashlib.md5(content.encode()).hexdigest()
        self._cache[key] = (content, content_hash)

    def clear_cache(self) -> None:
        """Clear all cached prompts."""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cache cleared ({count} items)")

    def get_cache_stats(self) -> Dict[str, int]:
        """
        Get cache statistics.

        Returns:
            Dict with cache statistics
        """
        return {
            "size": len(self._cache),
            "max_size": self.max_cache_size,
            "usage_percent": int((len(self._cache) / self.max_cache_size) * 100)
        }


# Global singleton loader instance
_default_loader: Optional[PromptLoader] = None


def get_default_loader() -> PromptLoader:
    """
    Get or create default PromptLoader instance.

    Returns:
        Default PromptLoader instance
    """
    global _default_loader
    if _default_loader is None:
        _default_loader = PromptLoader()
    return _default_loader


def set_default_loader(loader: PromptLoader) -> None:
    """
    Set default PromptLoader instance.

    Args:
        loader: PromptLoader instance to use as default
    """
    global _default_loader
    _default_loader = loader
