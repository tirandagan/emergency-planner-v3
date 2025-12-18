"""
Action History - Undo/Redo System

Command pattern implementation for tracking editor actions
and enabling undo/redo functionality with state snapshots.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class EditorAction:
    """
    Represents a single editor action that can be undone/redone

    Stores state snapshots before and after the action for reliable undo/redo.
    """

    description: str
    before_snapshot: Dict[str, Any]
    after_snapshot: Dict[str, Any]


class ActionHistory:
    """
    Command pattern for undo/redo functionality

    Maintains history of editor actions with configurable max size.
    Supports undo/redo operations with automatic pruning of redo stack.
    """

    def __init__(self, max_history: int = 50):
        """
        Initialize action history

        Args:
            max_history: Maximum number of actions to store
        """
        self.max_history = max_history
        self.actions: List[EditorAction] = []
        self.current_index: int = -1  # Points to current state

    def record_action(
        self,
        description: str,
        before_snapshot: Dict[str, Any],
        after_snapshot: Dict[str, Any]
    ) -> None:
        """
        Record a new action in history

        Removes any actions after current index (redo stack)
        and adds new action to history.

        Args:
            description: Human-readable action description
            before_snapshot: State before action
            after_snapshot: State after action
        """
        # Remove all actions after current index (clear redo stack)
        self.actions = self.actions[:self.current_index + 1]

        # Add new action
        action = EditorAction(
            description=description,
            before_snapshot=before_snapshot,
            after_snapshot=after_snapshot
        )
        self.actions.append(action)

        # Enforce max history size
        if len(self.actions) > self.max_history:
            self.actions = self.actions[-self.max_history:]

        # Update current index to point to latest action
        self.current_index = len(self.actions) - 1

    def can_undo(self) -> bool:
        """Check if undo is available"""
        return self.current_index >= 0

    def can_redo(self) -> bool:
        """Check if redo is available"""
        return self.current_index < len(self.actions) - 1

    def undo(self) -> Optional[Dict[str, Any]]:
        """
        Undo last action and return previous state

        Returns:
            State snapshot to restore, or None if no undo available
        """
        if not self.can_undo():
            return None

        action = self.actions[self.current_index]
        self.current_index -= 1

        return action.before_snapshot

    def redo(self) -> Optional[Dict[str, Any]]:
        """
        Redo next action and return next state

        Returns:
            State snapshot to restore, or None if no redo available
        """
        if not self.can_redo():
            return None

        self.current_index += 1
        action = self.actions[self.current_index]

        return action.after_snapshot

    def get_undo_description(self) -> Optional[str]:
        """Get description of action that would be undone"""
        if self.can_undo():
            return self.actions[self.current_index].description
        return None

    def get_redo_description(self) -> Optional[str]:
        """Get description of action that would be redone"""
        if self.can_redo():
            return self.actions[self.current_index + 1].description
        return None

    def clear(self) -> None:
        """Clear all action history"""
        self.actions = []
        self.current_index = -1

    def get_history_summary(self) -> List[str]:
        """Get list of all action descriptions for debugging"""
        return [f"{'*' if i == self.current_index else ' '} {action.description}"
                for i, action in enumerate(self.actions)]
