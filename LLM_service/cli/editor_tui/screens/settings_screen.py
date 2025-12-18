"""
Settings Screen - Configure Editor Settings

Modal screen for configuring editor preferences including
workflow folder path, auto-save interval, and theme.
"""

from pathlib import Path
from textual.app import ComposeResult
from textual.screen import ModalScreen
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Static, Input, Label, Button, Switch
from textual.message import Message

from ..models.settings import EditorSettings


class SettingsScreen(ModalScreen):
    """
    Modal screen for editing editor settings

    Features:
    - Configure workflow folder path
    - Set auto-save interval
    - Choose theme preference
    - Save/cancel changes
    """

    CSS = """
    SettingsScreen {
        align: center middle;
    }

    #settings-container {
        width: 70;
        height: 25;
        background: $panel;
        border: thick $primary;
    }

    #settings-header {
        background: $boost;
        padding: 1;
        dock: top;
    }

    #settings-content {
        padding: 2;
        height: 1fr;
    }

    .settings-row {
        height: auto;
        margin: 1 0;
    }

    .settings-label {
        width: 20;
        content-align: right middle;
        padding-right: 2;
    }

    .settings-input {
        width: 1fr;
    }

    .settings-help {
        margin-left: 22;
        color: $text-muted;
    }

    #settings-footer {
        dock: bottom;
        height: 3;
        background: $panel;
        padding: 1;
    }
    """

    class SettingsSaved(Message):
        """Message sent when settings are saved"""
        def __init__(self, settings: EditorSettings) -> None:
            self.settings = settings
            super().__init__()

    def __init__(self, settings: EditorSettings):
        """
        Initialize settings screen

        Args:
            settings: Current editor settings
        """
        super().__init__()
        self.settings = settings.to_dict()  # Work with copy

    def compose(self) -> ComposeResult:
        """Create settings screen layout"""
        with Container(id="settings-container"):
            yield Static(
                "⚙️  [bold cyan]Editor Settings[/bold cyan]",
                id="settings-header"
            )

            with Vertical(id="settings-content"):
                # Workflow folder
                with Horizontal(classes="settings-row"):
                    yield Label("Workflow Folder:", classes="settings-label")
                    yield Input(
                        value=self.settings["workflow_folder"],
                        placeholder="workflows/definitions",
                        id="setting-workflow-folder",
                        classes="settings-input"
                    )
                yield Label(
                    "Path to folder containing workflow JSON files (relative or absolute)",
                    classes="settings-help"
                )

                # Auto-save interval
                with Horizontal(classes="settings-row"):
                    yield Label("Auto-save (sec):", classes="settings-label")
                    yield Input(
                        value=str(self.settings["auto_save"]),
                        placeholder="0",
                        id="setting-auto-save",
                        classes="settings-input",
                        type="integer"
                    )
                yield Label(
                    "Auto-save interval in seconds (0 = disabled)",
                    classes="settings-help"
                )

                # Theme
                with Horizontal(classes="settings-row"):
                    yield Label("Theme:", classes="settings-label")
                    yield Input(
                        value=self.settings["theme"],
                        placeholder="default",
                        id="setting-theme",
                        classes="settings-input"
                    )
                yield Label(
                    "Color theme (default, dark, light)",
                    classes="settings-help"
                )

            with Horizontal(id="settings-footer"):
                yield Button("Save", variant="primary", id="btn-save")
                yield Button("Cancel", variant="default", id="btn-cancel")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button clicks"""
        if event.button.id == "btn-save":
            self._save_settings()
        elif event.button.id == "btn-cancel":
            self.dismiss(None)

    def _save_settings(self) -> None:
        """Validate and save settings"""
        # Get input values
        workflow_folder = self.query_one("#setting-workflow-folder", Input).value
        auto_save_str = self.query_one("#setting-auto-save", Input).value
        theme = self.query_one("#setting-theme", Input).value

        # Validate inputs
        if not workflow_folder:
            self.notify("Workflow folder path is required", severity="error")
            return

        try:
            auto_save = int(auto_save_str) if auto_save_str else 0
            if auto_save < 0:
                self.notify("Auto-save interval must be >= 0", severity="error")
                return
        except ValueError:
            self.notify("Invalid auto-save interval", severity="error")
            return

        # Create updated settings
        updated_settings = EditorSettings(
            workflow_folder=workflow_folder,
            auto_save=auto_save,
            theme=theme,
            recent_files=self.settings["recent_files"]
        )

        # Save to disk
        updated_settings.save()

        # Notify app
        self.post_message(self.SettingsSaved(updated_settings))
        self.dismiss(updated_settings)

    def on_key(self, event) -> None:
        """Handle keyboard shortcuts"""
        if event.key == "escape":
            self.dismiss(None)
