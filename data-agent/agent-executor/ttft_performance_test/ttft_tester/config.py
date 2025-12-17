"""
Configuration Management for TTFT Performance Testing Package

Handles loading, validation, and management of YAML configuration files
with CLI parameter overrides and environment variable support.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Union, List
from dataclasses import dataclass, field, asdict, replace
from pathlib import Path
import urllib.parse
import socket
import tempfile
import re

from .models import (
    TestConfiguration, ApiConfiguration, TestParameters,
    ReportConfiguration, ReportFormat, ChartType
)

logger = logging.getLogger(__name__)


class ConfigError(Exception):
    """Configuration-related errors."""
    pass


class ValidationError(ConfigError):
    """Configuration validation errors."""
    pass


@dataclass
class EnvironmentConfig:
    """Environment-based configuration overrides."""
    base_url: Optional[str] = None
    timeout: Optional[int] = None
    concurrency: Optional[int] = None
    iterations: Optional[int] = None
    output_dir: Optional[str] = None
    log_level: Optional[str] = None

    @classmethod
    def from_env(cls) -> 'EnvironmentConfig':
        """Load configuration from environment variables."""
        return cls(
            base_url=os.getenv('TTFT_BASE_URL'),
            timeout=_parse_int_env('TTFT_TIMEOUT', 30),
            concurrency=_parse_int_env('TTFT_CONCURRENCY', 1),
            iterations=_parse_int_env('TTFT_ITERATIONS', 1),
            output_dir=os.getenv('TTFT_OUTPUT_DIR'),
            log_level=os.getenv('TTFT_LOG_LEVEL', 'INFO')
        )


class ConfigurationManager:
    """Manages configuration loading and validation."""

    def __init__(self, config_file: Optional[str] = None):
        """Initialize configuration manager.

        Args:
            config_file: Path to YAML configuration file
        """
        self.config_file = config_file or "./config.yaml"
        self._config: Optional[TestConfiguration] = None
        self._environment_config = EnvironmentConfig.from_env()

    def load_config(self) -> TestConfiguration:
        """Load configuration from file and environment."""
        logger.info(f"Loading configuration from: {self.config_file}")

        # Check if file exists
        config_path = Path(self.config_file)
        if not config_path.exists():
            logger.warning(f"Configuration file not found: {self.config_file}")
            # Return default configuration
            self._config = TestConfiguration()
            return self._config

        try:
            # Load YAML configuration
            import yaml
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f)

            logger.debug(f"Loaded configuration data: {config_data}")

            # Parse configuration
            self._config = self._parse_config(config_data)
            logger.info(f"Configuration loaded successfully")

            return self._config

        except ImportError as e:
            raise ConfigError(f"PyYAML is required for configuration files. Install with: pip install pyyaml")
        except Exception as e:
            raise ConfigError(f"Error loading configuration: {e}")

    def apply_cli_overrides(self, config: TestConfiguration, cli_args: Dict[str, Any]) -> TestConfiguration:
        """Apply CLI parameter overrides to configuration."""
        logger.debug(f"Applying CLI overrides: {cli_args}")

        try:
            # API configuration overrides
            if cli_args.get('url'):
                config.api_config.base_url = cli_args['url']
            if cli_args.get('timeout'):
                config.api_config.timeout = int(cli_args['timeout'])
            if cli_args.get('headers'):
                config.api_config.headers.update(
                    self._parse_headers(cli_args['headers'])
                )
            if cli_args.get('payload_file'):
                config.api_config.payload_template = cli_args['payload_file']

            # Test parameters overrides
            if cli_args.get('concurrency'):
                config.test_config.concurrency = int(cli_args['concurrency'])
            if cli_args.get('iterations'):
                config.test_config.iterations = int(cli_args['iterations'])
            if cli_args.get('query'):
                config.test_config.queries = [cli_args['query']]
            if cli_args.get('queries_file'):
                config.test_config.query_file = cli_args['queries_file']
            if cli_args.get('delay'):
                config.test_config.delay_between_requests = float(cli_args['delay'])
            if cli_args.get('max_failures'):
                config.test_config.max_failures = int(cli_args['max_failures'])

            # Report configuration overrides
            if cli_args.get('output_dir'):
                config.report_config.output_dir = cli_args['output_dir']
            if cli_args.get('no_charts'):
                config.report_config.include_charts = False
            if cli_args.get('log_level'):
                config.report_config.log_level = cli_args['log_level']

            logger.debug("CLI overrides applied successfully")
            return config

        except Exception as e:
            raise ConfigError(f"Error applying CLI overrides: {e}")

    def apply_environment_overrides(self, config: TestConfiguration) -> TestConfiguration:
        """Apply environment variable overrides to configuration."""
        env_config = self._environment_config

        if env_config.base_url:
            config.api_config.base_url = env_config.base_url
        if env_config.timeout:
            config.api_config.timeout = env_config.timeout
        if env_config.concurrency:
            config.test_config.concurrency = env_config.concurrency
        if env_config.iterations:
            config.test_config.iterations = env_config.iterations
        if env_config.output_dir:
            config.report_config.output_dir = env_config.output_dir
        if env_config.log_level:
            config.report_config.log_level = env_config.log_level

        return config

    def resolve_queries(self, config: TestConfiguration) -> List[str]:
        """Resolve queries from inline list or file."""
        queries = config.test_config.queries.copy()

        # Load queries from file if specified
        if config.test_config.query_file:
            queries_file = Path(config.test_config.query_file)
            if not queries_file.exists():
                raise ConfigError(f"Queries file not found: {queries_file}")

            try:
                with open(queries_file, 'r', encoding='utf-8') as f:
                    queries_data = json.load(f)

                if isinstance(queries_data, dict) and 'queries' in queries_data:
                    queries.extend(queries_data['queries'])
                elif isinstance(queries_data, list):
                    queries.extend(queries_data)
                else:
                    raise ConfigError("Invalid queries file format")

            except Exception as e:
                raise ConfigError(f"Error loading queries file: {e}")

        if not queries:
            raise ConfigError("No queries available for testing")

        return queries

    def resolve_payload_template(self, config: TestConfiguration) -> Optional[Dict[str, Any]]:
        """Resolve and load payload template if specified."""
        if not config.api_config.payload_template:
            return None

        template_file = Path(config.api_config.payload_template)
        if not template_file.exists():
            raise ConfigError(f"Payload template file not found: {template_file}")

        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                payload_data = json.load(f)

            logger.debug(f"Loaded payload template: {template_file}")
            return payload_data

        except Exception as e:
            raise ConfigError(f"Error loading payload template: {e}")

    def validate_config(self, config: TestConfiguration, strict: bool = False) -> bool:
        """Validate configuration and return True if valid."""
        errors = []
        warnings = []

        try:
            # Validate API configuration
            self._validate_api_config(config.api_config, errors, warnings)

            # Validate test parameters
            self._validate_test_config(config.test_config, errors, warnings)

            # Validate report configuration
            self._validate_report_config(config.report_config, errors, warnings)

            # Validate network connectivity
            self._validate_network_connectivity(config.api_config, errors, warnings)

            # Validate paths and files
            self._validate_paths(config, errors, warnings)

            # Log validation results
            if errors:
                logger.error(f"Configuration validation failed with {len(errors)} errors")
                for error in errors:
                    logger.error(f"  - {error}")
                if strict:
                    raise ValidationError(f"Configuration validation failed: {errors[0]}")
                return False

            if warnings:
                logger.warning(f"Configuration validation completed with {len(warnings)} warnings")
                for warning in warnings:
                    logger.warning(f"  - {warning}")
            else:
                logger.info("Configuration validation completed successfully")

            return True

        except Exception as e:
            logger.error(f"Configuration validation error: {e}")
            errors.append(str(e))
            if strict:
                raise ValidationError(f"Configuration validation error: {e}")
            return False

    def save_config(self, config: TestConfiguration, output_file: str) -> None:
        """Save configuration to file."""
        try:
            import yaml

            config_data = self._config_to_dict(config)
            output_path = Path(output_file)

            # Create output directory if needed
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_data, f, default_flow_style=False, indent=2)

            logger.info(f"Configuration saved to: {output_file}")

        except ImportError as e:
            raise ConfigError(f"PyYAML is required for configuration files. Install with: pip install pyyaml")
        except Exception as e:
            raise ConfigError(f"Error saving configuration: {e}")

    def _parse_config(self, config_data: Dict[str, Any]) -> TestConfiguration:
        """Parse configuration data into dataclasses."""
        try:
            # Parse API configuration
            api_data = config_data.get('api', {})
            api_config = ApiConfiguration(
                base_url=api_data.get('base_url', 'https://api.example.com'),
                endpoint=api_data.get('endpoint', '/api/agent-executor/v2/agent/run'),
                headers=api_data.get('headers', {}),
                timeout=api_data.get('timeout', 30),
                payload_template=api_data.get('payload_template'),
                payload_overrides=api_data.get('payload_overrides')
            )

            # Parse test parameters
            test_data = config_data.get('test', {})
            test_config = TestParameters(
                concurrency=test_data.get('concurrency', 1),
                iterations=test_data.get('iterations', 1),
                delay_between_requests=test_data.get('delay_between_requests', 0.0),
                delay_between_batches=test_data.get('delay_between_batches', 2.0),
                queries=test_data.get('queries', []),
                query_file=test_data.get('query_file'),
                max_failures=test_data.get('max_failures', 0)
            )

            # Parse report configuration
            report_data = config_data.get('report', {})
            report_config = ReportConfiguration(
                output_dir=report_data.get('output_dir', './results'),
                formats=[ReportFormat(f.lower()) for f in report_data.get('formats', ['json', 'txt'])],
                include_charts=report_data.get('include_charts', True),
                chart_types=[ChartType(t.lower()) for t in report_data.get('chart_types', ['time_series'])],
                timestamp_format=report_data.get('timestamp_format', '%Y%m%d_%H%M%S'),
                log_level=report_data.get('log_level', 'INFO')
            )

            # Parse logging configuration
            logging_data = config_data.get('logging', {})
            if logging_data.get('level'):
                report_config.log_level = logging_data['level']

            return TestConfiguration(
                api_config=api_config,
                test_config=test_config,
                report_config=report_config
            )

        except Exception as e:
            raise ConfigError(f"Error parsing configuration: {e}")

    def _parse_headers(self, headers_list: List[str]) -> Dict[str, str]:
        """Parse CLI headers in 'key=value' format."""
        headers = {}
        for header in headers_list:
            if '=' in header:
                key, value = header.split('=', 1)
                headers[key.strip()] = value.strip()
            else:
                logger.warning(f"Invalid header format: {header}")
        return headers

    def _validate_api_config(self, api_config: ApiConfiguration, errors: List[str], warnings: List[str]) -> None:
        """Validate API configuration."""
        # Validate URL
        if not api_config.base_url:
            errors.append("API base URL is required")
        elif not _is_valid_url(api_config.base_url):
            errors.append(f"Invalid API base URL: {api_config.base_url}")

        # Validate timeout
        if not (1 <= api_config.timeout <= 300):
            errors.append(f"Timeout must be between 1 and 300 seconds: {api_config.timeout}")

        # Validate headers
        if not api_config.headers.get('Content-Type'):
            warnings.append("Content-Type header not specified, using default")
            api_config.headers['Content-Type'] = 'application/json'

        # Validate payload template
        if api_config.payload_template and not Path(api_config.payload_template).exists():
            errors.append(f"Payload template file not found: {api_config.payload_template}")

    def _validate_test_config(self, test_config: TestParameters, errors: List[str], warnings: List[str]) -> None:
        """Validate test parameters."""
        # Validate concurrency
        if not (1 <= test_config.concurrency <= 1000):
            errors.append(f"Concurrency must be between 1 and 1000: {test_config.concurrency}")

        # Validate iterations
        if test_config.iterations < 1:
            errors.append(f"Iterations must be >= 1: {test_config.iterations}")

        # Validate delays
        if test_config.delay_between_requests < 0:
            errors.append(f"Delay between requests must be >= 0: {test_config.delay_between_requests}")

        # Validate queries
        if not test_config.queries and not test_config.query_file:
            errors.append("Either queries or query_file must be specified")

        # Validate max_failures
        if test_config.max_failures < 0:
            errors.append(f"Max failures must be >= 0: {test_config.max_failures}")

    def _validate_report_config(self, report_config: ReportConfiguration, errors: List[str], warnings: List[str]) -> None:
        """Validate report configuration."""
        # Validate output directory
        try:
            output_dir = Path(report_config.output_dir)
            if not output_dir.exists():
                warnings.append(f"Output directory does not exist: {report_config.output_dir}")
            else:
                # Test write permissions
                test_file = output_dir / '.permission_test'
                test_file.touch()
                test_file.unlink()
        except Exception as e:
            errors.append(f"Output directory not writable: {report_config.output_dir} ({e})")

        # Validate formats
        if not report_config.formats:
            errors.append("At least one output format must be specified")
        else:
            invalid_formats = [f for f in report_config.formats if f not in ReportFormat]
            if invalid_formats:
                errors.append(f"Invalid output formats: {invalid_formats}")

        # Validate chart types
        if report_config.chart_types:
            invalid_charts = [t for t in report_config.chart_types if t not in ChartType]
            if invalid_charts:
                errors.append(f"Invalid chart types: {invalid_charts}")

    def _validate_network_connectivity(self, api_config: ApiConfiguration, errors: List[str], warnings: List[str]) -> None:
        """Validate network connectivity to API endpoint."""
        try:
            url = urllib.parse.urljoin(api_config.base_url, api_config.endpoint)
            parsed_url = urllib.parse.urlparse(url)

            # Test DNS resolution
            try:
                socket.gethostbyname(parsed_url.hostname)
            except socket.gaierror as e:
                warnings.append(f"DNS resolution failed for {parsed_url.hostname}: {e}")
                return

            # Test HTTP connection (basic check)
            try:
                import http.client
                if parsed_url.scheme == 'https':
                    conn = http.client.HTTPSConnection(parsed_url.hostname, parsed_url.port or 443, timeout=5)
                else:
                    conn = http.client.HTTPConnection(parsed_url.hostname, parsed_url.port or 80, timeout=5)

                conn.request('HEAD', parsed_url.path or '/')
                response = conn.getresponse()

                if response.status >= 400:
                    warnings.append(f"API endpoint returned status {response.status}")

                conn.close()

            except Exception as e:
                warnings.append(f"Network connectivity test failed: {e}")

        except Exception as e:
            warnings.append(f"Network validation error: {e}")

    def _validate_paths(self, config: TestConfiguration, errors: List[str], warnings: List[str]) -> None:
        """Validate file paths and directories."""
        # Check queries file
        if config.test_config.query_file:
            queries_file = Path(config.test_config.query_file)
            if not queries_file.exists():
                errors.append(f"Queries file not found: {queries_file}")

        # Check payload template
        if config.api_config.payload_template:
            payload_file = Path(config.api_config.payload_template)
            if not payload_file.exists():
                errors.append(f"Payload template file not found: {payload_file}")

    def _config_to_dict(self, config: TestConfiguration) -> Dict[str, Any]:
        """Convert configuration dataclass to dictionary."""
        return {
            'api': asdict(config.api_config),
            'test': asdict(config.test_config),
            'report': {
                'output_dir': config.report_config.output_dir,
                'formats': [f.value for f in config.report_config.formats],
                'include_charts': config.report_config.include_charts,
                'chart_types': [t.value for t in config.report_config.chart_types],
                'timestamp_format': config.report_config.timestamp_format
            },
            'logging': {
                'level': config.report_config.log_level
            }
        }


def _parse_int_env(var_name: str, default: int) -> Optional[int]:
    """Parse integer from environment variable."""
    value = os.getenv(var_name)
    if value is not None:
        try:
            return int(value)
        except ValueError:
            pass
    return None


def _is_valid_url(url: str) -> bool:
    """Check if URL is valid."""
    try:
        result = urllib.parse.urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False