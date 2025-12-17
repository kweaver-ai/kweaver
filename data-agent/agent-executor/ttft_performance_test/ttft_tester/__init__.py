"""
TTFT Performance Testing Package

A standalone Python package for testing Time to First Token (TTFT) performance
of conversation APIs with support for concurrent testing, flexible configuration,
and comprehensive reporting.

Author: Claude AI
Version: 1.0.0
License: MIT
"""

__version__ = "1.0.0"
__author__ = "Claude AI"
__email__ = "noreply@anthropic.com"
__description__ = "TTFT Performance Testing Package for Conversation APIs"

from .models import (
    TestConfiguration,
    ApiConfiguration,
    TestParameters,
    ReportConfiguration,
    TTFTMeasurement,
    TestSession,
    TestStatistics,
    TimingStatistics,
    TokenStatistics,
    ThroughputStatistics
)

__all__ = [
    "TestConfiguration",
    "ApiConfiguration",
    "TestParameters",
    "ReportConfiguration",
    "TTFTMeasurement",
    "TestSession",
    "TestStatistics",
    "TimingStatistics",
    "TokenStatistics",
    "ThroughputStatistics"
]