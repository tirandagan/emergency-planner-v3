"""
Integration Tests for Complete Workflow Execution

Tests end-to-end workflow execution with real OpenRouter API.
Requires OPENROUTER_API_KEY environment variable to be set.

Run with: pytest tests/test_integration_workflow.py -v -s
"""

import pytest
import os
from pathlib import Path

from app.workflows.engine import WorkflowEngine, WorkflowResult
from app.workflows.schema import Workflow


# Skip all tests if no OpenRouter API key
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENROUTER_API_KEY"),
    reason="OPENROUTER_API_KEY not set - skipping integration tests"
)


@pytest.fixture
def engine():
    """Create WorkflowEngine with real configuration."""
    # Use actual directories
    workflows_dir = Path(__file__).parent.parent / "workflows" / "definitions"
    prompts_dir = Path(__file__).parent.parent / "workflows" / "prompts"

    return WorkflowEngine(
        workflows_dir=str(workflows_dir),
        prompts_dir=str(prompts_dir),
        llm_provider="openrouter"
    )


# ============================================================================
# Simple Test Workflow
# ============================================================================

@pytest.mark.asyncio
async def test_simple_workflow_with_real_llm(engine):
    """Test simple workflow with real OpenRouter API call."""
    print("\n🚀 Starting simple workflow integration test...")

    # Load workflow
    workflow = engine.load_workflow("test_simple")
    assert workflow.name == "test_simple"
    print(f"✅ Loaded workflow: {workflow.name}")

    # Execute with test data
    input_data = {
        "name": "Alice",
        "location": "Seattle, WA"
    }

    print(f"📝 Input data: {input_data}")

    result = await engine.execute_workflow(
        workflow=workflow,
        input_data=input_data
    )

    # Verify result
    print(f"\n📊 Workflow Result:")
    print(f"   Success: {result.success}")
    print(f"   Steps executed: {len(result.steps_executed)}")
    print(f"   Duration: {result.metadata['duration_ms']}ms")
    print(f"   Total tokens: {result.metadata['total_tokens']}")
    print(f"   Total cost: ${result.metadata['total_cost_usd']:.6f}")

    assert result.success is True
    assert len(result.steps_executed) == 1
    assert result.steps_executed[0]["step_id"] == "greet"
    assert result.steps_executed[0]["success"] is True

    # Verify output
    assert result.output is not None
    assert "content" in result.output
    content = result.output["content"]

    print(f"\n📝 LLM Response:\n{content}")

    # Verify response mentions Alice and Seattle
    assert "Alice" in content or "alice" in content.lower()
    assert "Seattle" in content or "seattle" in content.lower()

    # Verify metadata
    assert result.metadata["total_tokens"] > 0
    assert result.metadata["total_cost_usd"] > 0
    assert result.metadata["duration_ms"] > 0

    print("\n✅ Simple workflow integration test passed!")


# ============================================================================
# Multi-Step Workflow Test
# ============================================================================

@pytest.mark.asyncio
async def test_multi_step_workflow_with_context(engine, tmp_path):
    """Test multi-step workflow where steps reference previous outputs."""
    print("\n🚀 Starting multi-step workflow integration test...")

    # Create temporary workflow
    workflows_dir = tmp_path / "workflows"
    workflows_dir.mkdir()

    workflow_def = {
        "name": "test_multi_step",
        "version": "1.0.0",
        "steps": [
            {
                "id": "step1",
                "type": "llm",
                "config": {
                    "model": "anthropic/claude-3-haiku",
                    "prompt_text": "Say a single word: ${word}",
                    "max_tokens": 50,
                    "variables": {
                        "word": "${input.word}"
                    }
                }
            },
            {
                "id": "step2",
                "type": "llm",
                "config": {
                    "model": "anthropic/claude-3-haiku",
                    "prompt_text": "The previous step said: ${previous}. Now respond with exactly 'CONFIRMED'.",
                    "max_tokens": 50,
                    "variables": {
                        "previous": "${steps.step1.output.content}"
                    }
                }
            }
        ]
    }

    import json
    workflow_file = workflows_dir / "test_multi_step.json"
    with open(workflow_file, 'w') as f:
        json.dump(workflow_def, f)

    # Create engine with temp directory
    temp_engine = WorkflowEngine(
        workflows_dir=str(workflows_dir),
        prompts_dir=str(engine.prompts_dir),  # Use existing prompts
        llm_provider="openrouter"
    )

    # Load and execute
    workflow = temp_engine.load_workflow("test_multi_step")
    print(f"✅ Loaded multi-step workflow with {len(workflow.steps)} steps")

    result = await temp_engine.execute_workflow(
        workflow=workflow,
        input_data={"word": "Hello"}
    )

    # Verify result
    print(f"\n📊 Multi-Step Workflow Result:")
    print(f"   Success: {result.success}")
    print(f"   Steps executed: {len(result.steps_executed)}")
    print(f"   Total duration: {result.metadata['duration_ms']}ms")
    print(f"   Total tokens: {result.metadata['total_tokens']}")
    print(f"   Total cost: ${result.metadata['total_cost_usd']:.6f}")

    assert result.success is True
    assert len(result.steps_executed) == 2

    # Verify both steps succeeded
    assert result.steps_executed[0]["success"] is True
    assert result.steps_executed[1]["success"] is True

    # Verify step 1 output
    step1_output = result.steps_executed[0]["output"]
    print(f"\n📝 Step 1 Response:\n{step1_output['content']}")

    # Verify step 2 output references step 1
    step2_output = result.steps_executed[1]["output"]
    print(f"\n📝 Step 2 Response:\n{step2_output['content']}")

    assert "CONFIRMED" in step2_output["content"] or "confirmed" in step2_output["content"].lower()

    # Verify costs aggregated correctly
    total_cost = result.metadata["total_cost_usd"]
    step1_cost = result.steps_executed[0]["cost_usd"]
    step2_cost = result.steps_executed[1]["cost_usd"]
    assert abs(total_cost - (step1_cost + step2_cost)) < 0.000001  # Float precision

    print("\n✅ Multi-step workflow integration test passed!")


# ============================================================================
# Performance Benchmarks
# ============================================================================

@pytest.mark.asyncio
async def test_workflow_performance_metrics(engine):
    """Test workflow performance and cost tracking."""
    print("\n📊 Running performance benchmark...")

    workflow = engine.load_workflow("test_simple")

    # Run workflow 3 times and collect metrics
    durations = []
    costs = []
    tokens = []

    for i in range(3):
        print(f"\n🔄 Run {i+1}/3...")

        result = await engine.execute_workflow(
            workflow=workflow,
            input_data={"name": f"User{i+1}", "location": "Test City"}
        )

        assert result.success is True

        durations.append(result.metadata["duration_ms"])
        costs.append(result.metadata["total_cost_usd"])
        tokens.append(result.metadata["total_tokens"])

        print(f"   Duration: {result.metadata['duration_ms']}ms")
        print(f"   Tokens: {result.metadata['total_tokens']}")
        print(f"   Cost: ${result.metadata['total_cost_usd']:.6f}")

    # Calculate averages
    avg_duration = sum(durations) / len(durations)
    avg_cost = sum(costs) / len(costs)
    avg_tokens = sum(tokens) / len(tokens)

    print(f"\n📈 Performance Summary (3 runs):")
    print(f"   Average duration: {avg_duration:.0f}ms")
    print(f"   Average tokens: {avg_tokens:.0f}")
    print(f"   Average cost: ${avg_cost:.6f}")
    print(f"   Total cost: ${sum(costs):.6f}")

    # Verify reasonable performance
    assert avg_duration < 10000, f"Workflow too slow: {avg_duration}ms"
    assert avg_cost < 0.01, f"Workflow too expensive: ${avg_cost}"

    print("\n✅ Performance benchmark passed!")


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.asyncio
async def test_workflow_timeout_handling(engine, tmp_path):
    """Test workflow timeout behavior."""
    print("\n⏱️ Testing timeout handling...")

    # Create workflow with very short timeout
    workflows_dir = tmp_path / "workflows"
    workflows_dir.mkdir()

    workflow_def = {
        "name": "test_timeout",
        "version": "1.0.0",
        "steps": [
            {
                "id": "slow",
                "type": "llm",
                "config": {
                    "model": "anthropic/claude-3-haiku",
                    "prompt_text": "Write a very detailed explanation about ${topic}. Use at least 500 words.",
                    "max_tokens": 2000,
                    "variables": {"topic": "${input.topic}"}
                }
            }
        ],
        "timeout_seconds": 1  # Very short timeout
    }

    import json
    workflow_file = workflows_dir / "test_timeout.json"
    with open(workflow_file, 'w') as f:
        json.dump(workflow_def, f)

    temp_engine = WorkflowEngine(
        workflows_dir=str(workflows_dir),
        prompts_dir=str(engine.prompts_dir),
        llm_provider="openrouter"
    )

    workflow = temp_engine.load_workflow("test_timeout")

    # This might or might not timeout depending on API speed
    # We just verify it completes without crashing
    result = await temp_engine.execute_workflow(
        workflow=workflow,
        input_data={"topic": "artificial intelligence"}
    )

    print(f"   Result: {'Success' if result.success else 'Failed/Timeout'}")
    print(f"   Duration: {result.metadata.get('duration_ms', 'N/A')}ms")

    # Either succeeds or fails gracefully
    assert result is not None
    assert isinstance(result.success, bool)

    print("\n✅ Timeout handling test passed!")


if __name__ == "__main__":
    # Allow running directly for quick tests
    import asyncio

    async def main():
        """Run simple test manually."""
        engine = WorkflowEngine(
            workflows_dir="workflows/definitions",
            prompts_dir="workflows/prompts"
        )

        print("Running simple workflow test...")
        await test_simple_workflow_with_real_llm(engine)

    asyncio.run(main())
