# Workflow JSON Schema Documentation

**Complete reference for creating and validating JSON workflow definitions.**

---

## Table of Contents

- [Overview](#overview)
- [Workflow Structure](#workflow-structure)
- [Step Types](#step-types)
- [Variable Resolution](#variable-resolution)
- [Error Handling](#error-handling)
- [Transformation Operations](#transformation-operations)
- [External Services](#external-services)
- [Examples](#examples)
- [Validation](#validation)

---

## Overview

Workflows are JSON files that define multi-step AI operations. Each workflow consists of:

1. **Metadata**: Name, version, description, timeout
2. **Steps**: Sequential operations (LLM calls, API calls, transformations)
3. **Outputs**: Final data structure returned to caller

### Basic Workflow Template

```json
{
  "name": "my_workflow",
  "description": "Brief description of what this workflow does",
  "version": "1.0.0",
  "timeout": 120,
  "steps": [
    // Step definitions here
  ],
  "outputs": {
    // Output mapping here
  }
}
```

---

## Workflow Structure

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Unique workflow identifier (alphanumeric + underscores) |
| `description` | string | ✅ Yes | Human-readable description |
| `version` | string | ✅ Yes | Semantic version (e.g., "1.0.0") |
| `timeout` | integer | ❌ No | Max execution time in seconds (default: 120) |
| `steps` | array | ✅ Yes | Array of step definitions |
| `outputs` | object | ✅ Yes | Output variable mapping |

### Step Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique step identifier within workflow |
| `type` | string | ✅ Yes | Step type: `llm`, `external_api`, `transform`, `conditional`, `parallel` |
| `description` | string | ❌ No | Human-readable step description |
| `config` | object | ✅ Yes | Step-specific configuration |
| `error_mode` | string | ❌ No | Error handling: `fail` (default), `continue`, `retry` |
| `retry_count` | integer | ❌ No | Max retry attempts (default: 3, only for `error_mode: retry`) |
| `outputs` | array | ❌ No | Output variable names (defaults to `[<step_id>]`) |

---

## Step Types

### 1. LLM Step

Calls a language model (Claude, GPT, etc.) with a prompt.

**Configuration:**

```json
{
  "id": "generate_content",
  "type": "llm",
  "description": "Generate content with Claude",
  "provider": "openrouter",
  "model": "anthropic/claude-3.5-sonnet",
  "prompt_template": "path/to/prompt.md",
  "user_message": "${input.query}",
  "variables": {
    "context": "${input.contextData}",
    "format": "markdown"
  },
  "temperature": 0.7,
  "max_tokens": 4000,
  "error_mode": "fail",
  "outputs": ["content", "llm_usage"]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ✅ Yes | LLM provider: `openrouter`, `anthropic`, `openai` |
| `model` | string | ✅ Yes | Model ID (e.g., `anthropic/claude-3.5-sonnet`) |
| `prompt_template` | string | ❌ No | Path to prompt template file (relative to `workflows/prompts/`) |
| `user_message` | string | ❌ No | User message content (can use variables) |
| `variables` | object | ❌ No | Variables to substitute in prompt template |
| `temperature` | number | ❌ No | Sampling temperature (0.0-1.0, default: 0.7) |
| `max_tokens` | integer | ❌ No | Maximum tokens to generate (default: 4000) |

**Outputs:**
- `<step_id>`: Generated text content
- `<step_id>_usage`: Token usage object with `input_tokens`, `output_tokens`, `total_tokens`, `cost_usd`

---

### 2. External API Step

Calls external services (WeatherAPI, Google Places, etc.).

**Configuration:**

```json
{
  "id": "fetch_weather",
  "type": "external_api",
  "description": "Get current weather",
  "service": "weatherapi",
  "operation": "current",
  "config": {
    "lat": "${input.latitude}",
    "lng": "${input.longitude}"
  },
  "error_mode": "continue",
  "outputs": ["weather_data"]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service` | string | ✅ Yes | Service name: `weatherapi`, `google_places` |
| `operation` | string | ✅ Yes | Service operation (see [External Services](#external-services)) |
| `config` | object | ✅ Yes | Operation-specific parameters |

**Outputs:**
- `<step_id>`: API response data
- `<step_id>_cached`: Boolean indicating if response was from cache

---

### 3. Transform Step

Applies data transformations (filter, map, template, etc.).

**Configuration:**

```json
{
  "id": "format_data",
  "type": "transform",
  "description": "Format data for LLM",
  "operation": "template",
  "config": {
    "source": "${steps.fetch_weather.weather_data}",
    "template": "Temperature: ${temp_c}°C, Condition: ${condition.text}",
    "variables": {
      "temp_c": "${steps.fetch_weather.weather_data.current.temp_c}",
      "condition": "${steps.fetch_weather.weather_data.current.condition}"
    }
  },
  "error_mode": "fail",
  "outputs": ["formatted_weather"]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `operation` | string | ✅ Yes | Transformation type (see [Transformation Operations](#transformation-operations)) |
| `config` | object | ✅ Yes | Operation-specific configuration |

**Outputs:**
- `<step_id>`: Transformed data

---

### 4. Conditional Step

Executes steps based on conditions.

**Configuration:**

```json
{
  "id": "check_weather",
  "type": "conditional",
  "description": "Branch based on weather conditions",
  "condition": "${steps.fetch_weather.weather_data.current.temp_c} > 30",
  "if_true": [
    {
      "id": "hot_weather_warning",
      "type": "transform",
      "operation": "template",
      "config": {
        "template": "⚠️ High temperature warning: ${temp}°C"
      }
    }
  ],
  "if_false": [
    {
      "id": "normal_weather_info",
      "type": "transform",
      "operation": "template",
      "config": {
        "template": "Temperature is normal: ${temp}°C"
      }
    }
  ]
}
```

**Note**: Conditional steps are planned for future implementation (Phase 12+).

---

### 5. Parallel Step

Executes multiple steps concurrently.

**Configuration:**

```json
{
  "id": "fetch_all_data",
  "type": "parallel",
  "description": "Fetch weather and places simultaneously",
  "steps": [
    {
      "id": "fetch_weather",
      "type": "external_api",
      "service": "weatherapi",
      "operation": "current",
      "config": {"lat": "${input.lat}", "lng": "${input.lng}"}
    },
    {
      "id": "fetch_hospitals",
      "type": "external_api",
      "service": "google_places",
      "operation": "nearby_search",
      "config": {
        "lat": "${input.lat}",
        "lng": "${input.lng}",
        "type": "hospital"
      }
    }
  ]
}
```

**Note**: Parallel steps are planned for future implementation (Phase 12+).

---

## Variable Resolution

Variables use the syntax `${namespace.path}` and are resolved from three sources:

### 1. Input Variables

Access input data passed when submitting the workflow:

```json
{
  "variables": {
    "city": "${input.city}",
    "state": "${input.state}",
    "latitude": "${input.coordinates.lat}"
  }
}
```

### 2. Step Outputs

Access outputs from previous steps:

```json
{
  "variables": {
    "weather": "${steps.fetch_weather.weather_data}",
    "temperature": "${steps.fetch_weather.weather_data.current.temp_c}"
  }
}
```

### 3. Context Variables

Access workflow context variables:

```json
{
  "variables": {
    "workflow_start_time": "${context.start_time}",
    "execution_id": "${context.execution_id}"
  }
}
```

### Variable Paths

- **Dot notation**: `${input.location.city}`
- **Array indexing**: `${steps.format.items[0]}`
- **Wildcards**: `${steps.format.items[*].name}` (returns array)

### Template Variables

In template transformations, variables can use shorthand without namespace if defined in `variables` object:

```json
{
  "operation": "template",
  "config": {
    "template": "City: ${city}, State: ${state}",
    "variables": {
      "city": "${input.city}",
      "state": "${input.state}"
    }
  }
}
```

---

## Error Handling

### Error Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `fail` | Stop workflow on error | Critical steps that must succeed |
| `continue` | Skip failed step, continue workflow | Optional enhancements (e.g., weather data) |
| `retry` | Retry step up to `retry_count` times | Transient API failures |

### Error Mode Examples

**Fail (Default):**
```json
{
  "id": "critical_llm_call",
  "type": "llm",
  "error_mode": "fail"
  // Workflow stops if this step fails
}
```

**Continue:**
```json
{
  "id": "optional_weather",
  "type": "external_api",
  "error_mode": "continue"
  // Workflow continues even if weather API fails
  // Step output will be null
}
```

**Retry:**
```json
{
  "id": "api_call_with_retry",
  "type": "external_api",
  "error_mode": "retry",
  "retry_count": 3,
  "retry_delay": 5
  // Retries up to 3 times with 5s delay between attempts
}
```

### Error Context

All errors include structured context:

```json
{
  "type": "TimeoutError",
  "category": "EXTERNAL_ERROR",
  "message": "API request timed out after 30s",
  "retryable": true,
  "retry_after": 30,
  "step_id": "fetch_weather",
  "details": {
    "service": "weatherapi",
    "operation": "current",
    "suggestions": [
      "Retry after 30 seconds",
      "Check WeatherAPI service status"
    ]
  }
}
```

---

## Transformation Operations

### 1. Extract Fields

Extract specific fields from objects or arrays.

**Configuration:**
```json
{
  "operation": "extract_fields",
  "config": {
    "source": "${input.data}",
    "fields": {
      "name": "full_name",
      "email": "contact.email",
      "age": "profile.age"
    }
  }
}
```

**Input:** `{"full_name": "John", "contact": {"email": "john@example.com"}}`
**Output:** `{"name": "John", "email": "john@example.com"}`

---

### 2. Filter

Filter arrays based on conditions.

**Configuration:**
```json
{
  "operation": "filter",
  "config": {
    "source": "${steps.fetch.items}",
    "condition": "age >= 18",
    "field": "age"
  }
}
```

**Supported operators:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`

---

### 3. Map

Transform each element in an array.

**Configuration:**
```json
{
  "operation": "map",
  "config": {
    "source": "${steps.fetch.items}",
    "transform": "name.upper()"
  }
}
```

**Supported methods:** `.upper()`, `.lower()`, `.strip()`, `.title()`

---

### 4. Join

Join array elements into a string.

**Configuration:**
```json
{
  "operation": "join",
  "config": {
    "source": "${steps.fetch.items}",
    "separator": ", "
  }
}
```

---

### 5. Sort

Sort arrays.

**Configuration:**
```json
{
  "operation": "sort",
  "config": {
    "source": "${steps.fetch.items}",
    "field": "priority",
    "reverse": true
  }
}
```

---

### 6. Unique

Remove duplicates from arrays.

**Configuration:**
```json
{
  "operation": "unique",
  "config": {
    "source": "${steps.fetch.items}",
    "field": "id"
  }
}
```

---

### 7. Regex Extract

Extract data using regular expressions.

**Configuration:**
```json
{
  "operation": "regex_extract",
  "config": {
    "source": "${steps.llm.content}",
    "patterns": {
      "email": "([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})",
      "phone": "(\\d{3}-\\d{3}-\\d{4})"
    }
  }
}
```

---

### 8. Markdown to JSON

Parse structured markdown into JSON (specific to emergency contacts format).

**Configuration:**
```json
{
  "operation": "markdown_to_json",
  "config": {
    "source": "${steps.llm.content}",
    "format": "emergency_contacts"
  }
}
```

---

### 9. Template

String templating with variable substitution.

**Configuration:**
```json
{
  "operation": "template",
  "config": {
    "template": "Hello ${name}, you are ${age} years old.",
    "variables": {
      "name": "${input.userName}",
      "age": "${input.userAge}"
    }
  }
}
```

---

### 10. Merge

Merge multiple objects.

**Configuration:**
```json
{
  "operation": "merge",
  "config": {
    "sources": [
      "${steps.fetch1.data}",
      "${steps.fetch2.data}"
    ],
    "strategy": "shallow"
  }
}
```

**Strategies:** `shallow` (overwrite), `deep` (recursive merge)

---

## External Services

### WeatherAPI

**Operations:**

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `current` | Get current weather | `lat`, `lng` OR `q` (city name) |

**Example:**
```json
{
  "service": "weatherapi",
  "operation": "current",
  "config": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

**Output:**
```json
{
  "location": {
    "name": "San Francisco",
    "region": "California",
    "country": "United States"
  },
  "current": {
    "temp_c": 18.3,
    "temp_f": 64.9,
    "condition": {
      "text": "Partly cloudy",
      "icon": "//cdn.weatherapi.com/..."
    },
    "wind_mph": 10.5,
    "humidity": 65
  }
}
```

---

### Google Places

**Operations:**

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `nearby_search` | Find places within radius | `lat`, `lng`, `radius`, `type` |
| `text_search` | Search by text query | `query`, `lat`, `lng` (optional) |
| `place_details` | Get place details | `place_id` |

**Example:**
```json
{
  "service": "google_places",
  "operation": "nearby_search",
  "config": {
    "lat": 37.7749,
    "lng": -122.4194,
    "radius": 5000,
    "type": "hospital"
  }
}
```

**Output:**
```json
{
  "results": [
    {
      "name": "UCSF Medical Center",
      "formatted_address": "505 Parnassus Ave, San Francisco, CA 94143",
      "place_id": "ChIJ...",
      "geometry": {
        "location": {"lat": 37.7629, "lng": -122.4577}
      },
      "rating": 4.5,
      "types": ["hospital", "health"]
    }
  ]
}
```

---

## Examples

### Complete Emergency Contacts Workflow

See `workflows/definitions/emergency_contacts.json` for a production example with:
- 7 sequential steps
- External API calls (WeatherAPI, Google Places)
- Data transformations
- LLM generation
- Markdown parsing

### Complete Mission Generation Workflow

See `workflows/definitions/mission_generation.json` for a streaming LLM example with:
- Bundle data formatting
- Complex prompt template loading
- Streaming response support
- Section parsing via regex

---

## Validation

### CLI Validation Tool

```bash
# Validate workflow JSON
python -m cli validate workflows/definitions/my_workflow.json

# Output:
# ✓ JSON structure valid
# ✓ Schema validation passed
# ✓ All step IDs are unique
# ✓ Variable references validated
# ⚠ Warning: Unknown variable ${input.unknown}
```

### Validation Rules

1. **Unique Step IDs**: All step IDs must be unique within a workflow
2. **Valid Step Types**: Step type must be one of: `llm`, `external_api`, `transform`, `conditional`, `parallel`
3. **Required Fields**: All required fields must be present
4. **Variable References**: Variables must reference valid namespaces (`input`, `steps`, `context`)
5. **Circular Dependencies**: No circular step dependencies allowed
6. **Output References**: Step outputs must exist before being referenced

### Common Validation Errors

**Missing Required Field:**
```
❌ Error: Missing required field 'model' in LLM step 'generate_content'
```

**Invalid Variable Reference:**
```
⚠ Warning: Unknown variable '${steps.nonexistent.data}' in step 'format'
```

**Duplicate Step ID:**
```
❌ Error: Duplicate step ID 'fetch_data' found in steps 2 and 5
```

---

## Best Practices

### 1. Descriptive Step IDs

Use clear, descriptive step IDs that indicate purpose:

```json
{
  "id": "fetch_weather_data",  // ✅ Good
  "id": "step1"  // ❌ Bad
}
```

### 2. Error Mode Selection

Choose appropriate error modes based on criticality:

- **Critical data**: `error_mode: fail`
- **Optional enhancements**: `error_mode: continue`
- **Transient failures**: `error_mode: retry`

### 3. Variable Organization

Group related variables for clarity:

```json
{
  "variables": {
    "location_city": "${input.formData.location.city}",
    "location_state": "${input.formData.location.state}",
    "location_lat": "${input.formData.location.coordinates.lat}",
    "location_lng": "${input.formData.location.coordinates.lng}"
  }
}
```

### 4. Prompt Templates

Use external template files for long prompts:

```json
{
  "prompt_template": "mission-generation/mega-prompt.md",
  // ✅ Better than inline prompts for maintainability
}
```

### 5. Output Naming

Use consistent output naming:

```json
{
  "outputs": [
    "primary_result",    // Main output
    "metadata",          // Execution metadata
    "cost_data"          // Cost information
  ]
}
```

---

## Advanced Features

### Prompt Template Includes

Prompt templates support `{{include:filename.md}}` directives:

```markdown
# System Prompt

{{include:../shared/tone-and-voice.md}}

## Specific Instructions

{{include:scenario-specific/earthquake.md}}
```

### Variable Substitution in Templates

Templates support `{{variable_name}}` placeholders:

```markdown
Generate a plan for {{city}}, {{state}} with {{family_size}} people.
Duration: {{duration_days}} days
Budget: ${{budget_amount}}
```

### Streaming Support

LLM steps support streaming responses for real-time updates:

```json
{
  "type": "llm",
  "streaming": true,
  // Enables real-time token streaming
  // Requires client-side stream processing
}
```

---

## Support

- **CLI Tool**: Use `python -m cli --help` for command reference
- **Validation**: Use `python -m cli validate <workflow.json>` to check workflows
- **Examples**: See `workflows/definitions/` for production examples
- **Issues**: GitHub Issues for bug reports and feature requests

---

## License

MIT License - see [LICENSE](LICENSE) file for details.
