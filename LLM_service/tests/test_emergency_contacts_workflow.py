"""
Emergency Contacts Workflow Integration Test

Tests the complete emergency contacts workflow with data injection pattern.
Requires OPENROUTER_API_KEY environment variable.

Run with: pytest tests/test_emergency_contacts_workflow.py -v -s
"""

import pytest
import os
from pathlib import Path

from app.workflows.engine import WorkflowEngine


# Skip if no API key
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENROUTER_API_KEY"),
    reason="OPENROUTER_API_KEY not set - skipping integration tests"
)


@pytest.fixture
def engine():
    """Create WorkflowEngine with real configuration."""
    workflows_dir = Path(__file__).parent.parent / "workflows" / "definitions"
    prompts_dir = Path(__file__).parent.parent / "workflows" / "prompts"

    return WorkflowEngine(
        workflows_dir=str(workflows_dir),
        prompts_dir=str(prompts_dir),
        llm_provider="openrouter"
    )


@pytest.mark.asyncio
async def test_emergency_contacts_with_data_injection(engine):
    """
    Test emergency contacts workflow with pre-formatted data from main app.

    This demonstrates Phase 3 data injection pattern:
    1. Main app fetches Google Places data
    2. Main app formats it as markdown
    3. Main app passes it via input_data
    4. Workflow injects it into prompt
    """
    print("\n🚀 Testing Emergency Contacts Workflow with Data Injection...")

    # Load workflow
    workflow = engine.load_workflow("emergency_contacts")
    print(f"✅ Loaded workflow: {workflow.name} v{workflow.version}")

    # Simulate main app preparing data
    # In real scenario, this would come from:
    # - Static contacts database
    # - Google Places API call
    # - Regional emergency services database

    input_data = {
        # User context
        "city": "Seattle",
        "state": "WA",
        "country": "USA",
        "scenarios": "natural-disaster, pandemic",
        "family_size": 4,
        "duration": "72 hours",
        "user_tier": "PRO",

        # Pre-formatted static contacts (from main app database)
        "static_contacts": """# Universal Emergency Contacts

### 911 Emergency Services
**Phone**: 911
**Category**: government
**Priority**: critical
**Available**: 24/7

### National Poison Control Hotline
**Phone**: +1-800-222-1222
**Website**: https://www.poison.org
**Category**: medical
**Priority**: critical
**Available**: 24/7

### FEMA National Helpline
**Phone**: +1-800-621-3362
**Website**: https://www.fema.gov
**Category**: government
**Priority**: important

# Regional Contacts

### Washington State Emergency Management
**Phone**: +1-800-562-6108
**Website**: https://mil.wa.gov/emergency-management-division
**Category**: government
**Priority**: important
""",

        # Pre-formatted Google Places results (from main app API call)
        "google_places": """# Local Healthcare Facilities

### Harborview Medical Center
**Phone**: +1-206-744-3000
**Address**: 325 9th Ave, Seattle, WA 98104
**Rating**: 4.2/5 (1,234 reviews)
**Type**: Level 1 Trauma Center
**Distance**: 2.1 miles from user

### Swedish Medical Center - First Hill
**Phone**: +1-206-744-8000
**Address**: 747 Broadway, Seattle, WA 98122
**Rating**: 4.5/5 (892 reviews)
**Type**: Hospital
**Distance**: 1.8 miles from user

# Emergency Services

### Seattle Fire Department Station 10
**Phone**: +1-206-386-1400
**Address**: 301 2nd Ave S, Seattle, WA 98104
**Distance**: 1.5 miles from user

### Seattle Police Department - West Precinct
**Phone**: +1-206-684-8917
**Address**: 810 Virginia St, Seattle, WA 98101
**Distance**: 1.2 miles from user

# Community Resources

### Seattle Public Library - Central Branch
**Phone**: +1-206-386-4636
**Address**: 1000 4th Ave, Seattle, WA 98104
**Distance**: 0.8 miles from user

### Kerry Park (Meeting Location)
**Address**: 211 W Highland Dr, Seattle, WA 98119
**Type**: Public Park
**Features**: Elevated location, parking available, scenic viewpoint
**Distance**: 3.2 miles from user
"""
    }

    print(f"\n📝 Input Data Summary:")
    print(f"   Location: {input_data['city']}, {input_data['state']}")
    print(f"   Scenarios: {input_data['scenarios']}")
    print(f"   Family: {input_data['family_size']} people")
    print(f"   Static contacts: {len(input_data['static_contacts'])} characters")
    print(f"   Google Places data: {len(input_data['google_places'])} characters")

    # Execute workflow
    print(f"\n⚙️ Executing workflow...")
    result = await engine.execute_workflow(
        workflow=workflow,
        input_data=input_data
    )

    # Verify result
    print(f"\n📊 Workflow Result:")
    print(f"   Success: {result.success}")
    print(f"   Duration: {result.metadata['duration_ms']}ms")
    print(f"   Total tokens: {result.metadata['total_tokens']}")
    print(f"   Total cost: ${result.metadata['total_cost_usd']:.6f}")

    assert result.success is True
    assert len(result.steps_executed) == 1
    assert result.steps_executed[0]["step_id"] == "generate_contacts"

    # Verify output
    assert result.output is not None
    assert "content" in result.output
    content = result.output["content"]

    print(f"\n📝 LLM Generated Output:")
    print(f"{'='*80}")
    print(content[:1000])  # Print first 1000 chars
    if len(content) > 1000:
        print(f"\n... (truncated, total {len(content)} characters)")
    print(f"{'='*80}")

    # Verify output structure (should follow markdown format)
    assert "Emergency Contacts" in content or "emergency contacts" in content.lower()
    assert "##" in content or "###" in content  # Should have markdown headers

    # Verify some expected content based on input
    content_lower = content.lower()
    assert "seattle" in content_lower or "911" in content_lower

    # Verify metadata
    assert result.metadata["total_tokens"] > 100  # Should generate reasonable response
    assert result.metadata["total_cost_usd"] > 0

    print(f"\n✅ Emergency Contacts Workflow Integration Test Passed!")
    print(f"\n🎉 Phase 3 Complete - Workflow engine successfully:")
    print(f"   ✓ Loaded workflow from JSON")
    print(f"   ✓ Injected complex data into prompt template")
    print(f"   ✓ Called OpenRouter API")
    print(f"   ✓ Returned structured result with metadata")


if __name__ == "__main__":
    # Allow running directly
    import asyncio

    async def main():
        """Run test manually."""
        engine = WorkflowEngine(
            workflows_dir="workflows/definitions",
            prompts_dir="workflows/prompts"
        )

        print("Running Emergency Contacts Workflow Test...")
        await test_emergency_contacts_with_data_injection(engine)

    asyncio.run(main())
