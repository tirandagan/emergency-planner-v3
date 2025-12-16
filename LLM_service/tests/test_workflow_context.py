"""
Unit tests for workflow context management.

Tests variable storage, retrieval, and nested path resolution including:
- Three namespaces (input, steps, context)
- Nested path resolution (dot notation)
- Array indexing ([0], [1][2], etc.)
- Error handling (invalid paths, missing keys)
"""

import pytest

from app.workflows.context import WorkflowContext


# ============================================================================
# Basic Context Tests
# ============================================================================

def test_context_creation():
    """Test WorkflowContext creation with input data."""
    context = WorkflowContext({"location": "Seattle", "family_size": 4})

    assert context.input_data == {"location": "Seattle", "family_size": 4}
    assert context.steps == {}
    assert context.variables == {}


def test_set_step_output():
    """Test storing step output."""
    context = WorkflowContext({})

    context.set_step_output("fetch", {"count": 10, "results": []})

    assert context.has_step("fetch")
    assert context.step_succeeded("fetch")
    assert context.get_step_output("fetch") == {"count": 10, "results": []}


def test_set_step_error():
    """Test storing step error."""
    context = WorkflowContext({})

    context.set_step_error("fetch", "API error")

    assert context.has_step("fetch")
    assert not context.step_succeeded("fetch")
    assert context.get_step_output("fetch") is None


def test_set_get_variable():
    """Test setting and getting context variables."""
    context = WorkflowContext({})

    context.set_variable("user_id", "abc123")
    context.set_variable("tier", "PRO")

    assert context.get_variable("user_id") == "abc123"
    assert context.get_variable("tier") == "PRO"
    assert context.get_variable("missing") is None


# ============================================================================
# Path Resolution Tests
# ============================================================================

def test_get_value_simple_input():
    """Test getting simple input value."""
    context = WorkflowContext({"location": "Seattle"})

    assert context.get_value("input.location") == "Seattle"


def test_get_value_nested_input():
    """Test getting nested input value."""
    context = WorkflowContext({
        "location": {
            "city": "Seattle",
            "state": "WA"
        }
    })

    assert context.get_value("input.location.city") == "Seattle"
    assert context.get_value("input.location.state") == "WA"


def test_get_value_deeply_nested():
    """Test getting deeply nested value."""
    context = WorkflowContext({
        "user": {
            "profile": {
                "address": {
                    "city": "Seattle"
                }
            }
        }
    })

    assert context.get_value("input.user.profile.address.city") == "Seattle"


def test_get_value_step_output():
    """Test getting step output value."""
    context = WorkflowContext({})
    context.set_step_output("fetch", {"count": 10})

    assert context.get_value("steps.fetch.output.count") == 10


def test_get_value_step_nested():
    """Test getting nested step output value."""
    context = WorkflowContext({})
    context.set_step_output("fetch", {
        "data": {
            "results": [
                {"name": "Hospital", "distance": 2},
                {"name": "Fire Station", "distance": 1}
            ]
        }
    })

    assert context.get_value("steps.fetch.output.data.results") == [
        {"name": "Hospital", "distance": 2},
        {"name": "Fire Station", "distance": 1}
    ]


def test_get_value_context_variable():
    """Test getting context variable."""
    context = WorkflowContext({})
    context.set_variable("user_id", "abc123")

    assert context.get_value("context.user_id") == "abc123"


# ============================================================================
# Array Indexing Tests
# ============================================================================

def test_array_indexing_simple():
    """Test simple array indexing."""
    context = WorkflowContext({
        "items": ["first", "second", "third"]
    })

    assert context.get_value("input.items[0]") == "first"
    assert context.get_value("input.items[1]") == "second"
    assert context.get_value("input.items[2]") == "third"


def test_array_indexing_with_nested_object():
    """Test array indexing with nested objects."""
    context = WorkflowContext({
        "results": [
            {"name": "Hospital", "distance": 2},
            {"name": "Fire Station", "distance": 1}
        ]
    })

    assert context.get_value("input.results[0].name") == "Hospital"
    assert context.get_value("input.results[0].distance") == 2
    assert context.get_value("input.results[1].name") == "Fire Station"


def test_array_indexing_nested_arrays():
    """Test nested array indexing."""
    context = WorkflowContext({
        "matrix": [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ]
    })

    assert context.get_value("input.matrix[0][0]") == 1
    assert context.get_value("input.matrix[0][2]") == 3
    assert context.get_value("input.matrix[1][1]") == 5
    assert context.get_value("input.matrix[2][2]") == 9


def test_array_indexing_complex():
    """Test complex array indexing with multiple levels."""
    context = WorkflowContext({})
    context.set_step_output("fetch", {
        "data": {
            "categories": [
                {
                    "name": "Medical",
                    "items": [
                        {"name": "Hospital", "phone": "555-0100"},
                        {"name": "Clinic", "phone": "555-0101"}
                    ]
                },
                {
                    "name": "Emergency",
                    "items": [
                        {"name": "Fire", "phone": "911"},
                        {"name": "Police", "phone": "911"}
                    ]
                }
            ]
        }
    })

    # Access: steps.fetch.output.data.categories[0].items[0].name
    assert context.get_value("steps.fetch.output.data.categories[0].items[0].name") == "Hospital"
    assert context.get_value("steps.fetch.output.data.categories[0].items[1].phone") == "555-0101"
    assert context.get_value("steps.fetch.output.data.categories[1].items[0].phone") == "911"


# ============================================================================
# Error Handling Tests
# ============================================================================

def test_get_value_empty_path():
    """Test get_value raises error for empty path."""
    context = WorkflowContext({})

    with pytest.raises(ValueError, match="Path cannot be empty"):
        context.get_value("")


def test_get_value_unknown_namespace():
    """Test get_value raises error for unknown namespace."""
    context = WorkflowContext({})

    with pytest.raises(ValueError, match="Unknown namespace"):
        context.get_value("unknown.value")


def test_get_value_missing_key():
    """Test get_value raises KeyError for missing key."""
    context = WorkflowContext({"location": "Seattle"})

    with pytest.raises(KeyError):
        context.get_value("input.missing")


def test_get_value_invalid_array_index():
    """Test get_value raises IndexError for out of range index."""
    context = WorkflowContext({
        "items": ["first", "second"]
    })

    with pytest.raises(IndexError):
        context.get_value("input.items[5]")


def test_get_value_array_index_on_non_list():
    """Test get_value raises TypeError when indexing non-list."""
    context = WorkflowContext({
        "value": "string"
    })

    with pytest.raises(TypeError, match="Cannot index non-list"):
        context.get_value("input.value[0]")


def test_get_value_invalid_array_syntax():
    """Test get_value raises ValueError for invalid array syntax."""
    context = WorkflowContext({
        "items": [1, 2, 3]
    })

    with pytest.raises(ValueError, match="Unmatched bracket"):
        context.get_value("input.items[0")

    with pytest.raises(ValueError, match="Invalid array index"):
        context.get_value("input.items[abc]")


# ============================================================================
# Serialization Tests
# ============================================================================

def test_to_dict():
    """Test context serialization to dict."""
    context = WorkflowContext({"location": "Seattle"})
    context.set_step_output("fetch", {"count": 10})
    context.set_variable("user_id", "abc123")

    data = context.to_dict()

    assert data["input"] == {"location": "Seattle"}
    assert data["steps"]["fetch"]["output"] == {"count": 10}
    assert data["context"]["user_id"] == "abc123"


def test_from_dict():
    """Test context deserialization from dict."""
    data = {
        "input": {"location": "Seattle"},
        "steps": {
            "fetch": {
                "output": {"count": 10},
                "success": True
            }
        },
        "context": {"user_id": "abc123"}
    }

    context = WorkflowContext.from_dict(data)

    assert context.input_data == {"location": "Seattle"}
    assert context.get_step_output("fetch") == {"count": 10}
    assert context.get_variable("user_id") == "abc123"


def test_from_dict_empty():
    """Test deserialization with empty/missing fields."""
    data = {}

    context = WorkflowContext.from_dict(data)

    assert context.input_data == {}
    assert context.steps == {}
    assert context.variables == {}


def test_round_trip_serialization():
    """Test serialize -> deserialize preserves data."""
    original = WorkflowContext({"location": "Seattle", "family_size": 4})
    original.set_step_output("fetch", {"count": 10, "results": []})
    original.set_variable("user_id", "abc123")

    # Serialize and deserialize
    data = original.to_dict()
    restored = WorkflowContext.from_dict(data)

    # Verify all data preserved
    assert restored.input_data == original.input_data
    assert restored.steps == original.steps
    assert restored.variables == original.variables


# ============================================================================
# Repr Tests
# ============================================================================

def test_repr():
    """Test string representation for debugging."""
    context = WorkflowContext({"location": "Seattle"})
    context.set_step_output("fetch", {"count": 10})
    context.set_variable("user_id", "abc123")

    repr_str = repr(context)

    assert "WorkflowContext" in repr_str
    assert "location" in repr_str
    assert "fetch" in repr_str
    assert "user_id" in repr_str
