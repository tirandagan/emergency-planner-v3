"""
Editor State Management - Reactive state for Textual TUI

Manages workflow data, selection state, validation errors, and action history
for the interactive workflow editor.
"""

import copy
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class EditorState:
    """
    Central state management for editor

    Tracks workflow data, current selection, validation status,
    and unsaved changes for the TUI application.
    """

    workflow: Dict[str, Any] = field(default_factory=lambda: {
        "name": "",
        "version": "1.0.0",
        "description": "",
        "steps": [],
        "timeout_seconds": 300
    })

    selected_step_index: int = -1
    validation_errors: List[Dict[str, Any]] = field(default_factory=list)
    unsaved_changes: bool = False
    workflow_path: Optional[str] = None

    def get_selected_step(self) -> Optional[Dict[str, Any]]:
        """Get currently selected step"""
        if 0 <= self.selected_step_index < len(self.workflow["steps"]):
            return self.workflow["steps"][self.selected_step_index]
        return None

    def update_step(self, index: int, step_data: Dict[str, Any]) -> None:
        """Update step at given index"""
        if 0 <= index < len(self.workflow["steps"]):
            self.workflow["steps"][index] = step_data
            self.unsaved_changes = True

    def add_step(self, step_data: Dict[str, Any], index: Optional[int] = None) -> None:
        """Add new step at specified index (or end if not specified)"""
        if index is None:
            self.workflow["steps"].append(step_data)
        else:
            self.workflow["steps"].insert(index, step_data)
        self.unsaved_changes = True

    def remove_step(self, index: int) -> Optional[Dict[str, Any]]:
        """Remove step at given index"""
        if 0 <= index < len(self.workflow["steps"]):
            step = self.workflow["steps"].pop(index)
            self.unsaved_changes = True
            return step
        return None

    def move_step(self, from_index: int, to_index: int) -> bool:
        """Move step from one position to another"""
        steps = self.workflow["steps"]
        if 0 <= from_index < len(steps) and 0 <= to_index < len(steps):
            step = steps.pop(from_index)
            steps.insert(to_index, step)
            self.unsaved_changes = True
            return True
        return False

    def get_available_variables(self, current_step_index: Optional[int] = None) -> List[str]:
        """
        Get list of available variable references for autocomplete

        Includes:
        - ${input.*} variables
        - ${steps.*.output} variables from previous steps
        - ${steps.*.config.*} variables
        """
        variables = [
            "${input.lat}",
            "${input.lng}",
            "${input.city}",
            "${input.state}",
            "${input.country}",
            "${input.scenarios}",
            "${input.family_size}",
            "${input.duration}",
            "${input.user_tier}",
        ]

        # Add variables from previous steps
        max_index = current_step_index if current_step_index is not None else len(self.workflow["steps"])
        for i, step in enumerate(self.workflow["steps"][:max_index]):
            step_id = step.get("id", f"step_{i}")
            variables.append(f"${{steps.{step_id}.output}}")
            variables.append(f"${{steps.{step_id}.output.data}}")
            variables.append(f"${{steps.{step_id}.output.content}}")

            # Add config variables if they exist
            config = step.get("config", {})
            for key in config.keys():
                variables.append(f"${{steps.{step_id}.config.{key}}}")

        return variables

    def validate_step_id_unique(self, step_id: str, exclude_index: Optional[int] = None) -> bool:
        """Check if step ID is unique (excluding specified index)"""
        for i, step in enumerate(self.workflow["steps"]):
            if i != exclude_index and step.get("id") == step_id:
                return False
        return True

    def get_snapshot(self) -> Dict[str, Any]:
        """Get deep copy of current state for undo/redo"""
        return {
            "workflow": copy.deepcopy(self.workflow),
            "selected_step_index": self.selected_step_index,
            "workflow_path": self.workflow_path
        }

    def restore_snapshot(self, snapshot: Dict[str, Any]) -> None:
        """Restore state from snapshot"""
        self.workflow = copy.deepcopy(snapshot["workflow"])
        self.selected_step_index = snapshot["selected_step_index"]
        self.workflow_path = snapshot.get("workflow_path")
        self.unsaved_changes = True
