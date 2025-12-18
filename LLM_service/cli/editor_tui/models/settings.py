"""
Editor Settings - Persistent Configuration

Manages editor settings with JSON persistence to user config directory.
Default location: ~/.config/llm-workflow-editor/settings.json
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class EditorSettings:
    """
    Editor configuration settings

    Attributes:
        workflow_folder: Path to folder containing workflow JSON files
        auto_save: Enable auto-save every N seconds (0 = disabled)
        theme: Color theme preference (default, dark, light)
        recent_files: List of recently opened workflow files
    """

    workflow_folder: str = "workflows/definitions"
    auto_save: int = 0  # seconds, 0 = disabled
    theme: str = "default"
    recent_files: list = None

    def __post_init__(self):
        if self.recent_files is None:
            self.recent_files = []

    @staticmethod
    def get_config_path() -> Path:
        """Get path to settings file in user config directory"""
        # Try XDG_CONFIG_HOME first, fallback to ~/.config
        xdg_config = Path.home() / ".config"
        config_dir = xdg_config / "llm-workflow-editor"
        config_dir.mkdir(parents=True, exist_ok=True)
        return config_dir / "settings.json"

    @classmethod
    def load(cls) -> "EditorSettings":
        """
        Load settings from config file

        Returns:
            EditorSettings instance with loaded or default values
        """
        config_path = cls.get_config_path()

        if not config_path.exists():
            # Return defaults
            return cls()

        try:
            with open(config_path, 'r') as f:
                data = json.load(f)
                return cls(**data)
        except Exception as e:
            # If load fails, return defaults
            print(f"Warning: Could not load settings from {config_path}: {e}")
            return cls()

    def save(self) -> None:
        """Save settings to config file"""
        config_path = self.get_config_path()

        try:
            with open(config_path, 'w') as f:
                json.dump(asdict(self), f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save settings to {config_path}: {e}")

    def add_recent_file(self, filepath: str, max_recent: int = 10) -> None:
        """
        Add file to recent files list

        Args:
            filepath: Path to workflow file
            max_recent: Maximum number of recent files to keep
        """
        # Remove if already in list
        if filepath in self.recent_files:
            self.recent_files.remove(filepath)

        # Add to front of list
        self.recent_files.insert(0, filepath)

        # Trim to max size
        self.recent_files = self.recent_files[:max_recent]

    def get_workflow_folder_path(self) -> Path:
        """Get Path object for workflow folder"""
        return Path(self.workflow_folder)

    def set_workflow_folder(self, folder_path: str) -> None:
        """Set workflow folder path"""
        self.workflow_folder = folder_path

    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return asdict(self)
