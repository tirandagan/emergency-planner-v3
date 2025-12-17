# LLM Workflow CLI Tools

Command-line interface for workflow development and management.

## Installation

CLI tools are included with the LLM service. Dependencies are automatically installed:

```bash
pip install -r requirements.txt
```

## Available Commands

### 1. Validate (`validate`)

Validate workflow JSON files for schema compliance, dependencies, and configurations.

**Usage:**
```bash
python -m cli validate <workflow.json> [options]
```

**Options:**
- `-p, --prompts <path>` - Path to prompts directory (default: workflows/prompts)

**Example:**
```bash
python -m cli validate workflows/definitions/emergency_contacts.json
```

**What it checks:**
- ✅ JSON syntax and structure
- ✅ Pydantic schema validation
- ✅ Unique step IDs
- ✅ Step execution order
- ✅ Transform operations exist
- ✅ External services registered
- ✅ Prompt files exist (for LLM steps)
- ✅ Variable reference validity

**Output:**
```
Validation Summary
─────────────────
Info      12
Warnings   4
Errors     0

✓ Validation PASSED
```

---

### 2. Dry-Run (`dry-run`)

Preview workflow execution without making actual API calls.

**Usage:**
```bash
python -m cli dry-run <workflow.json> [options]
```

**Options:**
- `-i, --input <input.json>` - Input data for workflow context

**Example:**
```bash
python -m cli dry-run workflows/definitions/emergency_contacts.json
```

**What it shows:**
- 📋 Workflow metadata (name, version, description, timeout)
- 🎯 Execution plan (step-by-step tree)
- 🔄 Variable flow (what's available at each step)
- ⚡ Resource estimates (API calls, duration)
- 💰 Cost estimates (tokens, USD)

**Sample Output:**
```
Execution Plan:
🎯 Workflow Execution
├── 1. fetch_weather (external_api)
│   ├── 🌐 Service: weatherapi
│   └── ⚡ Operation: current
├── 2. fetch_hospitals (external_api)
│   ├── 🌐 Service: google_places
│   └── ⚡ Operation: nearby_search
...

Cost Estimates:
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━┓
┃ Step              ┃ Tokens  ┃ Cost      ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━┩
│ generate_contacts │  2,000  │  $0.0180  │
└───────────────────┴─────────┴───────────┘
```

---

### 3. Interactive Editor (`edit`)

Create or modify workflows interactively with guided prompts.

**Usage:**
```bash
# Create new workflow
python -m cli edit

# Edit existing workflow
python -m cli edit <workflow.json>
```

**Example:**
```bash
python -m cli edit workflows/definitions/my_workflow.json
```

**Features:**
- ✏️ Add/edit/remove steps
- ⚙️ Configure step parameters
- 🔧 Set error handling modes
- 💾 Save workflows to JSON
- 👀 View current workflow structure

**Interactive Menu:**
```
━━━ Workflow Editor ━━━

Workflow: my_workflow (v1.0.0)

? Select action:
  > Edit Metadata
    Add Step
    Edit Step
    Remove Step
    View Workflow
    Save Workflow
    Exit
```

**Step Types:**
- `llm` - LLM text generation (with prompt templates or inline)
- `transform` - Data transformation (10 operations available)
- `external_api` - External API calls (Google Places, WeatherAPI, etc.)

---

### 4. Generate Diagram (`diagram`)

Generate Mermaid flowchart diagrams using LLM analysis.

**Usage:**
```bash
python -m cli diagram <workflow.json> [options]
```

**Options:**
- `-o, --output <file.mmd>` - Output file path (default: workflows/diagrams/<name>.mmd)

**Example:**
```bash
python -m cli diagram workflows/definitions/emergency_contacts.json
python -m cli diagram workflows/definitions/emergency_contacts.json -o my_diagram.mmd
```

**What it does:**
1. Analyzes workflow JSON structure
2. Calls LLM (Claude Sonnet 3.5) to generate Mermaid diagram
3. Saves diagram code to file
4. Provides instructions for viewing

**Output:**
```
Generated Mermaid Diagram:
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ flowchart TD                           ┃
┃     A[Start] --> B((LLM Step))        ┃
┃     B --> C[/Transform\\]              ┃
┃     C --> D([External API])           ┃
┃                                       ┃
┃     classDef llmStyle fill:#e1f5ff... ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

How to view:
1. Visit https://mermaid.live/
2. Paste the diagram code
3. See the visual representation
```

**Cost:** ~$0.001-0.005 per diagram (uses LLM for generation)

---

## Workflow JSON Structure

Workflows are defined in JSON format with the following structure:

```json
{
  "name": "workflow_name",
  "version": "1.0.0",
  "description": "Human-readable description",
  "steps": [
    {
      "id": "step_id",
      "type": "llm|transform|external_api",
      "config": {
        // Step-specific configuration
      },
      "error_mode": "fail|continue|retry"
    }
  ]
}
```

### LLM Step Configuration

```json
{
  "id": "generate_text",
  "type": "llm",
  "config": {
    "template": "path/to/prompt.md",  // OR "prompt": "inline text"
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7,
    "max_tokens": 4000
  }
}
```

### Transform Step Configuration

```json
{
  "id": "format_data",
  "type": "transform",
  "config": {
    "operation": "template",
    "config": {
      "input": "${steps.previous_step}",
      "template": "Formatted: ${value}"
    }
  }
}
```

**Available transformations:**
- `extract_fields` - JSONPath field extraction
- `filter` - Condition-based filtering
- `map` - Array element transformation
- `join` - Array joining
- `sort` - Array sorting
- `unique` - Deduplication
- `regex_extract` - Pattern extraction
- `markdown_to_json` - Parse markdown
- `template` - String templating
- `merge` - Object merging

### External API Step Configuration

```json
{
  "id": "fetch_data",
  "type": "external_api",
  "config": {
    "service": "google_places|weatherapi",
    "operation": "nearby_search|current",
    "config": {
      "location": "${input.lat},${input.lng}",
      "radius": 8000
    },
    "cache_ttl": 3600  // Optional: cache duration in seconds
  }
}
```

**Available services:**
- `google_places` - Google Places API (nearby_search, text_search, place_details)
- `weatherapi` - WeatherAPI (current weather)

---

## Variable References

Use `${namespace.path}` syntax to reference variables:

- `${input.field}` - Input data provided to workflow
- `${steps.step_id.field}` - Output from previous step
- `${context.field}` - Workflow context variables

**Examples:**
```json
{
  "template": "${steps.fetch_data.results[0].name}",
  "location": "${input.lat},${input.lng}",
  "value": "${steps.transform.output}"
}
```

---

## Error Handling

Each step can specify an error handling mode:

- **`fail`** (default) - Stop workflow immediately, mark as failed
- **`continue`** - Log error, continue to next step
- **`retry`** - Retry with exponential backoff (future enhancement)

**Example:**
```json
{
  "id": "optional_api_call",
  "type": "external_api",
  "error_mode": "continue",  // Won't fail workflow if API is down
  "config": { ... }
}
```

---

## Best Practices

### 1. Always Validate Before Deploying

```bash
python -m cli validate workflows/definitions/my_workflow.json
```

Check for:
- Schema compliance
- Missing prompt files
- Invalid service references
- Variable reference errors

### 2. Preview Execution Plan

```bash
python -m cli dry-run workflows/definitions/my_workflow.json
```

Review:
- Step execution order
- Resource requirements
- Cost estimates
- Variable flow

### 3. Use Descriptive Step IDs

```json
// ✅ Good
{"id": "fetch_weather", ...}
{"id": "generate_contacts", ...}

// ❌ Bad
{"id": "step1", ...}
{"id": "api_call", ...}
```

### 4. Set Appropriate Error Modes

```json
// Critical step - fail on error
{"id": "parse_response", "error_mode": "fail", ...}

// Optional enhancement - continue on error
{"id": "fetch_extra_data", "error_mode": "continue", ...}
```

### 5. Use Caching for External APIs

```json
{
  "id": "fetch_places",
  "type": "external_api",
  "config": {
    "cache_ttl": 3600  // Cache for 1 hour
  }
}
```

Benefits:
- 70-90% cost reduction
- Faster response times
- Reduced API quota usage

---

## Troubleshooting

### Validation Errors

**"Unknown external service 'servicename'"**
- Check service is registered in `app/workflows/services/`
- Ensure services are imported in `__init__.py`

**"Unknown transform operation 'operation'"**
- Verify operation name matches `TRANSFORMATION_REGISTRY`
- Check spelling and case sensitivity

**"Prompt template not found"**
- Verify file path is relative to prompts directory
- Check file exists: `workflows/prompts/path/to/prompt.md`

### Dry-Run Issues

**"WorkflowStep object has no attribute 'field'"**
- Schema mismatch - update CLI code or workflow JSON
- Check field names match Pydantic schema

**"Cost calculation failed"**
- Model not in `MODEL_COSTS` dictionary
- Add custom pricing to `cost_calculator.py`

### Editor Issues

**"Service not found in list"**
- Services not registered - import `app.workflows.services`
- Check service registry initialization

---

## Development Workflow

1. **Create** workflow using interactive editor
   ```bash
   python -m cli edit workflows/definitions/my_workflow.json
   ```

2. **Validate** workflow structure
   ```bash
   python -m cli validate workflows/definitions/my_workflow.json
   ```

3. **Preview** execution plan
   ```bash
   python -m cli dry-run workflows/definitions/my_workflow.json
   ```

4. **Generate** documentation diagram
   ```bash
   python -m cli diagram workflows/definitions/my_workflow.json
   ```

5. **Test** with real API (via main service)
   ```bash
   curl -X POST http://localhost:8000/api/v1/workflow \
     -H "Content-Type: application/json" \
     -d @test_input.json
   ```

---

## Version History

**v1.0.0** (2024-12-16)
- Initial release
- 4 commands: validate, dry-run, edit, diagram
- Full workflow schema support
- Rich terminal output
- LLM-powered diagram generation

---

## Support

For issues or questions:
1. Check this documentation
2. Review workflow schema: `app/workflows/schema.py`
3. Examine example workflows: `workflows/definitions/`
4. Open issue on GitHub

---

## License

Part of the LLM Workflow Service - see main project LICENSE file.
