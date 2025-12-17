#!/usr/bin/env python3
"""Debug JSON serialization issues."""

import sys
import json
from datetime import datetime
from dataclasses import asdict

sys.path.insert(0, '/root/project/agent-executor/ttft_performance_test')
sys.path.insert(0, '/usr/lib/python3/dist-packages')

def test_serialization():
    """Test JSON serialization of various objects."""
    print("Testing JSON serialization...")

    # Test basic datetime
    dt = datetime.now()
    try:
        json.dumps(dt, default=str)
        print("✓ datetime serialization works")
    except Exception as e:
        print(f"✗ datetime serialization failed: {e}")

    # Test dataclass serialization
    from ttft_tester.models import TTFTMeasurement, TestSession, TestConfiguration

    # Create a simple measurement
    measurement = TTFTMeasurement(
        test_id=1,
        session_id="test-session",
        query="test query",
        ttft_ms=100.0,
        total_time_ms=200.0,
        tokens_count=10,
        status="success"
    )

    try:
        measurement_dict = asdict(measurement)
        json_str = json.dumps(measurement_dict, default=str)
        print("✓ measurement serialization works")
    except Exception as e:
        print(f"✗ measurement serialization failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_serialization()