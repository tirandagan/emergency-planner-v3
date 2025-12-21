"""
Prompt Template Loader

Loads markdown prompt templates with support for:
- {{include:path.md}} directives (recursive resolution)
- ${variable} substitution
- LRU caching for performance
- Path security validation
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
    Async and sync prompt template loader with include resolution and caching.
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

    async def load_prompt(self, relative_path: str, resolve_includes: bool = True) -> str:
        """
        Async version of load_prompt. Uses sync read because eventlet handles it.
        """
        return self.load_prompt_sync(relative_path, resolve_includes)

    async def _resolve_includes(
        self,
        content: str,
        current_dir: Path,
        depth: int,
        visited: Set[Path]
    ) -> str:
        """Async version of include resolution."""
        return self._resolve_includes_sync(content, current_dir, depth, visited)

    def substitute_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Replace ${variable} and ${path.to.value} with actual values.
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
                return match.group(0)

        return re.sub(pattern, replacer, template)

    def _resolve_variable_path(self, data: Dict[str, Any], path: str) -> Any:
        """
        Resolve nested variable path.
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
        """
        full_path = (self.base_dir / relative_path).resolve()
        if not self._is_safe_path(full_path):
            raise ValueError(f"Path outside base directory: {relative_path}")
        return full_path

    def _is_safe_path(self, path: Path) -> bool:
        """
        Check if path is within base directory.
        """
        try:
            path.relative_to(self.base_dir)
            return True
        except ValueError:
            return False

    def _add_to_cache(self, key: str, content: str) -> None:
        """
        Add prompt to LRU cache.
        """
        if len(self._cache) >= self.max_cache_size:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        content_hash = hashlib.md5(content.encode()).hexdigest()
        self._cache[key] = (content, content_hash)

    def clear_cache(self) -> None:
        """Clear all cached prompts."""
        self._cache.clear()

    def get_cache_stats(self) -> Dict[str, int]:
        """
        Get cache statistics.
        """
        return {
            "size": len(self._cache),
            "max_size": self.max_cache_size,
            "usage_percent": int((len(self._cache) / self.max_cache_size) * 100) if self.max_cache_size > 0 else 0
        }


# Global singleton loader instance
_default_loader: Optional[PromptLoader] = None


def get_default_loader() -> PromptLoader:
    """
    Get or create default PromptLoader instance.
    """
    global _default_loader
    if _default_loader is None:
        _default_loader = PromptLoader()
    return _default_loader


def set_default_loader(loader: PromptLoader) -> None:
    """
    Set default PromptLoader instance.
    """
    global _default_loader
    _default_loader = loader
