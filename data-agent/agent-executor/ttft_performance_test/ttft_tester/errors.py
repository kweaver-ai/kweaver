"""
Error Handling Framework for TTFT Performance Testing Package

Provides comprehensive error handling with user-friendly messages,
error categorization, and graceful degradation strategies.
"""

import asyncio
import sys
import traceback
from enum import Enum
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass, field
import logging
import time

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ErrorCategory(Enum):
    """Error categories."""
    CONFIGURATION = "configuration"
    NETWORK = "network"
    API = "api"
    FILE = "file"
    VALIDATION = "validation"
    TIMEOUT = "timeout"
    CONCURRENCY = "concurrency"
    STATISTICS = "statistics"
    REPORTING = "reporting"
    UNKNOWN = "unknown"


@dataclass
class ErrorContext:
    """Context information for errors."""
    error_type: str
    category: ErrorCategory
    severity: ErrorSeverity
    message: str
    details: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    traceback: Optional[str] = None
    retry_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert error context to dictionary."""
        return {
            'error_type': self.error_type,
            'category': self.category.value,
            'severity': self.severity.value,
            'message': self.message,
            'details': self.details,
            'suggestion': self.suggestion,
            'timestamp': self.timestamp,
            'retry_count': self.retry_count,
            'traceback': self.traceback
        }


class TTFTError(Exception):
    """Base class for all TTFT Performance Testing errors."""

    def __init__(
        self,
        message: str,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        suggestion: Optional[str] = None,
        details: Optional[str] = None,
        retry_count: int = 0
    ):
        super().__init__(message)
        self.message = message
        self.category = category
        self.severity = severity
        self.suggestion = suggestion
        self.details = details
        self.retry_count = retry_count
        self.timestamp = time.time()

    def to_context(self) -> ErrorContext:
        """Convert exception to error context."""
        return ErrorContext(
            error_type=self.__class__.__name__,
            category=self.category,
            severity=self.severity,
            message=self.message,
            details=self.details,
            suggestion=self.suggestion,
            timestamp=self.timestamp,
            retry_count=self.retry_count,
            traceback=traceback.format_exc()
        )


class ConfigurationError(TTFTError):
    """Configuration-related errors."""

    def __init__(self, message: str, details: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.CONFIGURATION,
            severity=ErrorSeverity.ERROR,
            suggestion="Check your configuration file and command-line arguments",
            details=details
        )


class NetworkError(TTFTError):
    """Network-related errors."""

    def __init__(self, message: str, url: Optional[str] = None, details: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.NETWORK,
            severity=ErrorSeverity.ERROR,
            suggestion="Check your network connection and API endpoint availability",
            details=details
        )
        self.url = url


class APIError(TTFTError):
    """API-related errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.API,
            severity=ErrorSeverity.ERROR,
            suggestion=f"Check API documentation and request format (Status: {status_code})",
            details=details
        )
        self.status_code = status_code


class FileNotFoundError(TTFTError):
    """File-related errors."""

    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.FILE,
            severity=ErrorSeverity.ERROR,
            suggestion="Check file permissions and path",
            details=f"File: {file_path}" if file_path else None
        )
        self.file_path = file_path


class ValidationError(TTFTError):
    """Validation-related errors."""

    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.ERROR,
            suggestion=f"Check {field} parameter" if field else "Check input parameters",
            details=f"Field: {field}" if field else None
        )
        self.field = field


class TimeoutError(TTFTError):
    """Timeout-related errors."""

    def __init__(self, message: str, timeout_value: Optional[float] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.TIMEOUT,
            severity=ErrorSeverity.WARNING,
            suggestion="Consider increasing timeout value or checking API performance",
            details=f"Timeout value: {timeout_value}" if timeout_value else None
        )
        self.timeout_value = timeout_value


class ConcurrencyError(TTFTError):
    """Concurrency-related errors."""

    def __init__(self, message: str, concurrency_level: Optional[int] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.CONCURRENCY,
            severity=ErrorSeverity.ERROR,
            suggestion="Reduce concurrency level or increase system resources",
            details=f"Concurrency level: {concurrency_level}" if concurrency_level else None
        )
        self.concurrency_level = concurrency_level


class StatisticsError(TTFTError):
    """Statistics calculation errors."""

    def __init__(self, message: str, data_count: Optional[int] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.STATISTICS,
            severity=ErrorSeverity.WARNING,
            suggestion="Check that you have sufficient data for analysis",
            details=f"Data count: {data_count}" if data_count else None
        )
        self.data_count = data_count


class FileError(TTFTError):
    """File operation errors."""

    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.FILE,
            severity=ErrorSeverity.ERROR,
            suggestion="Check file permissions and path existence"
        )


class ReportingError(TTFTError):
    """Report generation errors."""

    def __init__(self, message: str, output_path: Optional[str] = None):
        super().__init__(
            message=message,
            category=ErrorCategory.REPORTING,
            severity=ErrorSeverity.ERROR,
            suggestion="Check output directory permissions and disk space",
            details=f"Output path: {output_path}" if output_path else None
        )
        self.output_path = output_path


class ErrorHandler:
    """Centralized error handling and management."""

    def __init__(self, fail_fast: bool = True, max_retries: int = 3):
        """Initialize error handler.

        Args:
            fail_fast: Whether to stop on first error
            max_retries: Maximum retry attempts for retryable errors
        """
        self.fail_fast = fail_fast
        self.max_retries = max_retries
        self.error_log: List[ErrorContext] = []
        self.failure_count = 0

    def handle_exception(self, exception: Exception, context: str = "") -> bool:
        """Handle an exception and decide whether to continue.

        Args:
            exception: Exception to handle
            context: Context where the error occurred

        Returns:
            True if execution should continue, False if it should stop
        """
        error_context = self._create_error_context(exception, context)
        self.error_log.append(error_context)

        # Log the error
        self._log_error(error_context)

        # Check if we should stop
        if self.fail_fast and error_context.severity == ErrorSeverity.CRITICAL:
            logger.critical(f"Critical error encountered, stopping execution: {error_context.message}")
            return False

        # Count failures
        if error_context.severity in [ErrorSeverity.ERROR, ErrorSeverity.CRITICAL]:
            self.failure_count += 1

        # Check if we've exceeded maximum allowed failures
        if self.failure_count > self.max_retries:
            logger.critical(f"Maximum retry attempts ({self.max_retries}) exceeded")
            return False

        return True

    def should_retry(self, exception: Exception) -> bool:
        """Determine if an exception should be retried.

        Args:
            exception: Exception to check

        Returns:
            True if retryable, False otherwise
        """
        # Network and timeout errors are generally retryable
        if isinstance(exception, (NetworkError, TimeoutError)):
            return True

        # Some API errors might be retryable (e.g., 5xx status codes)
        if isinstance(exception, APIError):
            return exception.status_code and (500 <= exception.status_code < 600)

        # Configuration and validation errors are not retryable
        if isinstance(exception, (ConfigurationError, ValidationError)):
            return False

        # File and reporting errors are not retryable
        if isinstance(exception, (FileNotFoundError, ReportingError)):
            return False

        # For unknown exceptions, be cautious
        return False

    def get_user_friendly_message(self, error_context: ErrorContext) -> str:
        """Generate user-friendly error message.

        Args:
            error_context: Error context to format

        Returns:
            User-friendly error message
        """
        base_message = error_context.message

        if error_context.suggestion:
            base_message += f"\n💡 Suggestion: {error_context.suggestion}"

        if error_context.details:
            base_message += f"\n📋 Details: {error_context.details}"

        # Add specific information based on error type
        if error_context.category == ErrorCategory.NETWORK:
            base_message += "\n🌐 Check your network connection and try again"
        elif error_context.category == ErrorCategory.API:
            base_message += "\n🔗 Verify API endpoint and authentication"
        elif error_context.category == ErrorCategory.CONFIGURATION:
            base_message += "\n⚙️ Review your configuration file"
        elif error_context.category == ErrorCategory.TIMEOUT:
            base_message += "\n⏱️ Consider increasing timeout values"
        elif error_context.category == ErrorCategory.CONCURRENCY:
            base_message += "\n🔄 Reduce concurrency level"

        return base_message

    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of all errors encountered.

        Returns:
            Dictionary with error summary
        """
        if not self.error_log:
            return {"total_errors": 0, "by_category": {}, "by_severity": {}}

        by_category = {}
        by_severity = {}

        for error in self.error_log:
            # Count by category
            category = error.category.value
            by_category[category] = by_category.get(category, 0) + 1

            # Count by severity
            severity = error.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1

        return {
            "total_errors": len(self.error_log),
            "by_category": by_category,
            "by_severity": by_severity,
            "latest_error": self.error_log[-1].message if self.error_log else None
        }

    def log_error_report(self) -> None:
        """Log comprehensive error report."""
        summary = self.get_error_summary()

        logger.error("=== ERROR REPORT ===")
        logger.error(f"Total errors: {summary['total_errors']}")
        logger.error(f"By category: {summary['by_category']}")
        logger.error(f"By severity: {summary['by_severity']}")

        if self.error_log:
            latest_error = self.error_log[-1]
            logger.error(f"Latest error: {latest_error.message}")

        logger.error("=================")

    def clear_errors(self) -> None:
        """Clear error log and reset counters."""
        self.error_log.clear()
        self.failure_count = 0

    def _create_error_context(self, exception: Exception, context: str) -> ErrorContext:
        """Create error context from exception."""
        if isinstance(exception, TTFTError):
            return exception.to_context()

        # For unknown exceptions
        return ErrorContext(
            error_type=exception.__class__.__name__,
            category=ErrorCategory.UNKNOWN,
            severity=ErrorSeverity.ERROR,
            message=str(exception),
            details=f"Context: {context}" if context else None,
            suggestion="Contact support if this issue persists",
            traceback=traceback.format_exc()
        )

    def _log_error(self, error_context: ErrorContext) -> None:
        """Log error with appropriate level."""
        if error_context.severity == ErrorSeverity.CRITICAL:
            logger.critical(f"[CRITICAL] {error_context.message}")
        elif error_context.severity == ErrorSeverity.ERROR:
            logger.error(f"[ERROR] {error_context.message}")
        elif error_context.severity == ErrorSeverity.WARNING:
            logger.warning(f"[WARNING] {error_context.message}")
        else:
            logger.info(f"[INFO] {error_context.message}")

        # Log details if available
        if error_context.details:
            logger.debug(f"Error details: {error_context.details}")

        # Log suggestion if available
        if error_context.suggestion:
            logger.debug(f"Suggestion: {error_context.suggestion}")


class CircuitBreaker:
    """Circuit breaker for preventing cascade failures."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        """Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before trying again
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        """Call function with circuit breaker protection.

        Args:
            func: Function to call
            *args, **kwargs: Function arguments

        Returns:
            Function result

        Raises:
            Exception: If circuit is open or function fails
        """
        if self.state == "open":
            if time.time() - self.last_failure_time < self.recovery_timeout:
                raise NetworkError("Circuit breaker is open - service temporarily unavailable")
            else:
                # Attempt recovery
                self.state = "half-open"

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        """Handle successful call."""
        self.failure_count = 0
        self.state = "closed"

    def on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

    def reset(self):
        """Reset circuit breaker state."""
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "closed"


def async_retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (NetworkError, TimeoutError, APIError)
):
    """Decorator for async function retry logic.

    Args:
        max_attempts: Maximum number of attempts
        delay: Initial delay between attempts
        backoff_factor: Backoff factor for exponential delay
        exceptions: Exception types to retry on
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        wait_time = delay * (backoff_factor ** attempt)
                        logger.warning(f"Attempt {attempt + 1}/{max_attempts} failed, retrying in {wait_time}s: {e}")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"All {max_attempts} attempts failed")

            raise last_exception or Exception("Unknown error in retry")

        return wrapper
    return decorator


def handle_errors(fail_fast: bool = True, max_retries: int = 3):
    """Decorator for automatic error handling.

    Args:
        fail_fast: Whether to stop on first error
        max_retries: Maximum retry attempts
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                handler = ErrorHandler(fail_fast=fail_fast, max_retries=max_retries)
                should_continue = handler.handle_exception(e, f"Function: {func.__name__}")

                if should_continue:
                    # For async functions, we need to handle differently
                    if asyncio.iscoroutinefunction(func):
                        raise e  # Re-raise to be handled by async caller
                    return None
                else:
                    # Stop execution
                    raise e

        return wrapper
    return decorator