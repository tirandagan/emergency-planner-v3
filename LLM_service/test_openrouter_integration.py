#!/usr/bin/env python3
"""
OpenRouter Integration Test

Tests real OpenRouter API calls with Claude Sonnet 3.5.
Verifies token tracking, cost calculation, and error handling.

Usage:
    cd LLM_service
    python test_openrouter_integration.py
"""

import asyncio
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services import get_llm_provider
from app.services.llm_provider import (
    Message,
    LLMProviderError,
    LLMProviderTimeout,
    LLMProviderAuthError,
)


async def test_basic_generation():
    """Test basic text generation with Claude Sonnet 3.5."""
    print("\n" + "=" * 60)
    print("TEST 1: Basic Text Generation")
    print("=" * 60)

    provider = get_llm_provider("openrouter")

    try:
        # Create test messages
        messages = [
            Message(role="system", content="You are a helpful assistant."),
            Message(role="user", content="Say 'Hello, world!' and nothing else.")
        ]

        print("\n📤 Sending request to OpenRouter...")
        print(f"   Model: anthropic/claude-3.5-sonnet")
        print(f"   Messages: {len(messages)}")

        # Generate response
        response = await provider.generate(
            messages=messages,
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
            max_tokens=100
        )

        # Verify response
        print("\n✅ Response received!")
        print(f"\n📝 Content:")
        print(f"   {response.content}")
        print(f"\n📊 Token Usage:")
        print(f"   Input tokens:  {response.usage.input_tokens}")
        print(f"   Output tokens: {response.usage.output_tokens}")
        print(f"   Total tokens:  {response.usage.total_tokens}")
        print(f"\n💰 Cost:")
        print(f"   ${response.cost_usd:.6f} USD")
        print(f"\n⏱️  Performance:")
        print(f"   Duration: {response.duration_ms}ms")
        print(f"   Provider: {response.provider}")

        # Verify cost calculation
        expected_cost = (
            response.usage.input_tokens * 3.0 / 1_000_000 +
            response.usage.output_tokens * 15.0 / 1_000_000
        )

        print(f"\n🧮 Cost Verification:")
        print(f"   Expected: ${expected_cost:.6f}")
        print(f"   Actual:   ${response.cost_usd:.6f}")
        print(f"   Match: {abs(response.cost_usd - expected_cost) < 1e-6}")

        assert abs(response.cost_usd - expected_cost) < 1e-6, "Cost mismatch!"

        print("\n✅ Test 1 PASSED")
        return True

    except Exception as e:
        print(f"\n❌ Test 1 FAILED: {e}")
        raise

    finally:
        await provider.close()


async def test_longer_generation():
    """Test longer text generation with token tracking."""
    print("\n" + "=" * 60)
    print("TEST 2: Longer Text Generation")
    print("=" * 60)

    provider = get_llm_provider("openrouter")

    try:
        messages = [
            Message(
                role="system",
                content="You are a helpful assistant that explains concepts clearly."
            ),
            Message(
                role="user",
                content="Explain what emergency preparedness means in 2-3 sentences."
            )
        ]

        print("\n📤 Sending longer request...")

        response = await provider.generate(
            messages=messages,
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
            max_tokens=500
        )

        print("\n✅ Response received!")
        print(f"\n📝 Content (first 200 chars):")
        print(f"   {response.content[:200]}...")
        print(f"\n📊 Token Usage:")
        print(f"   Input tokens:  {response.usage.input_tokens}")
        print(f"   Output tokens: {response.usage.output_tokens}")
        print(f"   Total tokens:  {response.usage.total_tokens}")
        print(f"   Cost: ${response.cost_usd:.6f}")

        # Verify response is reasonable
        assert len(response.content) > 50, "Response too short"
        assert response.usage.total_tokens > 0, "No tokens used"
        assert response.cost_usd > 0, "No cost calculated"

        print("\n✅ Test 2 PASSED")
        return True

    except Exception as e:
        print(f"\n❌ Test 2 FAILED: {e}")
        raise

    finally:
        await provider.close()


async def test_different_models():
    """Test with different Claude models."""
    print("\n" + "=" * 60)
    print("TEST 3: Different Models")
    print("=" * 60)

    models_to_test = [
        ("anthropic/claude-3.5-sonnet", "Sonnet 3.5"),
        ("anthropic/claude-3-haiku", "Haiku"),
    ]

    for model_id, model_name in models_to_test:
        print(f"\n🧪 Testing {model_name}...")

        provider = get_llm_provider("openrouter")

        try:
            messages = [
                Message(role="user", content="Say 'Hello!' in one word.")
            ]

            response = await provider.generate(
                messages=messages,
                model=model_id,
                temperature=0.7,
                max_tokens=50
            )

            print(f"   ✅ {model_name}: {response.usage.total_tokens} tokens, ${response.cost_usd:.6f}")

        except Exception as e:
            print(f"   ⚠️ {model_name}: {e}")

        finally:
            await provider.close()

    print("\n✅ Test 3 PASSED")
    return True


async def test_error_handling():
    """Test error handling with invalid inputs."""
    print("\n" + "=" * 60)
    print("TEST 4: Error Handling")
    print("=" * 60)

    # Test with invalid API key
    print("\n🧪 Testing invalid API key...")
    from app.services.openrouter import OpenRouterProvider

    provider = OpenRouterProvider(
        api_key="invalid-key-12345",
        base_url="https://openrouter.ai/api/v1"
    )

    try:
        messages = [Message(role="user", content="Hello")]
        await provider.generate(
            messages=messages,
            model="anthropic/claude-3.5-sonnet"
        )
        print("   ❌ Should have raised authentication error!")
        return False

    except LLMProviderAuthError as e:
        print(f"   ✅ Correctly raised authentication error: {e}")

    except Exception as e:
        print(f"   ⚠️ Unexpected error type: {type(e).__name__}: {e}")

    finally:
        await provider.close()

    print("\n✅ Test 4 PASSED")
    return True


async def run_all_tests():
    """Run all integration tests."""
    print("\n" + "=" * 60)
    print("🚀 OpenRouter Integration Tests")
    print("=" * 60)

    tests = [
        ("Basic Generation", test_basic_generation),
        ("Longer Generation", test_longer_generation),
        ("Different Models", test_different_models),
        ("Error Handling", test_error_handling),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, True))
        except Exception as e:
            print(f"\n❌ {test_name} failed: {e}")
            results.append((test_name, False))

    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️ Some tests failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
