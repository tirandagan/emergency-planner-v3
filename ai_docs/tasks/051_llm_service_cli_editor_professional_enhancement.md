# AI Task: LLM Service CLI Workflow Editor - Professional Enhancement

**Task ID:** 051
**Created:** 2024-12-18
**Status:** Pending Approval
**Priority:** High
**Estimated Complexity:** High (5-7 days)

---

## 1. Task Overview

### Task Title
**LLM Service CLI Workflow Editor - Professional UX Enhancement**

### Goal Statement
Transform the current basic CLI workflow editor into a professional-grade development tool that makes creating and editing complex workflow JSON files intuitive, fast, and error-free. The enhanced editor will pre-populate existing workflow data, provide visual navigation, support bulk operations, and offer real-time validation with context-aware assistance.

**Why This Matters:**
- Current editor requires re-entering step data for edits (UX friction)
- No visual overview makes navigation through multi-step workflows difficult
- Manual variable/service reference entry is error-prone
- Missing real-time validation causes late error discovery
- No bulk operations for common workflow management tasks

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The LLM_service CLI editor provides basic workflow creation but lacks critical professional features. Users must manually re-enter configuration when editing steps, have no visual overview of complex workflows, and receive validation feedback only at save time. This creates friction for workflow developers and increases error rates.

**Why Multiple Solutions Exist:**
This enhancement could be achieved through incremental CLI improvements OR a complete architectural shift to a TUI/web interface. Each approach has different trade-offs for development time, user experience, and maintenance complexity.

### Solution Options Analysis

#### Option 1: Incremental CLI Enhancement (questionary + rich)
**Approach:** Enhance existing `cli/editor.py` with improved features while maintaining current questionary/rich stack

**Pros:**
- ✅ **Low risk** - Builds on existing, working architecture
- ✅ **Faster implementation** - No new framework learning curve (2-3 days)
- ✅ **Backward compatible** - Existing users familiar with interface
- ✅ **Minimal dependencies** - Uses current stack (questionary 2.0.1 + rich 13.7.0)
- ✅ **Easier debugging** - Simple flow, familiar patterns

**Cons:**
- ❌ **Limited UI capabilities** - questionary's select/text inputs are basic
- ❌ **No true visual navigation** - Can't show live workflow diagram
- ❌ **Harder undo/redo** - Must implement custom command pattern
- ❌ **No autocomplete** - questionary doesn't support inline suggestions
- ❌ **Sequential interaction** - Can't edit multiple fields simultaneously

**Implementation Complexity:** Low-Medium - Refactor existing 430-line file, add 200-300 lines for new features
**Risk Level:** Low - Minimal framework changes, incremental improvements

---

#### Option 2: Textual TUI Framework (Full Terminal UI)
**Approach:** Rebuild editor using Textual framework for modern, reactive terminal interface

**Pros:**
- ✅ **Professional UI** - Panels, live updates, keyboard navigation
- ✅ **Visual workflow tree** - See all steps simultaneously in sidebar
- ✅ **Real-time validation** - Inline error messages as you type
- ✅ **Autocomplete support** - Context-aware suggestions for variables/services
- ✅ **Multi-panel layout** - Edit step config + preview JSON + validation panel
- ✅ **Undo/Redo built-in** - Textual's widget system supports state management
- ✅ **Still CLI-based** - No web dependencies, runs in terminal

**Cons:**
- ❌ **Learning curve** - Team must learn Textual framework (reactive/async patterns)
- ❌ **Full rewrite** - Can't reuse much of existing `cli/editor.py` code
- ❌ **New dependency** - Adds textual package (active project, well-maintained)
- ❌ **More complex architecture** - Widgets, events, async handlers

**Implementation Complexity:** Medium-High - Complete rewrite (~800-1000 lines), new architecture
**Risk Level:** Medium - New framework but well-documented, active community

---

#### Option 3: Web-Based UI (React + Monaco Editor)
**Approach:** Build modern web application for workflow editing with visual node editor

**Pros:**
- ✅ **Best UX possible** - Full graphical interface, drag-and-drop, visual connections
- ✅ **Monaco editor** - VSCode-quality JSON editing with autocomplete
- ✅ **Visual workflow diagram** - Real node-based editor (like n8n, Node-RED)
- ✅ **Team collaboration** - Multi-user editing, sharing, version history
- ✅ **Advanced features** - Diff viewer, Git integration, template marketplace
- ✅ **Modern stack** - React, TypeScript, familiar to web developers

**Cons:**
- ❌ **Massive scope** - Full frontend + backend API development (2-3 weeks)
- ❌ **Infrastructure overhead** - Requires web server, auth, database
- ❌ **Context switch** - Developers must leave terminal for GUI
- ❌ **Deployment complexity** - Must host web app, manage updates
- ❌ **Over-engineering** - May be too heavy for current use case

**Implementation Complexity:** High - Full stack application (~2000+ lines frontend + API)
**Risk Level:** Medium-High - Large scope, deployment requirements, infrastructure costs

---

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Textual TUI Framework

**Why this is the best choice:**

1. **Optimal UX/Effort Ratio** - Delivers 80% of web UI benefits (visual layout, real-time validation, navigation) with 40% of the development effort
2. **Stays in Developer Workflow** - Terminal-based means no context switching, integrates with existing CLI commands
3. **Professional Grade** - Textual is production-ready (used by projects like rich-cli, trogon), provides modern TUI patterns
4. **Maintainable** - Framework is well-documented, has active community, and aligns with Python ecosystem
5. **Future-Proof** - Can always add web UI later if needed; Textual editor becomes CLI power-user tool

**Key Decision Factors:**
- **Performance Impact:** Minimal - Textual is performant, no network latency
- **User Experience:** Major improvement - visual overview, real-time feedback, keyboard shortcuts
- **Maintainability:** Good - Textual's reactive model is cleaner than manual questionary state management
- **Scalability:** Excellent - Handles complex workflows better than sequential prompts
- **Security:** No change - Still local files, no web attack surface

**Alternative Consideration:**
Option 1 (incremental enhancement) would be chosen if:
- Team has zero bandwidth for learning new framework
- Need features shipped in 2-3 days maximum
- Workflow complexity stays low (3-5 steps average)

However, given the complexity of workflows like `mission_generation.json` (7 steps, 125 lines), the visual navigation and real-time validation of Textual justify the moderate learning investment.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with **Option 2 (Textual TUI Framework)**, or would you prefer a different approach?

**Questions for you to consider:**
- Is the 3-5 day implementation timeline acceptable for a professional-grade editor?
- Are you comfortable with a full rewrite using Textual framework?
- Would you prefer the faster but more limited Option 1 (incremental CLI) instead?
- Is there a compelling reason to consider the web UI path (Option 3)?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan with detailed phases for the Textual TUI editor.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Python 3.11+ CLI application
- **Current Libraries:**
  - `questionary 2.0.1` - Interactive prompts (select, text input)
  - `rich 13.7.0` - Terminal formatting (tables, trees, syntax highlighting)
  - `pydantic 2.5.3` - Schema validation for workflow JSON
  - `httpx 0.26.0` - HTTP client for external services
  - `python-dotenv 1.0.0` - Environment configuration
- **Backend Integration:** FastAPI 0.109.0 (LLM_service API)
- **Database:** PostgreSQL (for job tracking, not workflows)
- **Workflow Storage:** JSON files in `LLM_service/workflows/definitions/`
- **Key Architectural Patterns:**
  - Command pattern (CLI commands: validate, dry-run, edit, diagram)
  - Plugin pattern (external services, transformations)
  - Schema-driven validation (Pydantic models)
  - Variable substitution system (`${namespace.path}`)

### Current State
**Existing Implementation (`LLM_service/app/cli/editor.py` - 430 lines):**

**Strengths:**
- ✅ Interactive step-by-step workflow creation
- ✅ Three step types: LLM, transform, external_api
- ✅ JSON validation on save
- ✅ Rich terminal output for workflow display
- ✅ Metadata management (name, version, description, timeout)

**Weaknesses:**
- ❌ **No edit-in-place**: Editing a step removes it and re-adds at end of array
- ❌ **No pre-population**: Must re-enter all config when editing
- ❌ **No visual overview**: Can't see all steps simultaneously
- ❌ **No bulk operations**: Can't reorder, copy, or batch-edit steps
- ❌ **Manual variable entry**: No autocomplete for `${steps.*.field}` references
- ❌ **Late validation**: Only validated on save, not during editing
- ❌ **No undo/redo**: Mistakes can't be recovered
- ❌ **Limited navigation**: Must go through main menu for each action

**Current Editor Flow:**
```
Main Menu → Setup Metadata → Add Step → Configure Step Type → Save
                ↑______________|
```

**Real Workflow Complexity Example (`mission_generation.json`):**
- 7 steps with complex variable dependencies
- References to 5+ external prompt files
- Nested variable substitution: `${steps.build_scenario_list.scenario_list}`
- Mix of transform, template, and LLM steps
- Cost tracking across multiple LLM calls

### Existing Context Providers Analysis
Not applicable - This is a CLI tool, not a React application. No context providers.

---

## 4. Context & Problem Definition

### Problem Statement
Workflow developers using the LLM_service CLI editor face significant friction when creating and maintaining complex multi-step workflows:

1. **Editing Friction**: Modifying an existing step requires deleting and re-creating it, losing its position in the workflow and requiring re-entry of all configuration
2. **Poor Visibility**: No way to see all steps simultaneously; must rely on memory or switch to viewing raw JSON
3. **Error-Prone Manual Entry**: Variable references like `${steps.format_data.output}` must be typed manually without autocomplete, causing typos
4. **Late Error Discovery**: Validation only runs on save, meaning configuration errors discovered after significant work
5. **Limited Workflow Management**: No way to reorder steps, duplicate common patterns, or perform bulk operations

**User Impact:**
- 5-10 minutes to edit simple workflows becomes 20-30 minutes for complex ones
- High error rates from manual variable reference entry
- Frustration from lost work (no undo) and poor navigation
- Developers resort to editing JSON directly, bypassing the editor

**Why This Needs Solving:**
Workflows are becoming increasingly complex (7+ steps, multiple services, nested variables). The current editor was designed for simple 2-3 step workflows and doesn't scale to professional use cases. Improving the editor will:
- Reduce workflow development time by 50-70%
- Decrease error rates through real-time validation
- Enable developers to maintain complex workflows confidently
- Make the CLI editor a competitive alternative to manual JSON editing

### Success Criteria
- [ ] **Pre-population**: Editing existing workflows shows current values in all fields
- [ ] **Visual Overview**: Can see all steps in workflow simultaneously (table or tree view)
- [ ] **Edit-in-Place**: Modifying a step preserves its position in the workflow
- [ ] **Real-Time Validation**: Inline error/warning feedback during editing
- [ ] **Variable Autocomplete**: Context-aware suggestions for `${...}` references
- [ ] **Step Reordering**: Can move steps up/down in workflow
- [ ] **Bulk Operations**: Can duplicate steps, change error modes across multiple steps
- [ ] **Undo/Redo**: Can recover from mistakes (at least 10 action history)
- [ ] **Fast Navigation**: Keyboard shortcuts to jump between steps, sections
- [ ] **Load Time**: Opening existing workflow takes <1 second

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is an active microservice in production use**
- **Backward compatibility required** - Existing workflows must continue working
- **API stability critical** - Don't break `/api/v1/workflow` endpoint
- **File format fixed** - JSON schema cannot change (Pydantic validation)
- **Users are developers** - Power users comfortable with terminal tools
- **Priority: Developer velocity** over GUI polish
- **Breaking the CLI is acceptable** - Can refactor editor UX without version constraints

**Critical Constraint:** The workflow JSON schema and API contracts are frozen. This task only modifies the CLI editor UX, not the underlying workflow system.

---

## 6. Technical Requirements

### Functional Requirements
- **FR1: Workflow Loading**
  - User can select workflow from `LLM_service/workflows/definitions/` directory
  - Editor pre-populates all fields with existing workflow data
  - Supports creating new workflows from scratch

- **FR2: Visual Overview**
  - Display all workflow steps in tree or table format
  - Show step ID, type, and summary in compact view
  - Highlight validation errors/warnings per step

- **FR3: Step Editing**
  - Edit step configuration in-place without removing from workflow
  - Pre-populate all fields with current values
  - Show before/after comparison for changes

- **FR4: Navigation**
  - Jump to specific step by number or ID
  - Keyboard shortcuts (↑/↓ arrow keys, vim-style hjkl)
  - Tab between workflow sections (metadata, steps, validation)

- **FR5: Real-Time Validation**
  - Validate step configuration as user types
  - Show inline error messages with suggested fixes
  - Highlight invalid variable references
  - Check service/operation availability

- **FR6: Variable Assistance**
  - Autocomplete for `${steps.*.field}` references
  - Show available output variables from previous steps
  - Suggest valid input fields (`${input.*}`)
  - Preview variable values in dry-run mode

- **FR7: Bulk Operations**
  - Reorder steps (move up/down)
  - Duplicate step with incremental ID
  - Change error mode across multiple steps
  - Delete multiple steps at once

- **FR8: History Management**
  - Undo last N actions (minimum 10)
  - Redo undone actions
  - Show action history (optional)

- **FR9: Service/Operation Browser**
  - List available external services with descriptions
  - Show service operations and parameters
  - List transformation operations with examples
  - Copy operation template to step config

### Non-Functional Requirements
- **Performance:**
  - Load workflow <1 second (even 100+ step workflows)
  - Validation feedback <200ms after input
  - UI responsiveness: no blocking operations >100ms

- **Usability:**
  - Keyboard-driven workflow (no mouse required)
  - Clear visual hierarchy (step tree, config panel, validation panel)
  - Contextual help available in each screen
  - Consistent with terminal UI conventions

- **Reliability:**
  - Auto-save to temporary file every 30 seconds
  - Crash recovery: restore last auto-saved state
  - Validation prevents saving invalid workflows

- **Compatibility:**
  - Works in standard terminals (xterm, iTerm2, Windows Terminal)
  - Supports 80x24 minimum terminal size (graceful degradation)
  - No GUI dependencies (pure terminal UI)

### Technical Constraints
- **Must use Python 3.11+** (existing project requirement)
- **Cannot modify Pydantic schema** (`app/workflows/schema.py`)
- **Cannot change JSON file format** (breaks existing workflows)
- **Must work with existing validation** (`cli/validator.py`)
- **Must integrate with dry-run** (`cli/dry_run.py`)
- **Cannot modify API endpoints** (workflow submission intact)

---

## 7. Data & Database Changes

### Database Schema Changes
**None** - Workflows stored as JSON files, not in PostgreSQL database.

### Data Model Updates
**None** - Pydantic models (`app/workflows/schema.py`) remain unchanged.

### Data Migration Plan
**Not applicable** - No database changes, no migrations needed.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**This is a CLI tool - no Server Actions or API routes involved.**

**Current Architecture:**
- Workflows read/written as JSON files via Python `json` module
- Validation via Pydantic schema (`workflow_schema.py`)
- No database queries for workflow editing (file-based)

**No Changes Required:**
- Existing file I/O patterns sufficient
- No need for API endpoints (CLI tool)
- No authentication (local file access)

### Server Actions
**Not applicable** - CLI tool, not web application.

### Database Queries
**Not applicable** - No database queries for workflow files.

### API Routes
**Not applicable** - CLI tool uses existing `/api/v1/workflow` endpoint for submission only.

### External Integrations
**Existing integrations preserved:**
- OpenRouter API (for LLM calls in dry-run)
- External services (WeatherAPI, Google Places) - registry unchanged
- No new integrations needed

---

## 9. Frontend Changes

### New Components

**Note:** This is a terminal UI (TUI), not a web frontend. "Components" refer to Textual widgets.

#### Textual Widgets to Create

- [ ] **`components/WorkflowTreeView.py`** - Sidebar showing all steps in tree format
  - Props: `workflow_data: dict`, `selected_step_index: int`, `on_step_select: Callable`
  - Features: Keyboard navigation, validation status icons, step type colors

- [ ] **`components/StepConfigPanel.py`** - Main panel for editing step configuration
  - Props: `step: WorkflowStep`, `on_change: Callable`, `available_vars: List[str]`
  - Features: Form fields with validation, autocomplete for variables, type-specific layouts

- [ ] **`components/ValidationPanel.py`** - Bottom panel showing validation errors/warnings
  - Props: `validation_results: List[ValidationError]`, `current_step: Optional[str]`
  - Features: Scrollable list, severity colors, jump-to-error action

- [ ] **`components/MetadataPanel.py`** - Workflow-level metadata editor
  - Props: `metadata: dict`, `on_change: Callable`
  - Features: Name, version, description, timeout fields

- [ ] **`components/VariableAutocomplete.py`** - Autocomplete widget for variable references
  - Props: `available_vars: List[str]`, `current_input: str`, `on_select: Callable`
  - Features: Fuzzy search, namespace organization (steps.*, input.*), inline preview

- [ ] **`components/ServiceBrowser.py`** - Modal for browsing external services
  - Props: `services: List[Service]`, `on_select: Callable`
  - Features: Service list, operation details, parameter templates

**Component Organization Pattern:**
```
LLM_service/
├── app/
│   └── cli/
│       ├── editor_tui/           # New Textual TUI editor
│       │   ├── __init__.py
│       │   ├── app.py           # Main Textual application
│       │   ├── screens/         # Full-screen views
│       │   │   ├── main_editor.py
│       │   │   ├── service_browser.py
│       │   │   └── help_screen.py
│       │   ├── widgets/         # Reusable components
│       │   │   ├── workflow_tree.py
│       │   │   ├── step_config_panel.py
│       │   │   ├── validation_panel.py
│       │   │   ├── metadata_panel.py
│       │   │   └── variable_autocomplete.py
│       │   └── models/          # State management
│       │       ├── editor_state.py
│       │       └── action_history.py
│       ├── editor.py            # Legacy editor (keep for backup)
│       └── __main__.py          # CLI entry point (add 'edit-tui' command)
```

### Page Updates
**Not applicable** - CLI tool, not web pages.

### State Management

**Textual Reactive State Pattern:**
```python
# editor_tui/models/editor_state.py
from textual.reactive import reactive

class EditorState:
    """Central state management for editor"""
    workflow: reactive[dict] = reactive({})
    selected_step_index: reactive[int] = reactive(-1)
    validation_errors: reactive[list] = reactive([])
    action_history: reactive[list] = reactive([])
    unsaved_changes: reactive[bool] = reactive(False)
```

**Action History (Undo/Redo):**
```python
# editor_tui/models/action_history.py
class ActionHistory:
    """Command pattern for undo/redo"""
    def __init__(self, max_history: int = 50):
        self.actions: List[EditorAction] = []
        self.current_index: int = -1

    def execute(self, action: EditorAction) -> None:
        """Execute action and add to history"""

    def undo(self) -> Optional[dict]:
        """Undo last action, return previous state"""

    def redo(self) -> Optional[dict]:
        """Redo next action, return next state"""
```

---

## 10. Code Changes Overview

### 🚨 MANDATORY: High-Level Code Changes Before Implementation

This section shows the transformation from the current sequential prompt-based editor to a modern Textual TUI with visual navigation and real-time feedback.

#### 📂 **Current Implementation (Before)**

**File:** `LLM_service/app/cli/editor.py` (430 lines)

```python
class WorkflowEditor:
    """Sequential prompt-based workflow editor"""

    def run(self):
        """Main loop: metadata → steps → save"""
        while True:
            choice = questionary.select(
                "What would you like to do?",
                choices=["Add step", "Edit step", "Remove step", "View", "Save"]
            ).ask()

            if choice == "Edit step":
                # ❌ PROBLEM: Must re-enter all data
                self._edit_step()  # Removes step, calls _add_step()

    def _edit_step(self):
        """Remove and re-add step (loses position)"""
        step_id = questionary.select("Select step", choices=step_ids).ask()
        step_idx = next(i for i, s in enumerate(steps) if s['id'] == step_id)

        # ❌ Removes step completely
        self.workflow_data['steps'].pop(step_idx)

        # ❌ Re-adds at end of array
        self._add_step()

    def _configure_llm_step(self):
        """Sequential prompts for LLM step config"""
        # ❌ No pre-population, always starts empty
        model = questionary.select("Model", choices=["sonnet-3.5", "opus-4"]).ask()
        prompt = questionary.text("Prompt template:").ask()
        # ... more sequential prompts
```

**Current UX Flow:**
```
Main Menu
├─ Setup Metadata (sequential prompts)
├─ Add Step (sequential prompts per step type)
├─ Edit Step
│  └─ ❌ Removes step, re-runs Add Step (data lost)
├─ Remove Step
├─ View Workflow (static JSON dump)
└─ Save (validation runs here only)
```

**Key Limitations:**
- No visual overview of all steps
- Edit = delete + re-add (loses position)
- Validation only on save
- No autocomplete or suggestions
- Can't see current values when editing

---

#### 📂 **After Refactor (Textual TUI)**

**File:** `LLM_service/app/cli/editor_tui/app.py` (new file, ~300 lines)

```python
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Tree, Input, Button
from textual.reactive import reactive
from textual.containers import Horizontal, Vertical

class WorkflowEditorApp(App):
    """Modern TUI workflow editor with live panels"""

    CSS_PATH = "editor.css"
    BINDINGS = [
        ("ctrl+s", "save", "Save"),
        ("ctrl+z", "undo", "Undo"),
        ("ctrl+y", "redo", "Redo"),
        ("ctrl+n", "new_step", "New Step"),
    ]

    # Reactive state - updates UI automatically
    workflow: reactive[dict] = reactive({}, init=False)
    selected_step: reactive[int] = reactive(-1)
    validation_errors: reactive[list] = reactive([])

    def compose(self) -> ComposeResult:
        """Layout: Tree | Config Panel | Validation Panel"""
        yield Header()

        with Horizontal():
            # Left sidebar: Step tree (30% width)
            yield WorkflowTree(id="step_tree")

            # Center: Step config editor (50% width)
            with Vertical():
                yield MetadataPanel(id="metadata")
                yield StepConfigPanel(id="step_config")

            # Right: Validation panel (20% width)
            yield ValidationPanel(id="validation")

        yield Footer()

    def on_tree_node_selected(self, event: Tree.NodeSelected):
        """✅ Jump to step instantly, load current values"""
        step_idx = event.node.data["index"]
        self.selected_step = step_idx

        # ✅ Pre-populate config panel with existing values
        step = self.workflow["steps"][step_idx]
        self.query_one(StepConfigPanel).load_step(step)

    def action_undo(self):
        """✅ Undo last action"""
        previous_state = self.action_history.undo()
        if previous_state:
            self.workflow = previous_state
            self.notify("Undone")
```

**File:** `LLM_service/app/cli/editor_tui/widgets/step_config_panel.py` (new, ~200 lines)

```python
from textual.widgets import Static, Input, Select
from textual.containers import Vertical

class StepConfigPanel(Vertical):
    """Edit step configuration with real-time validation"""

    def load_step(self, step: dict):
        """✅ Pre-populate all fields with current values"""
        self.query_one("#step_id", Input).value = step["id"]
        self.query_one("#step_type", Select).value = step["type"]

        # Type-specific config
        if step["type"] == "llm":
            self.query_one("#model", Select).value = step["config"]["model"]
            self.query_one("#prompt", Input).value = step["config"]["prompt_template"]
            # ✅ Show current values, not empty fields

    def on_input_changed(self, event: Input.Changed):
        """✅ Real-time validation as user types"""
        if event.input.id == "step_id":
            # Check uniqueness immediately
            if self._is_duplicate_id(event.value):
                event.input.add_class("error")
                self.validation_panel.add_error(f"Duplicate ID: {event.value}")
            else:
                event.input.remove_class("error")

        # ✅ Mark as unsaved change
        self.app.unsaved_changes = True

    def on_input_submitted(self, event: Input.Submitted):
        """✅ Show variable autocomplete on ${"""
        if event.value.endswith("${"):
            available_vars = self._get_available_variables()
            self.show_autocomplete(available_vars)
```

**File:** `LLM_service/app/cli/editor_tui/widgets/workflow_tree.py` (new, ~150 lines)

```python
from textual.widgets import Tree

class WorkflowTree(Tree):
    """✅ Visual overview of all steps"""

    def load_workflow(self, workflow: dict):
        """Populate tree with workflow steps"""
        root = self.root.add("📋 " + workflow["name"])

        for idx, step in enumerate(workflow["steps"]):
            # ✅ Show step type, ID, and validation status
            icon = self._get_step_icon(step["type"])
            status = "✅" if self._is_valid(step) else "❌"

            node = root.add(f"{status} {icon} {step['id']}", data={"index": idx})

            # ✅ Expand to show config summary
            node.add(f"Type: {step['type']}")
            if step["type"] == "llm":
                node.add(f"Model: {step['config']['model']}")
```

---

#### 🎯 **Key Changes Summary**

**Architecture Transformation:**
- [ ] **Sequential prompts → Reactive panels** - See all workflow data simultaneously
- [ ] **Delete + re-add → In-place editing** - Edit step config without losing position
- [ ] **Save-time validation → Real-time validation** - Errors shown as you type
- [ ] **Manual variable entry → Autocomplete** - Suggest available `${...}` references
- [ ] **No undo → Command pattern history** - 10+ action undo/redo

**Files Modified:**
- `LLM_service/app/cli/__main__.py` - Add `edit-tui` command (10 lines)
- `LLM_service/app/cli/editor.py` - Keep as fallback, add deprecation notice (5 lines)

**Files Created:**
- `LLM_service/app/cli/editor_tui/app.py` - Main Textual application (~300 lines)
- `LLM_service/app/cli/editor_tui/widgets/workflow_tree.py` (~150 lines)
- `LLM_service/app/cli/editor_tui/widgets/step_config_panel.py` (~200 lines)
- `LLM_service/app/cli/editor_tui/widgets/validation_panel.py` (~100 lines)
- `LLM_service/app/cli/editor_tui/widgets/metadata_panel.py` (~80 lines)
- `LLM_service/app/cli/editor_tui/widgets/variable_autocomplete.py` (~120 lines)
- `LLM_service/app/cli/editor_tui/models/editor_state.py` (~60 lines)
- `LLM_service/app/cli/editor_tui/models/action_history.py` (~80 lines)
- `LLM_service/app/cli/editor_tui/editor.css` - Textual CSS (~100 lines)

**Impact:**
- ✅ **User Experience:** 5-10x faster workflow editing through visual navigation
- ✅ **Error Reduction:** Real-time validation catches issues immediately
- ✅ **Developer Velocity:** Undo/redo and autocomplete reduce friction
- ✅ **Scalability:** Handles complex 20+ step workflows efficiently
- ⚠️ **Learning Curve:** Team learns Textual framework (2-3 hours initial ramp-up)
- ⚠️ **Code Size:** ~1100 new lines (modular, well-organized)

---

## 11. Implementation Plan

### Phase 1: Textual Foundation Setup
**Goal:** Install Textual framework and create basic application structure

- [ ] **Task 1.1:** Add Textual Dependency
  - Files: `LLM_service/requirements.txt`
  - Details: Add `textual==0.47.1` (latest stable as of Dec 2024)

- [ ] **Task 1.2:** Create Directory Structure
  - Files: `LLM_service/app/cli/editor_tui/` directory
  - Details: Create `__init__.py`, `app.py`, `widgets/`, `models/`, `screens/`

- [ ] **Task 1.3:** Basic Textual Application
  - Files: `editor_tui/app.py`
  - Details: Minimal Textual app that launches, shows header/footer, exits cleanly

- [ ] **Task 1.4:** CLI Integration
  - Files: `cli/__main__.py`
  - Details: Add `edit-tui` command that launches Textual app

**Validation:** Can run `python -m cli edit-tui` and see basic Textual UI

---

### Phase 2: Workflow Loading & Tree View
**Goal:** Load existing workflow JSON and display in tree view sidebar

- [ ] **Task 2.1:** Workflow File Loader
  - Files: `editor_tui/models/editor_state.py`
  - Details: Load JSON from `workflows/definitions/`, parse with Pydantic validation

- [ ] **Task 2.2:** Workflow Tree Widget
  - Files: `editor_tui/widgets/workflow_tree.py`
  - Details: Tree widget showing workflow name, steps with icons, validation status

- [ ] **Task 2.3:** Tree Node Selection
  - Files: `editor_tui/app.py`, `workflow_tree.py`
  - Details: Clicking step in tree sets `selected_step` reactive var

- [ ] **Task 2.4:** Layout Integration
  - Files: `editor_tui/app.py`
  - Details: Horizontal layout with tree (30%), config panel placeholder (50%), validation (20%)

**Validation:** Opening workflow shows all steps in tree, clicking step highlights it

---

### Phase 3: Step Configuration Panel (Read-Only)
**Goal:** Display step configuration when step selected in tree

- [ ] **Task 3.1:** Step Config Panel Widget
  - Files: `editor_tui/widgets/step_config_panel.py`
  - Details: Vertical container with Input/Select widgets for step fields

- [ ] **Task 3.2:** Pre-Population Logic
  - Files: `step_config_panel.py`
  - Details: `load_step()` method populates all fields with current step values

- [ ] **Task 3.3:** Type-Specific Layouts
  - Files: `step_config_panel.py`
  - Details: Different field layouts for LLM, transform, external_api steps

- [ ] **Task 3.4:** Reactive Binding
  - Files: `editor_tui/app.py`
  - Details: Watch `selected_step` reactive, trigger `StepConfigPanel.load_step()`

**Validation:** Selecting step in tree shows its current configuration in config panel

---

### Phase 4: Real-Time Validation Panel
**Goal:** Show validation errors/warnings as user edits configuration

- [ ] **Task 4.1:** Validation Panel Widget
  - Files: `editor_tui/widgets/validation_panel.py`
  - Details: Scrollable list of errors/warnings with severity colors

- [ ] **Task 4.2:** Inline Validation Logic
  - Files: `step_config_panel.py`
  - Details: On input change, run validators (unique ID, required fields, variable refs)

- [ ] **Task 4.3:** Error Highlighting
  - Files: `step_config_panel.py`, `editor.css`
  - Details: Add `error` class to invalid inputs, show red border

- [ ] **Task 4.4:** Validation Result Binding
  - Files: `editor_tui/app.py`
  - Details: Watch `validation_errors` reactive, update ValidationPanel

**Validation:** Entering duplicate step ID shows error immediately in validation panel

---

### Phase 5: Editable Configuration (In-Place)
**Goal:** Allow editing step configuration without removing from workflow

- [ ] **Task 5.1:** Input Change Handlers
  - Files: `step_config_panel.py`
  - Details: `on_input_changed()` updates workflow state in-place

- [ ] **Task 5.2:** Unsaved Changes Tracking
  - Files: `editor_tui/models/editor_state.py`
  - Details: Set `unsaved_changes` reactive flag on any edit

- [ ] **Task 5.3:** Save Workflow Action
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+S` binding saves workflow to JSON file

- [ ] **Task 5.4:** Dirty State Indicator
  - Files: `editor_tui/app.py`
  - Details: Show `*` in header when unsaved changes exist

**Validation:** Editing step config updates workflow, `Ctrl+S` saves to file

---

### Phase 6: Variable Autocomplete
**Goal:** Auto-suggest `${...}` variable references as user types

- [ ] **Task 6.1:** Variable Context Builder
  - Files: `editor_tui/models/editor_state.py`
  - Details: Build list of available vars: `${input.*}`, `${steps.*.field}`

- [ ] **Task 6.2:** Autocomplete Widget
  - Files: `editor_tui/widgets/variable_autocomplete.py`
  - Details: Dropdown showing filtered variables, fuzzy search

- [ ] **Task 6.3:** Trigger Detection
  - Files: `step_config_panel.py`
  - Details: Show autocomplete when user types `${`

- [ ] **Task 6.4:** Variable Insertion
  - Files: `variable_autocomplete.py`
  - Details: Selecting suggestion inserts full variable reference

**Validation:** Typing `${` in prompt field shows autocomplete with available variables

---

### Phase 7: Metadata Editor
**Goal:** Edit workflow-level metadata (name, version, description, timeout)

- [ ] **Task 7.1:** Metadata Panel Widget
  - Files: `editor_tui/widgets/metadata_panel.py`
  - Details: Form with fields for name, version, description, timeout

- [ ] **Task 7.2:** Metadata Pre-Population
  - Files: `metadata_panel.py`
  - Details: Load current workflow metadata values

- [ ] **Task 7.3:** Metadata Editing
  - Files: `metadata_panel.py`
  - Details: Update workflow metadata on input change

- [ ] **Task 7.4:** Tab Navigation
  - Files: `editor_tui/app.py`
  - Details: `Tab` key switches between metadata panel and step panel

**Validation:** Can edit workflow name/description, changes reflected on save

---

### Phase 8: Step Management Operations
**Goal:** Add, remove, reorder, duplicate steps

- [ ] **Task 8.1:** Add Step Action
  - Files: `editor_tui/app.py`, `workflow_tree.py`
  - Details: `Ctrl+N` binding shows step type selector, adds new step at end

- [ ] **Task 8.2:** Remove Step Action
  - Files: `editor_tui/app.py`
  - Details: `Delete` key removes selected step with confirmation

- [ ] **Task 8.3:** Reorder Step Actions
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+↑`/`Ctrl+↓` move step up/down in workflow

- [ ] **Task 8.4:** Duplicate Step Action
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+D` duplicates selected step with incremented ID

**Validation:** Can add/remove/reorder steps, tree updates immediately

---

### Phase 9: Undo/Redo System
**Goal:** Track action history and enable undo/redo

- [ ] **Task 9.1:** Action History Model
  - Files: `editor_tui/models/action_history.py`
  - Details: Command pattern with `execute()`, `undo()`, `redo()` methods

- [ ] **Task 9.2:** Action Recording
  - Files: `editor_tui/app.py`
  - Details: Record all state changes as actions (edit step, reorder, etc.)

- [ ] **Task 9.3:** Undo Action
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+Z` binding restores previous workflow state

- [ ] **Task 9.4:** Redo Action
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+Y` binding re-applies undone action

**Validation:** Make change, `Ctrl+Z` undoes it, `Ctrl+Y` redoes it

---

### Phase 10: Service & Operation Browser
**Goal:** Browse available external services and transformation operations

- [ ] **Task 10.1:** Service Registry Integration
  - Files: `editor_tui/models/editor_state.py`
  - Details: Load available services from `ExternalServiceRegistry`

- [ ] **Task 10.2:** Service Browser Screen
  - Files: `editor_tui/screens/service_browser.py`
  - Details: Modal screen showing services, operations, parameters

- [ ] **Task 10.3:** Browser Trigger
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+B` opens service browser when in external_api step

- [ ] **Task 10.4:** Template Insertion
  - Files: `service_browser.py`
  - Details: Selecting service/operation inserts config template

**Validation:** `Ctrl+B` shows service browser, selecting service inserts template

---

### Phase 11: Advanced Features & Polish
**Goal:** Add remaining UX improvements and keyboard shortcuts

- [ ] **Task 11.1:** Help Screen
  - Files: `editor_tui/screens/help_screen.py`
  - Details: `F1` shows keyboard shortcuts and usage guide

- [ ] **Task 11.2:** Search/Filter Steps
  - Files: `editor_tui/widgets/workflow_tree.py`
  - Details: `Ctrl+F` filters tree by step ID or type

- [ ] **Task 11.3:** Workflow Switcher
  - Files: `editor_tui/app.py`
  - Details: `Ctrl+O` shows file picker to switch workflows

- [ ] **Task 11.4:** Auto-Save
  - Files: `editor_tui/app.py`
  - Details: Auto-save to temp file every 30 seconds

- [ ] **Task 11.5:** Crash Recovery
  - Files: `editor_tui/app.py`
  - Details: On launch, check for auto-save file and offer restore

**Validation:** All keyboard shortcuts work, auto-save creates temp file

---

### Phase 12: Testing & Documentation
**Goal:** Validate implementation and document usage

- [ ] **Task 12.1:** Manual Testing Checklist
  - Files: N/A (browser testing)
  - Details: Test all features with real workflows (mission_generation.json)

- [ ] **Task 12.2:** Update CLI Help
  - Files: `cli/__main__.py`
  - Details: Add `edit-tui` command documentation

- [ ] **Task 12.3:** Create User Guide
  - Files: `LLM_service/docs/cli_editor_guide.md`
  - Details: Document keyboard shortcuts, workflow, tips

- [ ] **Task 12.4:** Update README
  - Files: `LLM_service/README.md`
  - Details: Add section on new TUI editor

**Validation:** All features working, documentation complete

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

### Example Task Completion Format
```
### Phase 1: Textual Foundation Setup
**Goal:** Install Textual framework and create basic application structure

- [x] **Task 1.1:** Add Textual Dependency ✓ 2024-12-18
  - Files: `LLM_service/requirements.txt` ✓
  - Details: Added textual==0.47.1 to requirements ✓
- [x] **Task 1.2:** Create Directory Structure ✓ 2024-12-18
  - Files: `LLM_service/app/cli/editor_tui/` ✓
  - Details: Created __init__.py, app.py, widgets/, models/, screens/ directories ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
LLM_service/
├── app/
│   └── cli/
│       ├── editor_tui/              # New Textual TUI editor
│       │   ├── __init__.py          # Package init
│       │   ├── app.py               # Main Textual application (~300 lines)
│       │   ├── editor.css           # Textual CSS styling (~100 lines)
│       │   ├── screens/             # Full-screen views
│       │   │   ├── __init__.py
│       │   │   ├── service_browser.py  # Service/operation browser (~200 lines)
│       │   │   └── help_screen.py      # Keyboard shortcuts help (~80 lines)
│       │   ├── widgets/             # Reusable Textual widgets
│       │   │   ├── __init__.py
│       │   │   ├── workflow_tree.py        # Step tree view (~150 lines)
│       │   │   ├── step_config_panel.py    # Step editor (~200 lines)
│       │   │   ├── validation_panel.py     # Validation errors (~100 lines)
│       │   │   ├── metadata_panel.py       # Workflow metadata (~80 lines)
│       │   │   └── variable_autocomplete.py  # Variable suggestions (~120 lines)
│       │   └── models/              # State management
│       │       ├── __init__.py
│       │       ├── editor_state.py     # Reactive state (~60 lines)
│       │       └── action_history.py   # Undo/redo (~80 lines)
│       └── editor.py                # Legacy editor (keep as fallback)
└── docs/
    └── cli_editor_guide.md          # User documentation (~500 lines)
```

### Files to Modify
- [ ] **`LLM_service/requirements.txt`** - Add `textual==0.47.1` dependency
- [ ] **`LLM_service/app/cli/__main__.py`** - Add `edit-tui` command (~10 lines)
- [ ] **`LLM_service/app/cli/editor.py`** - Add deprecation notice for legacy editor (~5 lines)
- [ ] **`LLM_service/README.md`** - Document new TUI editor (~20 lines)

### Dependencies to Add
```txt
# requirements.txt additions
textual==0.47.1          # Modern TUI framework for Python
```

**Why Textual 0.47.1:**
- Latest stable release (Dec 2024)
- Rich ecosystem of widgets (Tree, Input, Select, etc.)
- Built-in reactive state management
- CSS-based styling for consistency
- Active development and community support

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** User edits step while validation is running
  - **Code Review Focus:** `step_config_panel.py` - concurrent validation handling
  - **Potential Fix:** Debounce validation (300ms delay), cancel pending validations on new input

- [ ] **Error Scenario 2:** Workflow file deleted/modified externally during editing
  - **Code Review Focus:** `editor_tui/app.py` - file watcher, save conflict handling
  - **Potential Fix:** Detect file changes via mtime, show merge dialog if conflict

- [ ] **Error Scenario 3:** Undo/redo corrupts workflow state
  - **Code Review Focus:** `action_history.py` - deep copy of state, immutability
  - **Potential Fix:** Use `copy.deepcopy()` for state snapshots, validate after undo/redo

- [ ] **Error Scenario 4:** Variable autocomplete suggests invalid references
  - **Code Review Focus:** `variable_autocomplete.py` - variable context building logic
  - **Potential Fix:** Parse step outputs with Pydantic, only suggest validated fields

- [ ] **Error Scenario 5:** Large workflows (50+ steps) cause UI lag
  - **Code Review Focus:** `workflow_tree.py` - tree rendering performance
  - **Potential Fix:** Virtualize tree (only render visible nodes), lazy-load step details

### Edge Cases to Consider

- [ ] **Edge Case 1:** Workflow with circular variable references (`${steps.A}` → `${steps.B}` → `${steps.A}`)
  - **Analysis Approach:** Test with intentionally circular workflow, check validator behavior
  - **Recommendation:** Validator should detect and prevent circular refs (may already exist)

- [ ] **Edge Case 2:** Step ID contains special characters (spaces, dots, brackets)
  - **Analysis Approach:** Try IDs like `"step 1"`, `"step.a"`, `"step[0]"` in editor
  - **Recommendation:** Validate ID format (alphanumeric + underscore/dash only)

- [ ] **Edge Case 3:** Extremely long prompt templates (10,000+ characters)
  - **Analysis Approach:** Create step with massive prompt, check UI responsiveness
  - **Recommendation:** Use TextArea widget with virtual scrolling, not multiline Input

- [ ] **Edge Case 4:** Terminal resize during editing
  - **Analysis Approach:** Resize terminal window while editing, check panel reflow
  - **Recommendation:** Textual handles this automatically, but test graceful degradation to 80x24

- [ ] **Edge Case 5:** Duplicate step IDs created via rapid editing
  - **Analysis Approach:** Rapidly duplicate steps and edit IDs concurrently
  - **Recommendation:** Lock workflow state during save, atomic ID validation

### Security & Access Control Review

- [ ] **File Access Control:** Editor operates on local files in `workflows/definitions/`
  - **Check:** No path traversal vulnerabilities (validate file paths)
  - **Recommendation:** Use `pathlib.Path.resolve()` to prevent `../../` attacks

- [ ] **API Key Exposure:** Workflows may contain API keys in step config
  - **Check:** Ensure workflow JSON files have proper permissions (not world-readable)
  - **Recommendation:** Add warning if workflow contains `api_key` fields, suggest env vars

- [ ] **Input Validation:** User-entered step config must be validated before save
  - **Check:** Pydantic validation runs on all user input before writing to file
  - **Recommendation:** Validate before adding to state, not just on save

- [ ] **Command Injection:** Variable templates could contain malicious code
  - **Check:** Variable substitution uses safe string formatting, not `eval()`
  - **Recommendation:** Already safe (uses f-strings), but add explicit check for `exec`/`eval`

### AI Agent Analysis Approach

**Focus:** Review Textual widget lifecycle and reactive state management to identify race conditions and state corruption scenarios. Check file I/O patterns for atomicity and conflict handling.

**Priority Order:**
1. **Critical:** State corruption in undo/redo, file save conflicts
2. **Important:** Validation race conditions, variable reference accuracy
3. **Nice-to-have:** UI responsiveness with large workflows, graceful degradation

---

## 15. Deployment & Configuration

### Environment Variables
**None required** - Editor operates on local files, no API keys or external services needed.

### Configuration Changes
**Optional:** Add editor preferences to `LLM_service/.env` (future enhancement)
```bash
# Optional: Editor preferences (not in initial implementation)
EDITOR_AUTO_SAVE_INTERVAL=30  # Auto-save interval in seconds
EDITOR_MAX_UNDO_HISTORY=50    # Number of undo actions to retain
```

### Installation Steps
```bash
# Install new dependency
cd LLM_service
pip install textual==0.47.1

# Launch new TUI editor
python -m cli edit-tui

# Or edit existing workflow
python -m cli edit-tui workflows/definitions/mission_generation.json
```

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ **Strategic analysis completed** - Option 2 (Textual TUI) recommended and awaiting user approval.

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW

🚨 **WAITING FOR USER STRATEGIC APPROVAL**

**Next Steps:**
1. **User Decision** - Approve Option 2 (Textual TUI), request Option 1 (incremental), or suggest alternative
2. **If Option 2 Approved** - Present implementation options (A/B/C)
3. **Begin Phase-by-Phase** - Execute 12 phases with "proceed" checkpoints
4. **Comprehensive Code Review** - After all phases, present review summary
5. **User Testing Request** - Only after code review complete

### Code Quality Standards
- [ ] Follow Python best practices (PEP 8, type hints)
- [ ] Add proper error handling (try/except with specific exceptions)
- [ ] **Write professional comments** explaining business logic (not change history)
- [ ] **Use early returns** to reduce nesting and improve readability
- [ ] **Use async/await** for I/O operations (file loading, validation)
- [ ] **NO FALLBACK BEHAVIOR** - Fail fast with clear errors if unexpected format
- [ ] Ensure responsive design (graceful degradation to 80x24 terminal)
- [ ] Follow Textual best practices (reactive state, CSS styling)
- [ ] Use semantic widget composition (containers, panels)

### Architecture Compliance
- [ ] **✅ VERIFY: No database changes** - Workflows are file-based
- [ ] **✅ VERIFY: No API changes** - CLI tool uses existing validation/dry-run
- [ ] **✅ VERIFY: Pydantic schema unchanged** - Only UI layer modified
- [ ] **🚨 VERIFY: Backward compatibility** - Existing workflows load correctly
- [ ] **❌ AVOID: Modifying workflow JSON schema** - Breaks existing workflows
- [ ] **❌ AVOID: Breaking API contracts** - `/api/v1/workflow` must stay stable

---

## 17. Notes & Additional Context

### Research Links
- **Textual Documentation:** https://textual.textualize.io/
- **Textual Widget Gallery:** https://textual.textualize.io/widget_gallery/
- **Textual CSS Guide:** https://textual.textualize.io/guide/CSS/
- **Example Textual Apps:** https://github.com/Textualize/textual/tree/main/examples

### **⚠️ Common Textual Pitfalls to Avoid**

**❌ NEVER DO:**
- Use blocking I/O in Textual widgets (blocks UI thread)
- Mutate reactive state from non-reactive methods (breaks updates)
- Create circular dependencies between widgets (causes infinite loops)
- Use global state instead of reactive state (loses reactivity)
- Import Textual widgets in non-Textual code (coupling issue)

**✅ ALWAYS DO:**
- Use `async def` for file I/O operations
- Update reactive state only in reactive methods or actions
- Pass data via props/messages, not direct widget references
- Use Textual's message passing for widget communication
- Keep Textual code isolated in `editor_tui/` directory

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing CLI Commands:** `validate`, `dry-run`, `diagram` remain unchanged
- [ ] **Workflow JSON Format:** No schema changes, existing workflows fully compatible
- [ ] **API Contracts:** No impact on `/api/v1/workflow` endpoint
- [ ] **User Workflows:** All existing `.json` files work without modification

**Conclusion:** Zero breaking changes - this is a pure CLI UX enhancement.

---

#### 2. **Ripple Effects Assessment**
- [ ] **Developer Workflow:** New `edit-tui` command complements existing `edit` (legacy)
- [ ] **CI/CD Pipelines:** No impact - workflows validated same way (`python -m cli validate`)
- [ ] **Documentation:** Must update CLI docs, add TUI editor guide
- [ ] **Training:** Users need brief introduction to Textual keybindings (5-10 min)

**Conclusion:** Minimal ripple effects - additive feature, not replacement.

---

#### 3. **Performance Implications**
- [ ] **Startup Time:** Textual adds ~200ms initialization (negligible)
- [ ] **Memory Usage:** TUI requires ~10-20MB RAM (acceptable for dev tool)
- [ ] **File I/O:** Same as legacy editor (JSON read/write)
- [ ] **Validation Speed:** Unchanged - uses existing validator

**Conclusion:** No significant performance degradation.

---

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new network exposure (local files only)
- [ ] **Data Exposure:** Workflows may contain API keys (existing risk, add warning)
- [ ] **Path Traversal:** Must validate file paths in workflow loader
- [ ] **Input Validation:** Textual widgets handle escaping, Pydantic validates structure

**Mitigation:**
- [ ] Add path validation: `pathlib.Path.resolve()` to prevent `../../`
- [ ] Warn users if workflow contains `api_key` fields, suggest env vars
- [ ] Validate all user input with Pydantic before state mutation

---

#### 5. **User Experience Impacts**
- [ ] **Learning Curve:** Users familiar with terminal UIs adapt quickly (<30 min)
- [ ] **Workflow Disruption:** Legacy `edit` command remains for gradual transition
- [ ] **Feature Parity:** TUI is strict superset of legacy features (no regression)
- [ ] **Accessibility:** Terminal UI accessible via screen readers (Textual supports)

**Conclusion:** Positive UX impact - faster editing, fewer errors, better visibility.

---

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** 1100 new lines, but modular and well-organized
- [ ] **Dependencies:** Textual is actively maintained (last release Nov 2024)
- [ ] **Testing Overhead:** Requires terminal UI testing (manual or pytest-textual)
- [ ] **Documentation:** Need TUI editor guide, keyboard shortcuts reference

**Mitigation:**
- [ ] Use Textual's built-in testing framework (`pytest-textual`)
- [ ] Document all widgets with docstrings and type hints
- [ ] Create comprehensive user guide with examples

---

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **New Dependency Risk:** Textual is external dependency (active project, but adds risk)
  - **Mitigation:** Pin version to `textual==0.47.1`, test thoroughly before rollout

- [ ] **File Save Conflicts:** If workflow file modified externally during editing, risk of data loss
  - **Mitigation:** Check file mtime before save, show merge dialog if changed

- [ ] **State Corruption in Undo/Redo:** Complex state mutations could corrupt workflow
  - **Mitigation:** Use `copy.deepcopy()` for state snapshots, validate after undo/redo

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Learning Curve:** Team must learn Textual framework (2-3 hours initial ramp-up)
  - **Mitigation:** Provide Textual crash course, pair programming for first widget

- [ ] **Testing Complexity:** Terminal UI testing harder than unit tests
  - **Mitigation:** Use `pytest-textual` for automated tests, manual QA checklist

- [ ] **Large Workflow Performance:** 50+ step workflows may cause UI lag
  - **Mitigation:** Implement tree virtualization if performance issues observed

---

### Mitigation Strategies

#### Dependency Risk
- [ ] **Pin Textual Version:** Use `textual==0.47.1` to avoid breaking changes
- [ ] **Vendor Fallback:** Keep legacy `edit` command as backup if Textual issues arise
- [ ] **Regular Updates:** Monitor Textual releases, update quarterly

#### File Save Conflicts
- [ ] **File Watcher:** Use `watchdog` library to detect external modifications
- [ ] **Merge Dialog:** Show diff and let user choose: keep edits, reload, or merge
- [ ] **Auto-Save to Temp:** Write to `.workflow.json.tmp` first, atomic rename on save

#### State Corruption
- [ ] **Immutable State:** Use `copy.deepcopy()` for all state snapshots
- [ ] **Validation Gates:** Run Pydantic validation after every state mutation
- [ ] **Atomic Operations:** Wrap multi-step state changes in transactions

#### Testing Strategy
- [ ] **Unit Tests:** Test state models, action history in isolation
- [ ] **Integration Tests:** Use `pytest-textual` for widget testing
- [ ] **Manual QA:** Comprehensive checklist for real-world workflows

---

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Filled out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flagged dependency risk, file conflicts, state corruption
- [x] **Propose Mitigation:** Suggested specific mitigation strategies for identified risks
- [x] **Alert User:** Clearly communicate significant second-order impacts
- [x] **Recommend Alternatives:** Option 1 (incremental CLI) is safer if risk tolerance low

---

*Template Version: 1.3*
*Last Updated: 2024-12-18*
*Created By: Claude Code (claude.ai/code)*
