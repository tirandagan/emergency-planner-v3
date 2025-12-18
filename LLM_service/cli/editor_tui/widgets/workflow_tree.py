"""
Workflow Tree Widget - Visual Overview of All Steps

Displays workflow steps in a hierarchical tree structure with:
- Step type icons
- Validation status indicators
- Keyboard navigation
- Step selection
"""

import re
from textual.widgets import Tree
from textual.widgets._tree import TreeNode
from typing import Dict, Any, List, Optional, Set


class WorkflowTree(Tree):
    """
    Visual tree widget showing workflow structure

    Features:
    - Hierarchical view of all steps
    - Type-specific icons
    - Validation status indicators
    - Keyboard-navigable
    """

    STEP_TYPE_ICONS = {
        "llm": "🤖",
        "transform": "⚙️",
        "external_api": "🌐",
        "conditional": "🔀",
        "parallel": "⚡"
    }

    def _extract_input_variables(self, workflow: Dict[str, Any]) -> Set[str]:
        """
        Extract all input variables referenced in workflow steps.

        Args:
            workflow: Workflow dictionary

        Returns:
            Set of input variable names (e.g., {"lat", "lng", "city"})
        """
        inputs = set()
        # Regex to find ${input.xxx} patterns
        pattern = re.compile(r'\$\{input\.([^}]+)\}')

        # Convert workflow to string and search
        import json
        workflow_str = json.dumps(workflow)
        matches = pattern.findall(workflow_str)
        inputs.update(matches)

        return inputs

    def load_workflow(
        self,
        workflow: Dict[str, Any],
        validation_errors: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        """
        Populate tree with workflow data

        Args:
            workflow: Workflow dictionary with metadata and steps
            validation_errors: Optional list of validation errors by step
        """
        self.clear()

        if not workflow.get("name"):
            self.root.set_label("📋 [dim]Untitled Workflow[/dim]")
            return

        # Root node: Workflow name
        workflow_name = workflow.get("name", "Untitled")
        workflow_version = workflow.get("version", "1.0.0")
        self.root.set_label(f"📋 [bold]{workflow_name}[/bold] [dim]v{workflow_version}[/dim]")

        # Metadata node
        metadata = self.root.add(
            f"ℹ️  [cyan]Metadata[/cyan]",
            data={"type": "metadata"}
        )
        metadata.add(f"Description: {workflow.get('description', 'None')}")
        metadata.add(f"Timeout: {workflow.get('timeout_seconds', 300)}s")

        # Inputs node - show required workflow inputs
        input_vars = self._extract_input_variables(workflow)
        if input_vars:
            inputs_node = self.root.add(
                f"📥 [cyan]Required Inputs ({len(input_vars)})[/cyan]",
                data={"type": "inputs_header"}
            )
            for var in sorted(input_vars):
                inputs_node.add(f"• [yellow]{var}[/yellow]")

        # Steps node
        steps_node = self.root.add(
            f"📝 [cyan]Steps ({len(workflow.get('steps', []))})[/cyan]",
            data={"type": "steps_header"}
        )

        # Add each step
        for idx, step in enumerate(workflow.get("steps", [])):
            self._add_step_node(steps_node, step, idx, validation_errors)

        self.root.expand()

    def _add_step_node(
        self,
        parent: TreeNode,
        step: Dict[str, Any],
        index: int,
        validation_errors: Optional[List[Dict[str, Any]]] = None
    ) -> TreeNode:
        """Add step node to tree"""
        # Get step metadata
        step_id = step.get("id", f"step_{index}")
        step_type = step.get("type", "unknown")
        error_mode = step.get("error_mode", "fail")

        # Get type icon
        icon = self.STEP_TYPE_ICONS.get(step_type, "❓")

        # Check validation status
        has_errors = False
        if validation_errors:
            has_errors = any(
                err.get("step_index") == index
                for err in validation_errors
            )

        status = "❌" if has_errors else "✅"

        # Create step label
        label = f"{status} {icon} [bold]{step_id}[/bold] [dim]({step_type}, {error_mode})[/dim]"

        # Add step node
        step_node = parent.add(
            label,
            data={"type": "step", "index": index, "step_id": step_id}
        )

        # Add step details as children
        config = step.get("config", {})

        if step_type == "llm":
            model = config.get("model", "unknown")
            temp = config.get("temperature", 0.7)
            max_tok = config.get("max_tokens", 4000)
            step_node.add(f"Model: {model}")
            step_node.add(f"Temperature: {temp}, Max Tokens: {max_tok}")

            prompt_template = config.get("prompt_template")
            if prompt_template:
                step_node.add(f"Template: {prompt_template}")

        elif step_type == "transform":
            operation = config.get("operation", "unknown")
            step_node.add(f"Operation: {operation}")

        elif step_type == "external_api":
            service = config.get("service", "unknown")
            operation = config.get("operation", "unknown")
            step_node.add(f"Service: {service}")
            step_node.add(f"Operation: {operation}")
            cache_ttl = config.get("cache_ttl")
            if cache_ttl:
                step_node.add(f"Cache TTL: {cache_ttl}s")

        return step_node

    def get_selected_step_index(self) -> Optional[int]:
        """Get index of currently selected step"""
        if not self.cursor_node:
            return None

        node_data = self.cursor_node.data
        if node_data and node_data.get("type") == "step":
            return node_data.get("index")

        return None

    def select_step_by_index(self, index: int) -> bool:
        """Select step by index programmatically"""
        # Find step node with matching index
        for node in self.root.walk():
            node_data = node.data
            if node_data and node_data.get("type") == "step" and node_data.get("index") == index:
                self.select_node(node)
                node.expand()
                return True

        return False
