#!/usr/bin/env python3
"""Debug script for testing TTFT package functionality."""

import sys
import os
sys.path.insert(0, '/root/project/agent-executor/ttft_performance_test')

# Add system path for PyYAML
sys.path.insert(0, '/usr/lib/python3/dist-packages')

def test_config_loading():
    """Test configuration loading."""
    print("Testing configuration loading...")
    try:
        from ttft_tester.config import ConfigurationManager
        config_manager = ConfigurationManager("examples/config_secenario1.yaml")
        config = config_manager.load_config()
        print("✓ Configuration loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Configuration loading failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_core_functionality():
    """Test core TTFT functionality."""
    print("\nTesting core functionality...")
    try:
        from ttft_tester.core import TTFTTester
        from ttft_tester.config import ConfigurationManager

        config_manager = ConfigurationManager("examples/config_secenario1.yaml")
        config = config_manager.load_config()

        tester = TTFTTester(config)
        print("✓ TTFTTester created successfully")
        return True
    except Exception as e:
        print(f"✗ Core functionality failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_async_execution():
    """Test async execution."""
    print("\nTesting async execution...")
    try:
        import asyncio
        from ttft_tester.core import TTFTTester
        from ttft_tester.config import ConfigurationManager

        config_manager = ConfigurationManager("examples/config_secenario1.yaml")
        config = config_manager.load_config()

        tester = TTFTTester(config)

        async def test_simple():
            try:
                measurement = await tester.measure_single_ttft("简单测试", 1)
                print(f"✓ Single measurement successful: {measurement}")
                return measurement
            except Exception as e:
                print(f"✗ Single measurement failed: {e}")
                raise

        # Run the async test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        measurement = loop.run_until_complete(test_simple())
        loop.close()

        return True
    except Exception as e:
        print(f"✗ Async execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    print("TTFT Package Debug Testing")
    print("=" * 50)

    success = True

    # Test 1: Configuration loading
    if not test_config_loading():
        success = False

    # Test 2: Core functionality
    if not test_core_functionality():
        success = False

    # Test 3: Async execution
    if not test_async_execution():
        success = False

    print("\n" + "=" * 50)
    if success:
        print("All tests passed! ✓")
    else:
        print("Some tests failed. ✗")

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())