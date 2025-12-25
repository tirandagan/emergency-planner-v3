"""
Transformation Library for Workflow Engine

Provides 10 data transformation operations for processing workflow data:
1. extract_fields - JSONPath-based field extraction
2. filter - Condition-based filtering
3. map - Array element transformation
4. join - Array element joining
5. sort - Array sorting
6. unique - Array deduplication
7. regex_extract - Pattern-based extraction
8. markdown_to_json - Parse markdown to structured data
9. template - String template rendering
10. merge - Object merging

Each transformation supports error handling modes: fail, continue, default
"""

import re
import json
from typing import Any, Dict, List, Optional, Union
from abc import ABC, abstractmethod
from enum import Enum


class ErrorMode(str, Enum):
    """Error handling modes for transformations"""
    FAIL = "fail"  # Raise exception
    CONTINUE = "continue"  # Return None and log error
    DEFAULT = "default"  # Return default value


class TransformationError(Exception):
    """Base exception for transformation errors"""
    pass


class BaseTransformation(ABC):
    """Base class for all transformations"""

    def __init__(self, error_mode: ErrorMode = ErrorMode.FAIL, default_value: Any = None):
        self.error_mode = error_mode
        self.default_value = default_value

    @abstractmethod
    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        """Execute the transformation"""
        pass

    def handle_error(self, error: Exception, operation: str) -> Any:
        """Handle errors according to error mode"""
        if self.error_mode == ErrorMode.FAIL:
            raise TransformationError(f"{operation} failed: {str(error)}") from error
        elif self.error_mode == ErrorMode.CONTINUE:
            print(f"⚠️ {operation} error (continuing): {str(error)}")
            return None
        else:  # DEFAULT
            print(f"⚠️ {operation} error (using default): {str(error)}")
            return self.default_value


class ExtractFieldsTransformation(BaseTransformation):
    """
    Extract fields from nested data structures using JSONPath-like syntax

    Config:
    - paths: Dict[str, str] - Field name to path mapping
    - source: Optional[str] - Source object key (default: use input_data directly)

    Examples:
    - "name" -> data["name"]
    - "user.email" -> data["user"]["email"]
    - "items[0].id" -> data["items"][0]["id"]
    - "items[*].name" -> [item["name"] for item in data["items"]]
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            paths = config.get("paths", {})
            source_key = config.get("source")

            # Get source data
            source_data = input_data.get(source_key) if source_key else input_data

            # Extract fields
            result = {}
            for field_name, path in paths.items():
                try:
                    value = self._extract_path(source_data, path)
                    result[field_name] = value
                except Exception as e:
                    if self.error_mode == ErrorMode.FAIL:
                        raise TransformationError(f"Failed to extract '{path}': {str(e)}") from e
                    result[field_name] = None
                    print(f"⚠️ Failed to extract '{path}': {str(e)}")

            return result

        except Exception as e:
            return self.handle_error(e, "extract_fields")

    def _extract_path(self, data: Any, path: str) -> Any:
        """Extract value using path notation"""
        if not path:
            return data

        parts = self._parse_path(path)
        current = data

        for part in parts:
            if part == "*":
                # Array wildcard - collect from all items
                if not isinstance(current, list):
                    raise TransformationError(f"Cannot use wildcard on non-array: {type(current)}")
                return current
            elif part.isdigit():
                # Array index
                index = int(part)
                if not isinstance(current, (list, tuple)):
                    raise TransformationError(f"Cannot index non-array: {type(current)}")
                current = current[index]
            else:
                # Object key
                if isinstance(current, dict):
                    if part not in current:
                        raise TransformationError(f"Key '{part}' not found in data")
                    current = current[part]
                else:
                    raise TransformationError(f"Cannot access key '{part}' on {type(current)}")

        return current

    def _parse_path(self, path: str) -> List[str]:
        """Parse path string into parts"""
        # Split by . and handle array notation [0]
        parts = []
        current = ""

        for char in path:
            if char == ".":
                if current:
                    parts.append(current)
                    current = ""
            elif char == "[":
                if current:
                    parts.append(current)
                    current = ""
            elif char == "]":
                if current:
                    parts.append(current)
                    current = ""
            else:
                current += char

        if current:
            parts.append(current)

        return parts


class FilterTransformation(BaseTransformation):
    """
    Filter array elements based on conditions

    Config:
    - condition: str - Condition expression (e.g., "item.age > 18")
    - array_path: Optional[str] - Path to array in input data

    Supported operators: ==, !=, >, >=, <, <=, in, not in, contains
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            condition = config.get("condition")
            array_path = config.get("array_path")

            if not condition:
                raise TransformationError("Missing 'condition' in config")

            # Get array to filter
            if array_path:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                data = extractor._extract_path(input_data, array_path)
            else:
                data = input_data

            if not isinstance(data, list):
                raise TransformationError(f"Filter requires array input, got {type(data)}")

            # Filter array
            filtered = []
            for item in data:
                try:
                    if self._evaluate_condition(item, condition):
                        filtered.append(item)
                except Exception as e:
                    if self.error_mode == ErrorMode.FAIL:
                        raise
                    print(f"⚠️ Filter condition error: {str(e)}")

            return filtered

        except Exception as e:
            return self.handle_error(e, "filter")

    def _evaluate_condition(self, item: Any, condition: str) -> bool:
        """Evaluate condition expression"""
        # Simple condition parser
        # Supports: item.field == value, item.field > value, etc.

        operators = ["==", "!=", ">=", "<=", ">", "<", " in ", " not in ", " contains "]

        for op in operators:
            if op in condition:
                left, right = condition.split(op, 1)
                left_val = self._evaluate_expression(item, left.strip())
                right_val = self._evaluate_expression(item, right.strip())

                if op == "==":
                    return left_val == right_val
                elif op == "!=":
                    return left_val != right_val
                elif op == ">":
                    return left_val > right_val
                elif op == ">=":
                    return left_val >= right_val
                elif op == "<":
                    return left_val < right_val
                elif op == "<=":
                    return left_val <= right_val
                elif op == " in ":
                    return left_val in right_val
                elif op == " not in ":
                    return left_val not in right_val
                elif op == " contains ":
                    return right_val in left_val

        raise TransformationError(f"Invalid condition: {condition}")

    def _evaluate_expression(self, item: Any, expr: str) -> Any:
        """Evaluate expression (field path or literal)"""
        # Remove quotes from string literals
        if (expr.startswith('"') and expr.endswith('"')) or \
           (expr.startswith("'") and expr.endswith("'")):
            return expr[1:-1]

        # Try to parse as number
        try:
            if "." in expr:
                return float(expr)
            return int(expr)
        except ValueError:
            pass

        # Try to parse as boolean
        if expr.lower() == "true":
            return True
        if expr.lower() == "false":
            return False

        # Try to parse as null
        if expr.lower() in ("null", "none"):
            return None

        # Treat as field path (remove "item." prefix if present)
        path = expr.replace("item.", "")
        extractor = ExtractFieldsTransformation()
        return extractor._extract_path(item, path)


class MapTransformation(BaseTransformation):
    """
    Transform array elements

    Config:
    - expression: str - Transformation expression (e.g., "item.name.upper()")
    - array_path: Optional[str] - Path to array in input data
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            expression = config.get("expression")
            array_path = config.get("array_path")

            if not expression:
                raise TransformationError("Missing 'expression' in config")

            # Get array to map
            if array_path:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                data = extractor._extract_path(input_data, array_path)
            else:
                data = input_data

            if not isinstance(data, list):
                raise TransformationError(f"Map requires array input, got {type(data)}")

            # Map array
            mapped = []
            for item in data:
                try:
                    result = self._evaluate_map_expression(item, expression)
                    mapped.append(result)
                except Exception as e:
                    if self.error_mode == ErrorMode.FAIL:
                        raise
                    print(f"⚠️ Map expression error: {str(e)}")
                    mapped.append(None)

            return mapped

        except Exception as e:
            return self.handle_error(e, "map")

    def _evaluate_map_expression(self, item: Any, expression: str) -> Any:
        """Evaluate map expression"""
        # Simple expression evaluator
        # Supports: item.field, item["field"], item.field.upper(), etc.

        # Extract field path
        extractor = ExtractFieldsTransformation()

        # Handle method calls (e.g., .upper(), .lower())
        if ".upper()" in expression:
            path = expression.replace("item.", "").replace(".upper()", "")
            value = extractor._extract_path(item, path)
            return str(value).upper() if value else None

        if ".lower()" in expression:
            path = expression.replace("item.", "").replace(".lower()", "")
            value = extractor._extract_path(item, path)
            return str(value).lower() if value else None

        # Default: extract field
        path = expression.replace("item.", "")
        return extractor._extract_path(item, path)


class JoinTransformation(BaseTransformation):
    """
    Join array elements into string

    Config:
    - separator: str - Join separator (default: ", ")
    - array_path: Optional[str] - Path to array in input data
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            separator = config.get("separator", ", ")
            array_path = config.get("array_path")

            # Get array to join
            if array_path:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                data = extractor._extract_path(input_data, array_path)
            else:
                data = input_data

            if not isinstance(data, list):
                raise TransformationError(f"Join requires array input, got {type(data)}")

            # Join array
            return separator.join(str(item) for item in data if item is not None)

        except Exception as e:
            return self.handle_error(e, "join")


class SortTransformation(BaseTransformation):
    """
    Sort array elements

    Config:
    - key: Optional[str] - Field path to sort by (default: sort items directly)
    - reverse: bool - Sort in descending order (default: False)
    - array_path: Optional[str] - Path to array in input data
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            key_path = config.get("key")
            reverse = config.get("reverse", False)
            array_path = config.get("array_path")

            # Get array to sort
            if array_path:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                data = extractor._extract_path(input_data, array_path)
            else:
                data = input_data

            if not isinstance(data, list):
                raise TransformationError(f"Sort requires array input, got {type(data)}")

            # Sort array
            if key_path:
                extractor = ExtractFieldsTransformation()
                return sorted(
                    data,
                    key=lambda item: extractor._extract_path(item, key_path),
                    reverse=reverse
                )
            else:
                return sorted(data, reverse=reverse)

        except Exception as e:
            return self.handle_error(e, "sort")


class UniqueTransformation(BaseTransformation):
    """
    Remove duplicate elements from array

    Config:
    - key: Optional[str] - Field path for uniqueness check (default: compare items directly)
    - array_path: Optional[str] - Path to array in input data
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            key_path = config.get("key")
            array_path = config.get("array_path")

            # Get array to deduplicate
            if array_path:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                data = extractor._extract_path(input_data, array_path)
            else:
                data = input_data

            if not isinstance(data, list):
                raise TransformationError(f"Unique requires array input, got {type(data)}")

            # Deduplicate array
            if key_path:
                seen = set()
                unique = []
                extractor = ExtractFieldsTransformation()

                for item in data:
                    key_value = extractor._extract_path(item, key_path)
                    # Convert to hashable type
                    if isinstance(key_value, (dict, list)):
                        key_value = json.dumps(key_value, sort_keys=True)

                    if key_value not in seen:
                        seen.add(key_value)
                        unique.append(item)

                return unique
            else:
                # Direct comparison
                seen = set()
                unique = []

                for item in data:
                    # Convert to hashable type
                    item_key = item
                    if isinstance(item, (dict, list)):
                        item_key = json.dumps(item, sort_keys=True)

                    if item_key not in seen:
                        seen.add(item_key)
                        unique.append(item)

                return unique

        except Exception as e:
            return self.handle_error(e, "unique")


class RegexExtractTransformation(BaseTransformation):
    """
    Extract data using regular expressions

    Config:
    - pattern: str - Regex pattern
    - group: Optional[int|str] - Capture group to extract (default: 0 for full match)
    - all_matches: bool - Return all matches (default: False for first match only)
    - source: Optional[str] - Field path to extract from
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            pattern = config.get("pattern")
            group = config.get("group", 0)
            all_matches = config.get("all_matches", False)
            source = config.get("source")

            if not pattern:
                raise TransformationError("Missing 'pattern' in config")

            # Get source text
            if source:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                text = extractor._extract_path(input_data, source)
            else:
                text = input_data

            if not isinstance(text, str):
                text = str(text)

            # Compile regex
            regex = re.compile(pattern, re.MULTILINE | re.DOTALL)

            # Extract matches
            if all_matches:
                matches = regex.finditer(text)
                return [match.group(group) for match in matches]
            else:
                match = regex.search(text)
                return match.group(group) if match else None

        except Exception as e:
            return self.handle_error(e, "regex_extract")


class MarkdownToJsonTransformation(BaseTransformation):
    """
    Parse markdown text into structured JSON

    Config:
    - schema: str - Schema name (e.g., "emergency_contacts")
    - source: Optional[str] - Field path to markdown text

    Supported schemas:
    - emergency_contacts: Parse emergency contacts and meeting locations
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            schema = config.get("schema")
            source = config.get("source")

            if not schema:
                raise TransformationError("Missing 'schema' in config")

            # Get markdown text
            if source:
                extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
                markdown = extractor._extract_path(input_data, source)
            else:
                markdown = input_data

            if not isinstance(markdown, str):
                raise TransformationError(f"Markdown input must be string, got {type(markdown)}")

            # Parse based on schema
            if schema == "emergency_contacts":
                return self._parse_emergency_contacts(markdown)
            else:
                raise TransformationError(f"Unsupported schema: {schema}")

        except Exception as e:
            return self.handle_error(e, "markdown_to_json")

    def _parse_emergency_contacts(self, markdown: str) -> Dict[str, List[Dict]]:
        """Parse emergency contacts markdown format"""
        contacts = []
        meeting_locations = []

        # Split by main sections (##)
        sections = markdown.split("## ")

        in_contacts_section = False
        in_meeting_locations_section = False

        for section in sections:
            section = section.strip()
            if not section:
                continue

            section_header = section.split("\n")[0]

            # Check if this is Emergency Contacts Analysis section
            if section_header.startswith("Emergency Contacts Analysis"):
                in_contacts_section = True
                in_meeting_locations_section = False

                # Parse contacts with ### headers
                contact_blocks = section.split("### ")[1:]
                for block in contact_blocks:
                    contact = self._parse_contact_block(block)
                    if contact:
                        contacts.append(contact)
                continue

            # Check if this is Meeting Locations section
            if section_header.startswith("Meeting Locations"):
                in_contacts_section = False
                in_meeting_locations_section = True

                # Parse meeting locations with ### headers
                location_blocks = section.split("### ")[1:]
                for block in location_blocks:
                    location = self._parse_meeting_location_block(block)
                    if location:
                        meeting_locations.append(location)
                continue

            # Handle AI using ## instead of ### for individual items
            if in_contacts_section and "**Phone**" in section:
                contact = self._parse_contact_block(section)
                if contact:
                    contacts.append(contact)

            if in_meeting_locations_section and ("**Address**" in section or "Meeting Location:" in section):
                location = self._parse_meeting_location_block(section)
                if location:
                    meeting_locations.append(location)

        return {
            "contacts": contacts,
            "meeting_locations": meeting_locations
        }

    def _parse_contact_block(self, block: str) -> Optional[Dict[str, Any]]:
        """Parse individual contact block"""
        try:
            lines = block.split("\n")
            name = lines[0].strip()

            # Extract fields
            phone = self._extract_field(block, "Phone")
            address = self._extract_field(block, "Address")
            website = self._extract_field(block, "Website")
            category = self._extract_field(block, "Category")
            priority = self._extract_field(block, "Priority")
            fit_score = self._extract_field(block, "Fit Score")
            reasoning = self._extract_field(block, "Reasoning")
            relevant_scenarios = self._extract_field(block, "Relevant Scenarios")
            available_24hr = self._extract_field(block, "24/7 Available")

            # Validate required fields
            if not all([name, phone, category, priority, reasoning]):
                print(f"⚠️ Skipping contact '{name}' due to missing required fields")
                return None

            return {
                "name": name,
                "phone": phone,
                "address": address,
                "website": website,
                "category": category,
                "priority": priority,
                "fit_score": int(fit_score) if fit_score and fit_score.isdigit() else 80,
                "reasoning": reasoning,
                "relevant_scenarios": [s.strip() for s in relevant_scenarios.split(",")] if relevant_scenarios else [],
                "available_24hr": available_24hr and available_24hr.lower() == "yes",
            }
        except Exception as e:
            print(f"❌ Error parsing contact block: {str(e)}")
            return None

    def _parse_meeting_location_block(self, block: str) -> Optional[Dict[str, Any]]:
        """Parse meeting location block"""
        try:
            lines = block.split("\n")
            first_line = lines[0].strip()

            # Extract priority and name
            priority = "primary"
            name = first_line

            if "primary" in first_line.lower():
                priority = "primary"
                name = re.sub(r"primary meeting location:?", "", first_line, flags=re.IGNORECASE).strip()
            elif "secondary" in first_line.lower():
                priority = "secondary"
                name = re.sub(r"secondary meeting location:?", "", first_line, flags=re.IGNORECASE).strip()
            elif "tertiary" in first_line.lower():
                priority = "tertiary"
                name = re.sub(r"tertiary meeting location:?", "", first_line, flags=re.IGNORECASE).strip()

            address = self._extract_field(block, "Address")
            description = self._extract_field(block, "Description")
            reasoning = self._extract_field(block, "Reasoning")
            practical_details = self._extract_field(block, "Practical Details")
            suitable_for = self._extract_field(block, "Suitable For")

            # Validate required fields
            if not all([name, address, reasoning]):
                print(f"⚠️ Skipping meeting location '{name}' due to missing required fields")
                return None

            return {
                "name": name,
                "address": address,
                "description": description or reasoning,
                "reasoning": reasoning,
                "priority": priority,
                "suitable_for": [s.strip() for s in suitable_for.split(",")] if suitable_for else [],
                "has_parking": practical_details and "parking" in practical_details.lower(),
                "is_accessible": practical_details and ("accessible" in practical_details.lower() or "ada" in practical_details.lower()),
            }
        except Exception as e:
            print(f"❌ Error parsing meeting location block: {str(e)}")
            return None

    def _extract_field(self, block: str, field_name: str) -> Optional[str]:
        """Extract field value from markdown block"""
        pattern = rf"\*\*{field_name}\*\*:?\s*(.+?)(?:\n|$)"
        match = re.search(pattern, block, re.IGNORECASE)
        return match.group(1).strip() if match else None


class TemplateTransformation(BaseTransformation):
    """
    Render string template with variables

    Config:
    - template: str - Template string with ${var} placeholders
    - variables: Dict[str, Any] - Variable values
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            template = config.get("template")
            variables = config.get("variables", {})

            if not template:
                raise TransformationError("Missing 'template' in config")

            # Merge input_data with variables
            context_dict = {**input_data} if isinstance(input_data, dict) else {}
            context_dict.update(variables)

            # Use a temporary WorkflowContext to resolve variables (including nested ones)
            from .context import WorkflowContext
            ctx = WorkflowContext(context_dict)
            
            # Use the new resolve_string method which handles multiple placeholders and nested paths
            return ctx.resolve_string(template)

        except Exception as e:
            return self.handle_error(e, "template")


class MergeTransformation(BaseTransformation):
    """
    Merge multiple objects into one

    Config:
    - sources: List[str] - List of field paths to merge
    - strategy: str - Merge strategy ("shallow" or "deep", default: "shallow")
    """

    def execute(self, input_data: Any, config: Dict[str, Any]) -> Any:
        try:
            sources = config.get("sources", [])
            strategy = config.get("strategy", "shallow")

            if not sources:
                raise TransformationError("Missing 'sources' in config")

            # Extract source objects
            extractor = ExtractFieldsTransformation(error_mode=self.error_mode)
            merged = {}

            for source_path in sources:
                source_data = extractor._extract_path(input_data, source_path)
                if isinstance(source_data, dict):
                    if strategy == "deep":
                        self._deep_merge(merged, source_data)
                    else:
                        merged.update(source_data)
                else:
                    print(f"⚠️ Skipping non-dict source: {source_path}")

            return merged

        except Exception as e:
            return self.handle_error(e, "merge")

    def _deep_merge(self, target: Dict, source: Dict) -> None:
        """Deep merge source into target"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value


# Transformation Registry
TRANSFORMATION_REGISTRY = {
    "extract_fields": ExtractFieldsTransformation,
    "filter": FilterTransformation,
    "map": MapTransformation,
    "join": JoinTransformation,
    "sort": SortTransformation,
    "unique": UniqueTransformation,
    "regex_extract": RegexExtractTransformation,
    "markdown_to_json": MarkdownToJsonTransformation,
    "template": TemplateTransformation,
    "merge": MergeTransformation,
}


def get_transformation(operation: str, error_mode: ErrorMode = ErrorMode.FAIL, default_value: Any = None) -> BaseTransformation:
    """Get transformation instance by operation name"""
    transformation_class = TRANSFORMATION_REGISTRY.get(operation)
    if not transformation_class:
        raise TransformationError(f"Unknown transformation: {operation}")

    return transformation_class(error_mode=error_mode, default_value=default_value)


def execute_transformation(
    operation: str,
    input_data: Any,
    config: Dict[str, Any],
    error_mode: ErrorMode = ErrorMode.FAIL,
    default_value: Any = None
) -> Any:
    """Execute a transformation"""
    transformation = get_transformation(operation, error_mode, default_value)
    return transformation.execute(input_data, config)
