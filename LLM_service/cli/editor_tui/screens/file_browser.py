"""
File Browser Screen - Select Workflow to Open

Modal screen for browsing and selecting workflow JSON files
from the configured workflow folder.
"""

from pathlib import Path
from typing import Optional, List
from textual.app import ComposeResult
from textual.screen import ModalScreen
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Static, ListView, ListItem, Label, Button, Input
from textual.message import Message


class FileBrowserScreen(ModalScreen):
    """
    Modal screen for browsing and selecting workflow files

    Features:
    - Lists all .json files in workflow folder
    - Shows file size and modification time
    - Filter by filename
    - Recent files at top
    - Keyboard navigation (Enter to select, Esc to cancel)
    """

    CSS = """
    FileBrowserScreen {
        align: center middle;
    }

    #file-browser-container {
        width: 80;
        height: 30;
        background: $panel;
        border: thick $primary;
    }

    #browser-header {
        background: $boost;
        padding: 1;
        dock: top;
    }

    #browser-filter {
        margin: 1 2;
    }

    #file-list {
        height: 1fr;
        margin: 1 2;
    }

    #browser-footer {
        dock: bottom;
        height: 3;
        background: $panel;
        padding: 1;
    }
    """

    class FileSelected(Message):
        """Message sent when file is selected"""
        def __init__(self, filepath: Path) -> None:
            self.filepath = filepath
            super().__init__()

    def __init__(
        self,
        workflow_folder: Path,
        recent_files: Optional[List[str]] = None
    ):
        """
        Initialize file browser

        Args:
            workflow_folder: Path to folder containing workflows
            recent_files: List of recently opened file paths
        """
        super().__init__()
        self.workflow_folder = workflow_folder
        self.current_folder = workflow_folder  # Track current navigation location
        self.recent_files = recent_files or []
        self.all_files: List[Path] = []
        self.all_directories: List[Path] = []
        self.filtered_files: List[Path] = []
        self.filtered_directories: List[Path] = []

    def compose(self) -> ComposeResult:
        """Create file browser layout"""
        with Container(id="file-browser-container"):
            yield Static(
                f"📂 [bold cyan]Open Workflow[/bold cyan] - {self.current_folder}",
                id="browser-header"
            )

            yield Input(
                placeholder="Filter by filename...",
                id="browser-filter"
            )

            yield ListView(id="file-list")

            with Horizontal(id="browser-footer"):
                yield Button("Open", variant="primary", id="btn-open")
                yield Button("Cancel", variant="default", id="btn-cancel")

    def on_mount(self) -> None:
        """Initialize file list on mount"""
        self._load_files()
        self._update_file_list()

    def _load_files(self) -> None:
        """Load all workflow JSON files and directories from current folder"""
        self.all_files = []
        self.all_directories = []

        if not self.current_folder.exists():
            return

        # Find all subdirectories
        try:
            for item_path in sorted(self.current_folder.iterdir()):
                if item_path.is_dir():
                    self.all_directories.append(item_path)
                elif item_path.is_file() and item_path.suffix == ".json":
                    self.all_files.append(item_path)
        except PermissionError:
            # Skip if we don't have permission to read directory
            pass

        self.filtered_files = self.all_files.copy()
        self.filtered_directories = self.all_directories.copy()

    def _update_file_list(self, filter_text: str = "") -> None:
        """
        Update file list with optional filter

        Args:
            filter_text: Filter string to match against filename
        """
        # Filter directories and files
        if filter_text:
            self.filtered_directories = [
                d for d in self.all_directories
                if filter_text.lower() in d.name.lower()
            ]
            self.filtered_files = [
                f for f in self.all_files
                if filter_text.lower() in f.name.lower()
            ]
        else:
            self.filtered_directories = self.all_directories.copy()
            self.filtered_files = self.all_files.copy()

        # Sort files: recent files first, then alphabetically
        recent_paths = {Path(f) for f in self.recent_files}
        recent = [f for f in self.filtered_files if f in recent_paths]
        other = [f for f in self.filtered_files if f not in recent_paths]
        sorted_files = recent + sorted(other, key=lambda x: x.name)

        # Sort directories alphabetically
        sorted_directories = sorted(self.filtered_directories, key=lambda x: x.name)

        # Update list view
        file_list = self.query_one("#file-list", ListView)
        file_list.clear()

        # Add ".." to go up if not at root
        if self.current_folder.parent != self.current_folder:
            item = ListItem(Label("📁 [bold]..[/bold] [dim](parent directory)[/dim]"))
            item.metadata = {"type": "parent"}
            file_list.append(item)

        # Add directories
        for dir_path in sorted_directories:
            item = ListItem(Label(f"📁 [bold]{dir_path.name}/[/bold]"))
            item.metadata = {"type": "directory", "path": dir_path}
            file_list.append(item)

        # Add files
        if not sorted_files and not sorted_directories:
            if self.current_folder.parent == self.current_folder:
                # At root with no items
                file_list.append(ListItem(Label("[dim]No workflow files found[/dim]")))
            return

        for file_path in sorted_files:
            # Get file info
            size_kb = file_path.stat().st_size / 1024
            is_recent = file_path in recent_paths

            # Create list item label
            if is_recent:
                label_text = f"⭐ 📄 {file_path.name}  [dim]{size_kb:.1f} KB[/dim]"
            else:
                label_text = f"📄 {file_path.name}  [dim]{size_kb:.1f} KB[/dim]"

            item = ListItem(Label(label_text))
            item.metadata = {"type": "file", "path": file_path}
            file_list.append(item)

    def on_input_changed(self, event: Input.Changed) -> None:
        """Handle filter input changes"""
        if event.input.id == "browser-filter":
            self._update_file_list(event.value)

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        """Handle file/directory selection from list"""
        if not event.item.metadata:
            return

        metadata = event.item.metadata

        if isinstance(metadata, dict):
            if metadata.get("type") == "parent":
                # Navigate to parent directory
                self._navigate_to_parent()
            elif metadata.get("type") == "directory":
                # Navigate into directory
                self._navigate_to_directory(metadata["path"])
            elif metadata.get("type") == "file":
                # Open file
                self._open_file(metadata["path"])
        else:
            # Legacy metadata format (direct path)
            self._open_file(metadata)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button clicks"""
        if event.button.id == "btn-open":
            # Get selected item
            file_list = self.query_one("#file-list", ListView)
            if file_list.index is not None and file_list.index < len(file_list.children):
                item = file_list.children[file_list.index]
                if hasattr(item, 'metadata') and item.metadata:
                    metadata = item.metadata
                    if isinstance(metadata, dict):
                        if metadata.get("type") == "file":
                            self._open_file(metadata["path"])
                        elif metadata.get("type") == "directory":
                            self._navigate_to_directory(metadata["path"])
                        elif metadata.get("type") == "parent":
                            self._navigate_to_parent()
                    else:
                        self._open_file(metadata)
        elif event.button.id == "btn-cancel":
            self.dismiss(None)

    def _navigate_to_parent(self) -> None:
        """Navigate to parent directory"""
        self.current_folder = self.current_folder.parent
        self._refresh_view()

    def _navigate_to_directory(self, directory: Path) -> None:
        """Navigate into a subdirectory"""
        self.current_folder = directory
        self._refresh_view()

    def _refresh_view(self) -> None:
        """Refresh the file browser view after navigation"""
        # Update header
        header = self.query_one("#browser-header", Static)
        header.update(f"📂 [bold cyan]Open Workflow[/bold cyan] - {self.current_folder}")

        # Reload files and directories
        self._load_files()

        # Clear filter and update list
        filter_input = self.query_one("#browser-filter", Input)
        filter_input.value = ""
        self._update_file_list()

    def _open_file(self, filepath: Path) -> None:
        """Open selected file"""
        self.dismiss(filepath)

    def on_key(self, event) -> None:
        """Handle keyboard shortcuts"""
        if event.key == "escape":
            self.dismiss(None)
        elif event.key == "backspace":
            # Navigate to parent directory on backspace
            if self.current_folder.parent != self.current_folder:
                self._navigate_to_parent()
