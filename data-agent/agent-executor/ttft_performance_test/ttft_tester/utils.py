"""
Utility functions for TTFT Performance Testing Package

Provides statistical calculations, data processing, and helper functions
for performance testing and reporting.
"""

import asyncio
import time
import json
import csv
import logging
import sys
from typing import List, Dict, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
from pathlib import Path
import statistics
import math
import re
from dataclasses import asdict

from .models import (
    TTFTMeasurement, TestSession, TestStatistics,
    TimingStatistics, TokenStatistics, ThroughputStatistics,
    TestStatus
)

logger = logging.getLogger(__name__)


def setup_logging(level: str, log_file: Optional[str] = None) -> None:
    """Set up logging configuration.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_file: Optional log file path
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Configure logging format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Get root logger and configure
    logger = logging.getLogger('ttft_tester')
    logger.setLevel(log_level)
    logger.addHandler(console_handler)

    # Add file handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)


class StatsError(Exception):
    """Statistics calculation errors."""
    pass


class FileError(Exception):
    """File operation errors."""
    pass


def calculate_timing_statistics(
    timing_data: List[float],
    valid_only: bool = True
) -> TimingStatistics:
    """Calculate timing statistics from a list of measurements.

    Args:
        timing_data: List of timing measurements in milliseconds
        valid_only: Whether to include only valid (>0) measurements

    Returns:
        TimingStatistics object with calculated statistics
    """
    # Filter valid measurements
    if valid_only:
        data = [t for t in timing_data if t is not None and t > 0]
    else:
        data = [t for t in timing_data if t is not None]

    if not data:
        raise StatsError("No valid timing data available")

    # Calculate basic statistics
    mean_ms = statistics.mean(data)
    median_ms = statistics.median(data)
    min_ms = min(data)
    max_ms = max(data)

    # Calculate standard deviation
    if len(data) > 1:
        std_dev_ms = statistics.stdev(data)
    else:
        std_dev_ms = 0.0

    # Calculate percentiles
    sorted_data = sorted(data)
    n = len(sorted_data)

    # 95th percentile
    index_95 = int(n * 0.95) - 1
    percentile_95_ms = sorted_data[max(0, index_95)]

    # 99th percentile
    index_99 = int(n * 0.99) - 1
    percentile_99_ms = sorted_data[max(0, index_99)]

    return TimingStatistics(
        mean_ms=mean_ms,
        median_ms=median_ms,
        min_ms=min_ms,
        max_ms=max_ms,
        std_dev_ms=std_dev_ms,
        percentile_95_ms=percentile_95_ms,
        percentile_99_ms=percentile_99_ms,
        data_points=len(data)
    )


def calculate_token_statistics(
    token_counts: List[int],
    valid_only: bool = True
) -> TokenStatistics:
    """Calculate token statistics from a list of token counts.

    Args:
        token_counts: List of token counts
        valid_only: Whether to include only valid (>=0) counts

    Returns:
        TokenStatistics object with calculated statistics
    """
    # Filter valid counts
    if valid_only:
        data = [t for t in token_counts if t is not None and t >= 0]
    else:
        data = [t for t in token_counts if t is not None]

    if not data:
        raise StatsError("No valid token data available")

    # Calculate basic statistics
    mean = statistics.mean(data)
    median = statistics.median(data)
    min_count = min(data)
    max_count = max(data)
    total = sum(data)

    return TokenStatistics(
        mean=mean,
        median=median,
        min=min_count,
        max=max_count,
        total=total,
        data_points=len(data)
    )


def calculate_throughput_statistics(
    measurements: List[TTFTMeasurement],
    test_duration_seconds: float
) -> ThroughputStatistics:
    """Calculate throughput statistics from measurements.

    Args:
        measurements: List of TTFT measurements
        test_duration_seconds: Total test duration in seconds

    Returns:
        ThroughputStatistics object with calculated throughput metrics
    """
    successful_measurements = [m for m in measurements if m.status == "success"]

    if not successful_measurements or test_duration_seconds <= 0:
        return ThroughputStatistics(
            tokens_per_second=0.0,
            requests_per_second=0.0,
            total_time_seconds=test_duration_seconds,
            successful_requests=len(successful_measurements),
            total_tokens=0
        )

    successful_requests = len(successful_measurements)
    total_tokens = sum(m.tokens_count for m in successful_measurements)
    requests_per_second = successful_requests / test_duration_seconds
    tokens_per_second = total_tokens / test_duration_seconds

    return ThroughputStatistics(
        tokens_per_second=tokens_per_second,
        requests_per_second=requests_per_second,
        total_time_seconds=test_duration_seconds,
        successful_requests=successful_requests,
        total_tokens=total_tokens
    )


def calculate_test_statistics(session: TestSession) -> TestStatistics:
    """Calculate comprehensive test statistics from session measurements.

    Args:
        session: TestSession with measurements

    Returns:
        TestStatistics object with all calculated statistics
    """
    measurements = session.measurements

    # Count total, successful, and failed requests
    total_requests = len(measurements)
    successful_requests = len([m for m in measurements if m.status == "success"])
    failed_requests = len([m for m in measurements if m.status == "error"])

    # Calculate success rate
    success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0.0

    # Calculate TTFT statistics
    ttft_data = [m.ttft_ms for m in measurements if m.ttft_ms is not None]
    ttft_stats = None
    if ttft_data:
        try:
            ttft_stats = calculate_timing_statistics(ttft_data)
        except StatsError:
            logger.warning("No valid TTFT data for statistics calculation")

    # Calculate total time statistics
    total_time_data = [m.total_time_ms for m in measurements]
    total_time_stats = None
    if total_time_data:
        try:
            total_time_stats = calculate_timing_statistics(total_time_data, valid_only=False)
        except StatsError:
            logger.warning("No valid total time data for statistics calculation")

    # Calculate token statistics
    token_data = [m.tokens_count for m in measurements]
    token_stats = None
    if token_data:
        try:
            token_stats = calculate_token_statistics(token_data)
        except StatsError:
            logger.warning("No valid token data for statistics calculation")

    # Calculate test duration
    test_duration = (session.completed_at - session.started_at).total_seconds() if session.completed_at else 0.0

    # Calculate throughput statistics
    throughput_stats = None
    if test_duration > 0:
        throughput_stats = calculate_throughput_statistics(measurements, test_duration)

    return TestStatistics(
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=failed_requests,
        success_rate=success_rate,
        ttft_stats=ttft_stats,
        total_time_stats=total_time_stats,
        token_stats=token_stats,
        throughput_stats=throughput_stats
    )


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human-readable format."""
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}min"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def format_number(number: float, precision: int = 2) -> str:
    """Format number with appropriate precision and suffix."""
    if number >= 1_000_000:
        return f"{number / 1_000_000:.{precision}f}M"
    elif number >= 1_000:
        return f"{number / 1_000:.{precision}f}K"
    elif number >= 1:
        return f"{number:.{precision}f}"
    else:
        return f"{number:.{precision + 2}f}"


def calculate_percentile(data: List[float], percentile: float) -> float:
    """Calculate a specific percentile from sorted data.

    Args:
        data: List of numerical values
        percentile: Percentile to calculate (0-100)

    Returns:
        Calculated percentile value
    """
    if not data:
        raise ValueError("Data list cannot be empty")

    if percentile < 0 or percentile > 100:
        raise ValueError("Percentile must be between 0 and 100")

    sorted_data = sorted(data)
    n = len(sorted_data)
    index = n * percentile / 100

    if index <= 0:
        return sorted_data[0]
    elif index >= n - 1:
        return sorted_data[-1]
    else:
        lower_index = int(index)
        upper_index = lower_index + 1
        weight = index - lower_index
        return sorted_data[lower_index] * (1 - weight) + sorted_data[upper_index] * weight


def detect_anomalies(data: List[float], threshold: float = 2.0) -> List[int]:
    """Detect anomalies in data using standard deviation method.

    Args:
        data: List of numerical values
        threshold: Number of standard deviations from mean

    Returns:
        List of indices of detected anomalies
    """
    if len(data) < 3:
        return []

    mean = statistics.mean(data)
    if len(data) > 1:
        std_dev = statistics.stdev(data)
    else:
        std_dev = 0

    anomalies = []
    for i, value in enumerate(data):
        if std_dev == 0:
            if value != mean:
                anomalies.append(i)
        else:
            z_score = abs(value - mean) / std_dev
            if z_score > threshold:
                anomalies.append(i)

    return anomalies


def create_histogram(data: List[float], bins: int = 10) -> Dict[str, float]:
    """Create histogram data from numerical data.

    Args:
        data: List of numerical values
        bins: Number of histogram bins

    Returns:
        Dictionary with histogram data
    """
    if not data:
        return {}

    min_val = min(data)
    max_val = max(data)
    bin_width = (max_val - min_val) / bins

    histogram = {}
    for i in range(bins):
        bin_start = min_val + i * bin_width
        bin_end = min_val + (i + 1) * bin_width
        bin_label = f"{bin_start:.2f}-{bin_end:.2f}"
        histogram[bin_label] = 0

    # Count values in each bin
    for value in data:
        bin_index = min(int((value - min_val) / bin_width), bins - 1)
        bin_label = list(histogram.keys())[bin_index]
        histogram[bin_label] += 1

    return histogram


def get_time_series_data(measurements: List[TTFTMeasurement]) -> List[Dict[str, Any]]:
    """Extract time series data from measurements."""
    time_series = []

    for i, measurement in enumerate(measurements):
        data_point = {
            'test_id': measurement.test_id,
            'timestamp': measurement.timestamp,
            'ttft_ms': measurement.ttft_ms,
            'total_time_ms': measurement.total_time_ms,
            'tokens_count': measurement.tokens_count,
            'status': measurement.status
        }
        time_series.append(data_point)

    return time_series


def save_results_json(
    session: TestSession,
    output_file: str,
    include_raw_data: bool = True
) -> None:
    """Save test results to JSON file.

    Args:
        session: TestSession with results
        output_file: Output file path
        include_raw_data: Whether to include raw measurement data
    """
    try:
        # Prepare output data
        output_data = {
            'session_id': session.session_id,
            'configuration': asdict(session.configuration),
            'started_at': session.started_at.isoformat() if session.started_at else None,
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'status': session.status.value if hasattr(session.status, 'value') else str(session.status),
            'statistics': asdict(session.statistics) if session.statistics else None
        }

        if include_raw_data:
            output_data['measurements'] = [asdict(m) for m in session.measurements]

        # Create output directory if needed
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Debug: Check each component before serialization
        try:
            # Test session data serialization
            session_data = {
                'session_id': session.session_id,
                'started_at': session.started_at.isoformat() if session.started_at else None,
                'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                'status': session.status.value if hasattr(session.status, 'value') else str(session.status)
            }
            json.dumps(session_data, default=str)

            # Test configuration serialization
            config_data = asdict(session.configuration)
            json.dumps(config_data, default=str)

            # Test statistics serialization
            if session.statistics:
                stats_data = asdict(session.statistics)
                json.dumps(stats_data, default=str)

            # Test measurements serialization
            if include_raw_data and session.measurements:
                for i, m in enumerate(session.measurements):
                    try:
                        m_data = asdict(m)
                        json.dumps(m_data, default=str)
                    except Exception as me:
                        print(f"Failed to serialize measurement {i}: {me}")
                        raise

        except Exception as debug_e:
            print(f"Debug error: {debug_e}")
            raise

        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Results saved to: {output_file}")

    except Exception as e:
        import traceback
        print(f"JSON serialization error details:")
        traceback.print_exc()
        raise FileError(f"Error saving JSON results: {e}")


def save_results_csv(
    measurements: List[TTFTMeasurement],
    output_file: str
) -> None:
    """Save measurement results to CSV file.

    Args:
        measurements: List of TTFT measurements
        output_file: Output file path
    """
    try:
        # Create output directory if needed
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write CSV
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'test_id', 'session_id', 'query', 'ttft_ms', 'total_time_ms',
                'http_response_time_ms', 'time_to_first_byte_ms', 'tokens_count',
                'status', 'error_message', 'timestamp'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            for measurement in measurements:
                row = {
                    'test_id': measurement.test_id,
                    'session_id': measurement.session_id,
                    'query': measurement.query[:100],  # Truncate long queries
                    'ttft_ms': measurement.ttft_ms,
                    'total_time_ms': measurement.total_time_ms,
                    'http_response_time_ms': measurement.http_response_time_ms,
                    'time_to_first_byte_ms': measurement.time_to_first_byte_ms,
                    'tokens_count': measurement.tokens_count,
                    'status': measurement.status,
                    'error_message': measurement.error_message,
                    'timestamp': measurement.timestamp.isoformat()
                }
                writer.writerow(row)

        logger.info(f"CSV results saved to: {output_file}")

    except Exception as e:
        raise FileError(f"Error saving CSV results: {e}")


def load_results_json(input_file: str) -> Dict[str, Any]:
    """Load test results from JSON file.

    Args:
        input_file: Input JSON file path

    Returns:
        Dictionary with loaded test results
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        logger.info(f"Results loaded from: {input_file}")
        return data

    except Exception as e:
        raise FileError(f"Error loading JSON results: {e}")


def get_output_filename(
    prefix: str,
    extension: str,
    timestamp_format: str = "%Y%m%d_%H%M%S",
    output_dir: str = "./results"
) -> str:
    """Generate output filename with timestamp.

    Args:
        prefix: File name prefix
        extension: File extension (without dot)
        timestamp_format: Timestamp format
        output_dir: Output directory

    Returns:
        Generated file path
    """
    timestamp = datetime.now().strftime(timestamp_format)
    filename = f"{prefix}_{timestamp}.{extension}"
    return str(Path(output_dir) / filename)


def validate_output_directory(output_dir: str, create: bool = True) -> Path:
    """Validate and optionally create output directory.

    Args:
        output_dir: Output directory path
        create: Whether to create directory if it doesn't exist

    Returns:
        Path object for validated directory
    """
    path = Path(output_dir)

    if not path.exists():
        if create:
            path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created output directory: {output_dir}")
        else:
            raise FileError(f"Output directory does not exist: {output_dir}")

    if not path.is_dir():
        raise FileError(f"Output path is not a directory: {output_dir}")

    # Test write permissions
    test_file = path / '.permission_test'
    try:
        test_file.touch()
        test_file.unlink()
    except Exception as e:
        raise FileError(f"Output directory not writable: {output_dir} ({e})")

    return path


async def safe_async_call(func, *args, **kwargs) -> Any:
    """Safely execute async function with error handling.

    Args:
        func: Async function to execute
        *args, **kwargs: Function arguments

    Returns:
        Function result or None if error occurs
    """
    try:
        return await func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Error in async call: {e}")
        return None


def chunk_list(lst: List, chunk_size: int) -> List[List]:
    """Split list into chunks of specified size.

    Args:
        lst: List to chunk
        chunk_size: Size of each chunk

    Returns:
        List of chunks
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def retry_async(
    func,
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0
):
    """Retry async function with exponential backoff.

    Args:
        func: Async function to retry
        max_attempts: Maximum number of attempts
        delay: Initial delay between attempts
        backoff_factor: Backoff factor for exponential delay

    Returns:
        Function result or raises last exception
    """
    async def wrapper(*args, **kwargs):
        last_exception = None

        for attempt in range(max_attempts):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < max_attempts - 1:
                    wait_time = delay * (backoff_factor ** attempt)
                    logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"All {max_attempts} attempts failed: {e}")

        raise last_exception

    return wrapper