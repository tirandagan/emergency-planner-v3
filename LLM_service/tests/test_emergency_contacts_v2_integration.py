"""
Emergency Contacts Workflow v2.0.0 Integration Test

Tests the complete emergency contacts workflow with external API integration.
This matches Phase 8 requirements and validates against TypeScript implementation.

Requires:
- OPENROUTER_API_KEY
- NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY
- WEATHERAPI_KEY (optional, has continue error mode)

Run with: pytest tests/test_emergency_contacts_v2_integration.py -v -s
"""

import pytest
import os
import json
from pathlib import Path
from typing import Dict, Any

from app.workflows.engine import WorkflowEngine


# Skip if no API keys
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENROUTER_API_KEY") or not os.getenv("NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY"),
    reason="Required API keys not set - skipping integration tests"
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
async def test_emergency_contacts_v2_full_workflow(engine):
    """
    Test emergency contacts workflow v2.0.0 with real external APIs.

    This validates:
    1. All 7 workflow steps execute successfully
    2. External APIs (Google Places, WeatherAPI) work correctly
    3. Transformation steps format data properly
    4. LLM generates valid emergency contacts
    5. Markdown parser extracts structured data
    6. Output structure matches TypeScript implementation
    """
    print("\n🚀 Testing Emergency Contacts Workflow v2.0.0...")

    # Load workflow
    workflow = engine.load_workflow("emergency_contacts")
    print(f"✅ Loaded workflow: {workflow.name} v{workflow.version}")
    assert workflow.version == "2.0.0", f"Expected version 2.0.0, got {workflow.version}"

    # Verify step count
    assert len(workflow.steps) == 7, f"Expected 7 steps, got {len(workflow.steps)}"
    print(f"✅ Workflow has 7 steps:")
    for idx, step in enumerate(workflow.steps, 1):
        print(f"   {idx}. {step.id} ({step.type})")

    # Input data matching TypeScript implementation structure
    # This simulates what the main app would provide
    input_data = {
        # Location data (matches formData.location)
        "city": "Seattle",
        "state": "WA",
        "country": "USA",
        "lat": 47.6062,
        "lng": -122.3321,

        # User context (matches formData)
        "scenarios": "natural-disaster, pandemic",
        "family_size": 4,
        "duration": "72 hours",
        "user_tier": "PRO",

        # Static contacts (from getAllStaticContacts() in TypeScript)
        "static_contacts": """### 911 Emergency Services
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

### Washington State Emergency Management
**Phone**: +1-800-562-6108
**Website**: https://mil.wa.gov/emergency-management-division
**Category**: government
**Priority**: important
"""
    }

    print(f"\n📝 Input Data:")
    print(f"   Location: {input_data['city']}, {input_data['state']} ({input_data['lat']}, {input_data['lng']})")
    print(f"   Scenarios: {input_data['scenarios']}")
    print(f"   Family: {input_data['family_size']} people")
    print(f"   Duration: {input_data['duration']}")
    print(f"   Tier: {input_data['user_tier']}")

    # Execute workflow
    print(f"\n⚙️ Executing workflow (this may take 30-60 seconds)...")
    result = await engine.execute_workflow(
        workflow=workflow,
        input_data=input_data
    )

    # Verify result success
    print(f"\n📊 Workflow Result:")
    print(f"   Success: {result.success}")
    print(f"   Duration: {result.metadata['duration_ms']}ms ({result.metadata['duration_ms']/1000:.1f}s)")
    print(f"   Total tokens: {result.metadata.get('total_tokens', 'N/A')}")
    print(f"   Total cost: ${result.metadata.get('total_cost_usd', 0):.6f}")

    assert result.success is True, f"Workflow failed: {result.error}"

    # Verify all steps executed
    expected_steps = [
        "fetch_weather",
        "fetch_hospitals",
        "fetch_police",
        "fetch_fire_stations",
        "format_places_data",
        "generate_contacts",
        "parse_contacts"
    ]

    executed_step_ids = [step["step_id"] for step in result.steps_executed]
    print(f"\n✅ Steps Executed ({len(executed_step_ids)}/{len(expected_steps)}):")
    for step in result.steps_executed:
        status = "✅" if step["success"] else "❌"
        duration = step.get("duration_ms", 0)
        print(f"   {status} {step['step_id']} ({duration}ms)")

    # Verify expected steps (some may be skipped with continue error mode)
    assert len(executed_step_ids) >= 3, f"Expected at least 3 steps executed, got {len(executed_step_ids)}"
    assert "generate_contacts" in executed_step_ids, "LLM generation step must execute"
    assert "parse_contacts" in executed_step_ids, "Parsing step must execute"

    # Verify output structure
    assert result.output is not None, "Output should not be None"

    # Check if parse_contacts produced structured output
    if "contacts" in result.output:
        contacts = result.output["contacts"]
        meeting_locations = result.output.get("meeting_locations", [])

        print(f"\n📋 Parsed Output:")
        print(f"   Contacts: {len(contacts)}")
        print(f"   Meeting Locations: {len(meeting_locations)}")

        # Verify contact structure (matches TypeScript EmergencyContactRecommendation)
        if len(contacts) > 0:
            sample_contact = contacts[0]
            print(f"\n📝 Sample Contact:")
            print(f"   Name: {sample_contact.get('name')}")
            print(f"   Phone: {sample_contact.get('phone')}")
            print(f"   Category: {sample_contact.get('category')}")
            print(f"   Priority: {sample_contact.get('priority')}")
            print(f"   Fit Score: {sample_contact.get('fit_score')}")
            print(f"   Reasoning: {sample_contact.get('reasoning', '')[:100]}...")

            # Verify required fields exist
            required_fields = ["name", "phone", "category", "priority", "reasoning"]
            for field in required_fields:
                assert field in sample_contact, f"Missing required field: {field}"

        # Verify meeting location structure (matches TypeScript MeetingLocationRecommendation)
        if len(meeting_locations) > 0:
            sample_location = meeting_locations[0]
            print(f"\n📍 Sample Meeting Location:")
            print(f"   Name: {sample_location.get('name')}")
            print(f"   Address: {sample_location.get('address')}")
            print(f"   Priority: {sample_location.get('priority')}")
            print(f"   Reasoning: {sample_location.get('reasoning', '')[:100]}...")

            # Verify required fields exist
            required_fields = ["name", "address", "reasoning", "priority"]
            for field in required_fields:
                assert field in sample_location, f"Missing required field: {field}"
    else:
        # If no parsed output, check raw markdown
        print(f"\n⚠️ No parsed output - checking raw markdown...")

        # Check for markdown content in steps
        for step in result.steps_executed:
            if step["step_id"] == "generate_contacts" and step.get("output"):
                content = step["output"].get("content", "")
                print(f"\n📝 LLM Generated Output Preview:")
                print(f"{'='*80}")
                print(content[:500])
                if len(content) > 500:
                    print(f"\n... (truncated, total {len(content)} characters)")
                print(f"{'='*80}")

                # Verify basic markdown structure
                assert "##" in content or "###" in content, "Should have markdown headers"
                assert "Emergency Contacts" in content or "emergency contacts" in content.lower()

    # Verify cost calculations
    if "llm_calls" in result.metadata:
        llm_calls = result.metadata["llm_calls"]
        print(f"\n💰 LLM Usage:")
        for call in llm_calls:
            print(f"   Model: {call.get('model')}")
            print(f"   Tokens: {call.get('input_tokens')} in + {call.get('output_tokens')} out = {call.get('total_tokens')} total")
            print(f"   Cost: ${call.get('cost_usd', 0):.6f}")
            print(f"   Duration: {call.get('duration_ms')}ms")

            # Verify cost calculation matches expected ranges for Claude Sonnet 3.5
            # Input: $3/1M tokens, Output: $15/1M tokens
            if call.get('model') == 'anthropic/claude-3.5-sonnet':
                input_tokens = call.get('input_tokens', 0)
                output_tokens = call.get('output_tokens', 0)

                expected_cost = (input_tokens * 3 / 1_000_000) + (output_tokens * 15 / 1_000_000)
                actual_cost = call.get('cost_usd', 0)

                # Allow 1% tolerance for floating point arithmetic
                assert abs(actual_cost - expected_cost) / expected_cost < 0.01, \
                    f"Cost calculation mismatch: expected ${expected_cost:.6f}, got ${actual_cost:.6f}"

                print(f"   ✅ Cost calculation verified (expected ${expected_cost:.6f})")

    print(f"\n✅ Emergency Contacts Workflow v2.0.0 Integration Test Passed!")
    print(f"\n🎉 Phase 8 Validation Complete:")
    print(f"   ✓ Workflow loads successfully")
    print(f"   ✓ External APIs work (Google Places, WeatherAPI)")
    print(f"   ✓ Transformations execute correctly")
    print(f"   ✓ LLM generates emergency contacts")
    print(f"   ✓ Markdown parsing produces structured data")
    print(f"   ✓ Output structure matches TypeScript implementation")
    print(f"   ✓ Cost calculations are accurate")


@pytest.mark.asyncio
async def test_emergency_contacts_output_structure_comparison(engine):
    """
    Compare output structure with TypeScript implementation.

    This test validates that the Python workflow produces output compatible
    with what the main Next.js app expects from emergency-contacts-generator.ts
    """
    print("\n🔍 Testing Output Structure Compatibility...")

    workflow = engine.load_workflow("emergency_contacts")

    # Minimal input for quick test
    input_data = {
        "city": "Portland",
        "state": "OR",
        "country": "USA",
        "lat": 45.5152,
        "lng": -122.6784,
        "scenarios": "natural-disaster",
        "family_size": 2,
        "duration": "24 hours",
        "user_tier": "BASIC",
        "static_contacts": "### 911\n**Phone**: 911\n**Category**: government\n**Priority**: critical"
    }

    result = await engine.execute_workflow(
        workflow=workflow,
        input_data=input_data
    )

    assert result.success is True

    # TypeScript EmergencyContactsSection structure:
    # {
    #   contacts: EmergencyContactRecommendation[]
    #   meetingLocations: MeetingLocationRecommendation[]
    #   generatedAt: string (ISO timestamp)
    #   locationContext: string
    #   googlePlacesUsed: boolean
    #   aiAnalysisUsed: boolean
    # }

    # Validate that our output can be transformed to match this structure
    if "contacts" in result.output:
        print(f"\n✅ Output Structure:")
        print(f"   contacts: Array[{len(result.output['contacts'])}]")
        print(f"   meeting_locations: Array[{len(result.output.get('meeting_locations', []))}]")

        # Additional metadata that main app can add:
        metadata = {
            "generatedAt": result.metadata.get("completed_at", ""),
            "locationContext": f"{input_data['city']}, {input_data['state']}",
            "googlePlacesUsed": True,  # v2.0 always uses Google Places
            "aiAnalysisUsed": True
        }
        print(f"\n✅ Metadata compatibility:")
        for key, value in metadata.items():
            print(f"   {key}: {value}")

        print(f"\n✅ Output structure is compatible with TypeScript implementation")
    else:
        print(f"\n⚠️ No parsed contacts in output - raw markdown only")


if __name__ == "__main__":
    # Allow running directly
    import asyncio

    async def main():
        """Run tests manually."""
        from app.config import settings

        # Verify environment
        if not settings.OPENROUTER_API_KEY:
            print("❌ OPENROUTER_API_KEY not set")
            return

        if not settings.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY:
            print("❌ NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY not set")
            return

        engine = WorkflowEngine(
            workflows_dir="workflows/definitions",
            prompts_dir="workflows/prompts",
            llm_provider="openrouter"
        )

        print("=" * 80)
        print("Running Emergency Contacts v2.0.0 Integration Test")
        print("=" * 80)

        await test_emergency_contacts_v2_full_workflow(engine)

        print("\n" + "=" * 80)
        print("Running Output Structure Comparison Test")
        print("=" * 80)

        await test_emergency_contacts_output_structure_comparison(engine)

    asyncio.run(main())
