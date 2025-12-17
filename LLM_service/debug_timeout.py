"""Debug script to test asyncio.TimeoutError handling."""
import asyncio
from app.workflows.errors import is_retryable_error, get_retry_after, get_error_suggestions

# Create timeout error
error = asyncio.TimeoutError("Request timed out")

print(f"Error type: {type(error).__name__}")
print(f"Error module: {type(error).__module__}")
print(f"Error str: {str(error)}")
print(f"Error repr: {repr(error)}")
print(f"Error message lower: {str(error).lower()}")
print()
print(f"Is retryable: {is_retryable_error(error)}")
print(f"Retry after: {get_retry_after(error)}")
print(f"Suggestions: {get_error_suggestions(error, 'weatherapi', 'current')}")
