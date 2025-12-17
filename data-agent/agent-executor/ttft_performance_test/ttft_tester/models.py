"""
Data models for TTFT Performance Testing Package

Defines all core data structures used throughout the package for configuration,
measurements, statistics, and reporting.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum


class TestStatus(Enum):
    """Test execution status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ReportFormat(Enum):
    """Report format enumeration."""
    JSON = "json"
    CSV = "csv"
    TXT = "txt"
    HTML = "html"


class ChartType(Enum):
    """Chart type enumeration."""
    TIME_SERIES = "time_series"
    DISTRIBUTION = "distribution"
    SCATTER = "scatter"
    BOX_PLOT = "box_plot"


@dataclass
class ApiConfiguration:
    """API endpoint and request configuration."""
    base_url: str
    endpoint: str = "/api/agent-executor/v2/agent/run"
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    payload_template: Optional[str] = None
    payload_overrides: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.base_url.startswith(('http://', 'https://')):
            raise ValueError(f"Invalid base URL: {self.base_url}")
        if not (1 <= self.timeout <= 300):
            raise ValueError(f"Timeout must be between 1 and 300 seconds: {self.timeout}")


@dataclass
class TestParameters:
    """Parameters controlling test execution."""
    concurrency: int = 1
    iterations: int = 1
    delay_between_requests: float = 0.0
    delay_between_batches: float = 2.0
    queries: List[str] = field(default_factory=list)
    query_file: Optional[str] = None
    max_failures: int = 0

    def __post_init__(self):
        """Validate parameters after initialization."""
        if not (1 <= self.concurrency <= 1000):
            raise ValueError(f"Concurrency must be between 1 and 1000: {self.concurrency}")
        if self.iterations < 1:
            raise ValueError(f"Iterations must be >= 1: {self.iterations}")
        if self.delay_between_requests < 0:
            raise ValueError(f"Delay between requests must be >= 0: {self.delay_between_requests}")
        if not self.queries and not self.query_file:
            raise ValueError("Either queries or query_file must be provided")


@dataclass
class ReportConfiguration:
    """Report generation settings."""
    output_dir: str = "./results"
    formats: List[ReportFormat] = field(default_factory=lambda: [ReportFormat.JSON, ReportFormat.TXT])
    include_charts: bool = True
    chart_types: List[ChartType] = field(default_factory=lambda: [ChartType.TIME_SERIES])
    timestamp_format: str = "%Y%m%d_%H%M%S"
    log_level: str = "INFO"

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.formats:
            raise ValueError("At least one format must be specified")
        if not self.chart_types:
            raise ValueError("At least one chart type must be specified")


@dataclass
class TestConfiguration:
    """Configuration for a complete performance test session."""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    api_config: ApiConfiguration = field(default_factory=ApiConfiguration)
    test_config: TestParameters = field(default_factory=TestParameters)
    report_config: ReportConfiguration = field(default_factory=ReportConfiguration)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.session_id:
            raise ValueError("Session ID cannot be empty")


@dataclass
class TTFTMeasurement:
    """Single TTFT measurement result."""
    test_id: int
    session_id: str
    query: str
    ttft_ms: Optional[float] = None
    total_time_ms: float = 0.0
    http_response_time_ms: float = 0.0
    time_to_first_byte_ms: Optional[float] = None
    tokens_count: int = 0
    status: str = "success"
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    debug_info: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Validate measurement after initialization."""
        if self.test_id < 0:
            raise ValueError(f"Test ID must be >= 0: {self.test_id}")
        if self.ttft_ms is not None and self.ttft_ms < 0:
            raise ValueError(f"TTFT must be >= 0: {self.ttft_ms}")
        if self.total_time_ms < 0:
            raise ValueError(f"Total time must be >= 0: {self.total_time_ms}")
        if self.tokens_count < 0:
            raise ValueError(f"Tokens count must be >= 0: {self.tokens_count}")
        if self.status not in ["success", "error"]:
            raise ValueError(f"Status must be 'success' or 'error': {self.status}")


@dataclass
class TimingStatistics:
    """Statistical analysis for timing data."""
    mean_ms: float
    median_ms: float
    min_ms: float
    max_ms: float
    std_dev_ms: float
    percentile_95_ms: float
    percentile_99_ms: float
    data_points: int

    def __post_init__(self):
        """Validate statistics after initialization."""
        if any(val < 0 for val in [self.mean_ms, self.median_ms, self.min_ms, self.max_ms, self.std_dev_ms]):
            raise ValueError("Timing values must be >= 0")
        if self.percentile_95_ms > self.percentile_99_ms:
            raise ValueError("95th percentile must be <= 99th percentile")
        if self.percentile_99_ms > self.max_ms:
            raise ValueError("99th percentile must be <= max value")
        if self.data_points < 1:
            raise ValueError("Data points must be >= 1")


@dataclass
class TokenStatistics:
    """Statistical analysis for token counts."""
    mean: float
    median: float
    min: int
    max: int
    total: int
    data_points: int

    def __post_init__(self):
        """Validate statistics after initialization."""
        if self.mean < 0 or self.median < 0:
            raise ValueError("Mean and median must be >= 0")
        if self.min < 0 or self.max < 0:
            raise ValueError("Min and max must be >= 0")
        if self.total < 0:
            raise ValueError("Total must be >= 0")
        if self.data_points < 1:
            raise ValueError("Data points must be >= 1")


@dataclass
class ThroughputStatistics:
    """Performance throughput metrics."""
    tokens_per_second: float
    requests_per_second: float
    total_time_seconds: float
    successful_requests: int
    total_tokens: int

    def __post_init__(self):
        """Validate statistics after initialization."""
        if any(val < 0 for val in [self.tokens_per_second, self.requests_per_second, self.total_time_seconds]):
            raise ValueError("Throughput metrics must be >= 0")
        if self.successful_requests < 0:
            raise ValueError("Successful requests must be >= 0")
        if self.total_tokens < 0:
            raise ValueError("Total tokens must be >= 0")


@dataclass
class TestStatistics:
    """Statistical analysis of test results."""
    total_requests: int
    successful_requests: int
    failed_requests: int
    success_rate: float
    ttft_stats: Optional[TimingStatistics] = None
    total_time_stats: Optional[TimingStatistics] = None
    token_stats: Optional[TokenStatistics] = None
    throughput_stats: Optional[ThroughputStatistics] = None

    def __post_init__(self):
        """Validate statistics after initialization."""
        if self.total_requests != self.successful_requests + self.failed_requests:
            raise ValueError("Total requests must equal successful + failed requests")
        if not (0 <= self.success_rate <= 100):
            raise ValueError("Success rate must be between 0 and 100")


@dataclass
class ChartData:
    """Data for chart generation."""
    chart_type: ChartType
    title: str
    x_label: str
    y_label: str
    data_points: List[Dict[str, float]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Validate chart data after initialization."""
        if not self.data_points:
            raise ValueError("Data points cannot be empty")
        if not self.title.strip() or not self.x_label.strip() or not self.y_label.strip():
            raise ValueError("Title and labels cannot be empty")


@dataclass
class TestSession:
    """Complete test session with aggregated results."""
    session_id: str
    configuration: TestConfiguration
    measurements: List[TTFTMeasurement] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    statistics: Optional[TestStatistics] = None
    status: TestStatus = TestStatus.PENDING

    def __post_init__(self):
        """Validate session after initialization."""
        if not self.session_id:
            raise ValueError("Session ID cannot be empty")
        if self.completed_at and self.completed_at < self.started_at:
            raise ValueError("Completed time must be after started time")

    def add_measurement(self, measurement: TTFTMeasurement) -> None:
        """Add a measurement to the session."""
        self.measurements.append(measurement)
        self.updated_at = datetime.now()

    def set_status(self, status: TestStatus) -> None:
        """Set the session status."""
        self.status = status
        self.updated_at = datetime.now()

        if status == TestStatus.COMPLETED:
            self.completed_at = datetime.now()

    def get_successful_measurements(self) -> List[TTFTMeasurement]:
        """Get all successful measurements."""
        return [m for m in self.measurements if m.status == "success"]

    def get_failed_measurements(self) -> List[TTFTMeasurement]:
        """Get all failed measurements."""
        return [m for m in self.measurements if m.status == "error"]

    def is_complete(self) -> bool:
        """Check if session is complete."""
        return self.status in [TestStatus.COMPLETED, TestStatus.FAILED, TestStatus.CANCELLED]