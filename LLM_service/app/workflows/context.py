"""
Workflow Context Management

Manages workflow execution context with three namespaces:
- input: Input data from workflow submission
- steps: Step execution outputs
- context: User-defined variables

Supports nested path resolution with array indexing:
- ${input.location.city}
- ${steps.fetch.output.results[0].name}
- ${context.user_id}
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class WorkflowContext:
    """
    Workflow execution context with variable management.

    Provides three namespaces for variable storage and retrieval:
    1. input - Input data from workflow submission (read-only)
    2. steps - Step execution outputs (written by executors)
    3. context - User-defined variables (read/write)

    Example usage:
        context = WorkflowContext({"location": "Seattle", "family_size": 4})

        # Store step output
        context.set_step_output("fetch", {"count": 10, "results": [...]})

        # Retrieve values
        value = context.get_value("input.location")  # "Seattle"
        count = context.get_value("steps.fetch.output.count")  # 10
    """

    def __init__(self, input_data: Dict[str, Any]) -> None:
        """
        Initialize workflow context with input data.

        Args:
            input_data: Input data from workflow submission
        """
        self.input_data = input_data
        self.steps: Dict[str, Dict[str, Any]] = {}
        self.variables: Dict[str, Any] = {}

    def set_step_output(self, step_id: str, output: Dict[str, Any]) -> None:
        """
        Store output from executed step.

        Args:
            step_id: Unique step identifier
            output: Step execution output data
        """
        self.steps[step_id] = {
            "output": output,
            "success": True
        }
        logger.debug(f"Stored output for step: {step_id}")

    def set_step_error(self, step_id: str, error_message: str) -> None:
        """
        Store error from failed step.

        Args:
            step_id: Unique step identifier
            error_message: Error message
        """
        self.steps[step_id] = {
            "output": None,
            "success": False,
            "error": error_message
        }
        logger.debug(f"Stored error for step: {step_id}")

    def get_step_output(self, step_id: str) -> Optional[Dict[str, Any]]:
        """
        Get output from executed step.

        Args:
            step_id: Unique step identifier

        Returns:
            Step output dict or None if step not executed
        """
        step_data = self.steps.get(step_id)
        if step_data:
            return step_data.get("output")
        return None

    def has_step(self, step_id: str) -> bool:
        """
        Check if step has been executed.

        Args:
            step_id: Unique step identifier

        Returns:
            True if step has been executed
        """
        return step_id in self.steps

    def step_succeeded(self, step_id: str) -> bool:
        """
        Check if step executed successfully.

        Args:
            step_id: Unique step identifier

        Returns:
            True if step executed successfully, False otherwise
        """
        step_data = self.steps.get(step_id)
        if step_data:
            return step_data.get("success", False)
        return False

    def set_variable(self, key: str, value: Any) -> None:
        """
        Set a context variable.

        Args:
            key: Variable name
            value: Variable value
        """
        self.variables[key] = value

    def get_variable(self, key: str) -> Optional[Any]:
        """
        Get a context variable.

        Args:
            key: Variable name

        Returns:
            Variable value or None if not found
        """
        return self.variables.get(key)

    def get_value(self, path: str) -> Any:
        """
        Resolve variable path and return value.

        Supports three namespaces:
        - input: ${input.location.city}
        - steps: ${steps.fetch.output.results[0].name}
        - context: ${context.user_id}

        Args:
            path: Variable path (e.g., "steps.fetch.output.count")

        Returns:
            Resolved value

        Raises:
            KeyError: If path is invalid or value not found
            ValueError: If path format is invalid
        """
        if not path:
            raise ValueError("Path cannot be empty")

        parts = path.split('.', 1)  # Split into namespace and rest
        namespace = parts[0]

        if len(parts) == 1:
            # No nested path, just namespace
            if namespace == "input":
                return self.input_data
            elif namespace == "steps":
                return self.steps
            elif namespace == "context":
                return self.variables
            else:
                raise ValueError(f"Unknown namespace: {namespace}")

        # Has nested path
        rest_path = parts[1]

        if namespace == "input":
            return self._resolve_nested_path(self.input_data, rest_path)
        elif namespace == "steps":
            return self._resolve_nested_path(self.steps, rest_path)
        elif namespace == "context":
            return self._resolve_nested_path(self.variables, rest_path)
        else:
            raise ValueError(f"Unknown namespace: {namespace}")

    def _resolve_nested_path(self, data: Dict[str, Any], path: str) -> Any:
        """
        Resolve nested path with array indexing support.

        Supports:
        - Dot notation: fetch.output.count
        - Array indexing: results[0].name
        - Combined: data[0].items[1].value
        - Nested arrays: matrix[0][0]

        Args:
            data: Data dict to resolve path in
            path: Nested path (e.g., "output.results[0].name")

        Returns:
            Resolved value

        Raises:
            KeyError: If key not found
            IndexError: If array index out of range
            TypeError: If accessing array index on non-list
            ValueError: If path syntax is invalid
        """
        parts = path.split('.')
        current = data

        for part in parts:
            if not part:
                # Empty part (e.g., from trailing dot)
                continue

            if '[' not in part:
                # Regular key access
                current = current[part]
                continue

            # Handle array indexing: items[0] or items[0][1]
            if not part.endswith(']'):
                # Part ends with incomplete bracket
                raise ValueError(f"Unmatched bracket in path: {part}")

            # Split into key and indices
            bracket_start = part.find('[')
            key = part[:bracket_start]
            indices_str = part[bracket_start:]

            # Access the key first (if present)
            if key:
                current = current[key]

            # Extract all indices: [0][1][2] -> [0, 1, 2]
            indices = []
            i = 0
            while i < len(indices_str):
                if indices_str[i] == '[':
                    # Find matching close bracket
                    close_bracket = indices_str.find(']', i)
                    if close_bracket == -1:
                        raise ValueError(f"Unmatched bracket in path: {part}")

                    # Extract index value
                    idx_str = indices_str[i+1:close_bracket]
                    try:
                        idx = int(idx_str)
                        indices.append(idx)
                    except ValueError:
                        raise ValueError(f"Invalid array index: {idx_str}")

                    i = close_bracket + 1
                else:
                    # Skip any other characters (shouldn't happen with valid syntax)
                    i += 1

            # Apply all array indices
            for idx in indices:
                if not isinstance(current, (list, tuple)):
                    raise TypeError(f"Cannot index non-list: {type(current)}")
                current = current[idx]

        return current

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize context to dict for database storage.

        Returns:
            Dict with input, steps, and context namespaces
        """
        return {
            "input": self.input_data,
            "steps": self.steps,
            "context": self.variables
        }

    def get_all_data(self) -> Dict[str, Any]:
        """
        Get all context data (alias for to_dict()).

        Returns:
            Dict with input, steps, and context namespaces
        """
        return self.to_dict()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorkflowContext":
        """
        Deserialize context from dict.

        Args:
            data: Dict with input, steps, and context namespaces

        Returns:
            WorkflowContext instance
        """
        context = cls(data.get("input", {}))
        context.steps = data.get("steps", {})
        context.variables = data.get("context", {})
        return context

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"WorkflowContext("
            f"input_keys={list(self.input_data.keys())}, "
            f"steps={list(self.steps.keys())}, "
            f"variables={list(self.variables.keys())}"
            f")"
        )
