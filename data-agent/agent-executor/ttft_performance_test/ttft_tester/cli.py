"""
Command Line Interface for TTFT Performance Testing Package

Provides a comprehensive CLI for running TTFT performance tests with flexible
configuration and reporting options.
"""

import argparse
import logging
import sys
import os
import asyncio
from datetime import datetime
from typing import Dict, List, Optional

# Initialize version from package
try:
    from . import __version__
    VERSION = __version__
except ImportError:
    VERSION = "1.0.0"

# Import core modules
from .config import ConfigurationManager
from .models import TestConfiguration, ReportFormat

# Default configuration file paths
DEFAULT_CONFIG_FILE = "./config.yaml"
DEFAULT_OUTPUT_DIR = "./results"
DEFAULT_LOG_LEVEL = "INFO"

# Set up logging
def setup_logging(level: str, log_file: Optional[str] = None) -> None:
    """Set up logging configuration."""
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

    # Prevent duplicate handlers
    logger.propagate = False

def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        prog='ttft-tester',
        description='TTFT Performance Testing Package for Conversation APIs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ttft-tester test --url https://api.example.com --concurrency 5 --iterations 10
  ttft-tester config init --output config.yaml
  ttft-tester validate --url https://api.example.com
  ttft-tester report results/latest.json --format txt

Use 'ttft-tester [COMMAND] --help' for more information on a specific command.
        """
    )

    # Global options
    parser.add_argument(
        '--version',
        action='version',
        version=f'%(prog)s {VERSION}'
    )
    parser.add_argument(
        '--config', '-c',
        default=DEFAULT_CONFIG_FILE,
        help=f'Configuration file path (default: {DEFAULT_CONFIG_FILE})'
    )
    parser.add_argument(
        '--output-dir', '-o',
        default=DEFAULT_OUTPUT_DIR,
        help=f'Output directory for results (default: {DEFAULT_OUTPUT_DIR})'
    )
    parser.add_argument(
        '--log-level', '-l',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default=DEFAULT_LOG_LEVEL,
        help=f'Logging level (default: {DEFAULT_LOG_LEVEL})'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress non-essential output'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )

    # Subcommands
    subparsers = parser.add_subparsers(
        dest='command',
        help='Available commands',
        metavar='COMMAND'
    )

    # Test command
    test_parser = subparsers.add_parser(
        'test',
        help='Run a performance test',
        description='Run TTFT performance tests against the specified API'
    )
    test_parser.add_argument(
        '--config', '-c',
        default=DEFAULT_CONFIG_FILE,
        help='Configuration file path'
    )
    test_parser.add_argument(
        '--url', '-u',
        help='API base URL'
    )
    test_parser.add_argument(
        '--concurrency', '-n',
        type=int,
        help='Number of concurrent requests'
    )
    test_parser.add_argument(
        '--iterations', '-i',
        type=int,
        help='Number of test iterations'
    )
    test_parser.add_argument(
        '--query', '-q',
        help='Single test query'
    )
    test_parser.add_argument(
        '--queries-file', '-f',
        help='JSON file with multiple queries'
    )
    test_parser.add_argument(
        '--payload-file', '-p',
        help='JSON payload template'
    )
    test_parser.add_argument(
        '--timeout', '-t',
        type=int,
        help='Request timeout in seconds'
    )
    test_parser.add_argument(
        '--headers', '-H',
        action='append',
        help='Custom headers (key=value format)'
    )
    test_parser.add_argument(
        '--delay', '-d',
        type=float,
        help='Delay between requests in seconds'
    )
    test_parser.add_argument(
        '--max-failures', '-m',
        type=int,
        help='Maximum allowed failures'
    )
    test_parser.add_argument(
        '--no-charts',
        action='store_true',
        help='Disable chart generation'
    )
    test_parser.add_argument(
        '--validate',
        action='store_true',
        help='Validate API connectivity before running tests'
    )

    # Config command
    config_parser = subparsers.add_parser(
        'config',
        help='Manage configuration files',
        description='Configuration management commands'
    )
    config_subparsers = config_parser.add_subparsers(dest='config_subcommand')

    # Config init
    config_init_parser = config_subparsers.add_parser(
        'init',
        help='Initialize a new configuration file'
    )
    config_init_parser.add_argument(
        '--output', '-o',
        default=DEFAULT_CONFIG_FILE,
        help='Output file path'
    )
    config_init_parser.add_argument(
        '--template', '-t',
        choices=['default', 'advanced', 'minimal'],
        default='default',
        help='Configuration template'
    )
    config_init_parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='Overwrite existing file'
    )

    # Config validate
    config_validate_parser = config_subparsers.add_parser(
        'validate',
        help='Validate existing configuration'
    )
    config_validate_parser.add_argument(
        '--config', '-c',
        default=DEFAULT_CONFIG_FILE,
        help='Configuration file to validate'
    )
    config_validate_parser.add_argument(
        '--strict', '-s',
        action='store_true',
        help='Exit with error on warnings'
    )

    # Config show
    config_show_parser = config_subparsers.add_parser(
        'show',
        help='Show current configuration'
    )
    config_show_parser.add_argument(
        '--config', '-c',
        default=DEFAULT_CONFIG_FILE,
        help='Configuration file to display'
    )

    # Validate command
    validate_parser = subparsers.add_parser(
        'validate',
        help='Validate API connectivity',
        description='Test if your API endpoint is accessible'
    )
    validate_parser.add_argument(
        '--url', '-u',
        help='API URL to validate'
    )
    validate_parser.add_argument(
        '--timeout', '-t',
        type=int,
        default=30,
        help='Validation timeout in seconds'
    )
    validate_parser.add_argument(
        '--headers', '-H',
        action='append',
        help='Custom headers for validation'
    )
    validate_parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output during validation'
    )

    # Report command
    report_parser = subparsers.add_parser(
        'report',
        help='Generate reports from existing data',
        description='Generate reports from existing test result files'
    )
    report_parser.add_argument(
        'input_file',
        nargs='?',
        help='Input JSON file with test results'
    )
    report_parser.add_argument(
        '--format', '-f',
        choices=['json', 'csv', 'txt', 'html'],
        default='txt',
        help='Output format'
    )
    report_parser.add_argument(
        '--output', '-o',
        help='Output file path'
    )
    report_parser.add_argument(
        '--charts',
        action='store_true',
        default=True,
        help='Include charts in report'
    )
    report_parser.add_argument(
        '--no-charts',
        action='store_true',
        help='Exclude charts from report'
    )
    report_parser.add_argument(
        '--stats-only',
        action='store_true',
        help='Include only statistics, no raw data'
    )

    # Version command
    version_parser = subparsers.add_parser(
        'version',
        help='Show version information'
    )
    version_parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed version information'
    )

    return parser

def handle_config_init(args: argparse.Namespace) -> int:
    """Handle config init command."""
    print(f"Initializing configuration file: {args.output}")

    # Check if file exists
    if os.path.exists(args.output) and not args.force:
        print(f"Error: Configuration file already exists: {args.output}")
        print("Use --force to overwrite the existing file.")
        return 1

    # Create configuration template based on template type
    templates = {
        'default': get_default_config_template(),
        'advanced': get_advanced_config_template(),
        'minimal': get_minimal_config_template()
    }

    template = templates.get(args.template, templates['default'])

    # Write configuration file
    try:
        with open(args.output, 'w') as f:
            f.write(template)
        print(f"Configuration file created: {args.output}")
        print(f"Template: {args.template}")
        print(f"Run 'ttft-tester test --config {args.output}' to use this configuration.")
        return 0
    except Exception as e:
        print(f"Error creating configuration file: {e}")
        return 1

def handle_config_validate(args: argparse.Namespace) -> int:
    """Handle config validate command."""
    print(f"Validating configuration file: {args.config}")

    # Check if file exists
    if not os.path.exists(args.config):
        print(f"Error: Configuration file not found: {args.config}")
        return 1

    # Placeholder for validation logic
    print("Configuration validation not yet implemented.")
    return 0

def handle_config_show(args: argparse.Namespace) -> int:
    """Handle config show command."""
    print(f"Showing configuration: {args.config}")

    # Check if file exists
    if not os.path.exists(args.config):
        print(f"Error: Configuration file not found: {args.config}")
        return 1

    # Read and display configuration
    try:
        with open(args.config, 'r') as f:
            content = f.read()
            print("\nConfiguration content:")
            print("=" * 50)
            print(content)
            print("=" * 50)
        return 0
    except Exception as e:
        print(f"Error reading configuration file: {e}")
        return 1

def handle_validate(args: argparse.Namespace) -> int:
    """Handle validate command."""
    print("API validation not yet implemented.")
    return 0

def handle_report(args: argparse.Namespace) -> int:
    """Handle report command."""
    print("Report generation not yet implemented.")
    return 0

def handle_test(args: argparse.Namespace) -> int:
    """Handle test command."""
    try:
        return asyncio.run(handle_test_async(args))
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        return 130
    except Exception as e:
        print(f"Test failed: {e}")
        return 1


async def handle_test_async(args: argparse.Namespace) -> int:
    """Handle test command asynchronously."""
    print("Starting TTFT Performance Test...")

    # Load configuration
    config_manager = ConfigurationManager(args.config)
    try:
        config = config_manager.load_config()
    except Exception as e:
        print(f"Error loading configuration: {e}")
        return 2

    # Apply CLI overrides
    config = config_manager.apply_cli_overrides(config, vars(args))

    # Apply environment overrides
    config = config_manager.apply_environment_overrides(config)

    # Validate configuration
    if not config_manager.validate_config(config):
        print("Configuration validation failed")
        return 2

    # Resolve queries
    try:
        queries = config_manager.resolve_queries(config)
        print(f"Resolved {len(queries)} queries for testing")
    except Exception as e:
        print(f"Error resolving queries: {e}")
        return 2

    # Resolve payload template
    try:
        payload_template = config_manager.resolve_payload_template(config)
        if payload_template:
            print(f"Loaded payload template")
    except Exception as e:
        print(f"Error loading payload template: {e}")
        return 2

    # Set up logging
    from .utils import setup_logging, validate_output_directory
    setup_logging(config.report_config.log_level)

    # Validate output directory
    try:
        validate_output_directory(config.report_config.output_dir)
    except Exception as e:
        print(f"Error with output directory: {e}")
        return 5

    # Import and initialize core components
    from .core import TTFTTester
    from .reporter import ReportGenerator
    from .charts import ChartOptions

    # Initialize TTFT tester
    tester = TTFTTester(config)

    # Validate API connectivity if requested
    if args.validate or getattr(args, 'validate_api', False):
        print("Validating API connectivity...")
        if not await tester.validate_api_connectivity():
            print("API connectivity validation failed")
            return 3
        print("API connectivity validation successful")

    # Run the test
    print(f"Starting test with {config.test_config.concurrency} concurrency and {len(queries)} queries")
    print(f"API endpoint: {config.api_config.base_url}{config.api_config.endpoint}")

    try:
        if config.test_config.concurrency > 1:
            session = await tester.run_concurrent_test(queries)
        else:
            session = await tester.run_sequential_test(queries)

        # Mark session as completed
        session.set_status("completed")

        print(f"\nTest completed successfully!")
        print(f"Total requests: {len(session.measurements)}")

        successful = len([m for m in session.measurements if m.status == "success"])
        failed = len([m for m in session.measurements if m.status == "error"])

        print(f"Successful: {successful}, Failed: {failed}")
        print(f"Success rate: {(successful / len(session.measurements) * 100):.1f}%")

        # Generate reports
        print(f"\nGenerating reports...")
        report_gen = ReportGenerator(session, ChartOptions(
            width=80,
            height=20,
            show_grid=True,
            show_labels=True
        ))

        # Determine report formats
        formats = []
        for f in config.report_config.formats:
            if isinstance(f, str):
                formats.append(ReportFormat(f.lower()))
            else:
                formats.append(f)

        # Generate reports
        report_files = report_gen.generate_reports(formats, config.report_config.output_dir)

        print(f"Reports generated:")
        for format_type, file_path in report_files.items():
            print(f"  {format_type.upper()}: {file_path}")

        # Show summary if text report was generated
        if ReportFormat.TXT in report_files:
            print(f"\n" + "="*50)
            print("REPORT SUMMARY")
            print("="*50)

            # Read and display first few lines of text report
            text_file = report_files[ReportFormat.TXT]
            try:
                with open(text_file, 'r') as f:
                    lines = f.readlines()[:50]  # First 50 lines
                    print(''.join(lines))
                    if len(lines) >= 50:
                        print("... (report truncated)")
            except Exception as e:
                print(f"Could not read report file: {e}")

        return 0

    except Exception as e:
        print(f"Test execution failed: {e}")
        if hasattr(e, '__cause__') and e.__cause__:
            print(f"Root cause: {e.__cause__}")
        return 4

def handle_version(args: argparse.Namespace) -> int:
    """Handle version command."""
    if args.verbose:
        print(f"TTFT Performance Testing Package")
        print(f"Version: {VERSION}")
        print(f"Python: {sys.version}")
        print(f"Installation: {os.path.dirname(__file__)}")
    else:
        print(f"ttft-tester {VERSION}")
    return 0

def get_default_config_template() -> str:
    """Get default configuration template."""
    return """# TTFT Performance Test Configuration

# API Configuration
api:
  base_url: "https://api.example.com"
  endpoint: "/api/agent-executor/v2/agent/run"
  timeout: 30
  headers:
    x-user: "user-12345"
    x-visitor-type: "user"
    Content-Type: "application/json"
  # payload_template: "payload.json"  # Optional custom payload template

# Test Parameters
test:
  concurrency: 5
  iterations: 20
  delay_between_requests: 0.0
  delay_between_batches: 2.0
  max_failures: 10
  queries:
    - "What is artificial intelligence?"
    - "Explain blockchain technology"
    - "How does photosynthesis work?"
  # query_file: "queries.json"  # Optional queries file

# Report Configuration
report:
  output_dir: "./results"
  formats: ["json", "txt"]
  include_charts: true
  chart_types: ["time_series", "distribution"]
  timestamp_format: "%Y%m%d_%H%M%S"

# Logging
logging:
  level: "INFO"
  # file: "ttft_tester.log"  # Optional log file
"""

def get_advanced_config_template() -> str:
    """Get advanced configuration template."""
    return """# Advanced TTFT Performance Test Configuration

# API Configuration
api:
  base_url: "https://api.example.com"
  endpoint: "/api/agent-executor/v2/agent/run"
  timeout: 60
  headers:
    x-user: "user-12345"
    x-visitor-type: "user"
    Content-Type: "application/json"
    Authorization: "Bearer your-token-here"
  payload_template: "custom_payload.json"
  payload_overrides:
    agent_id: "your-agent-id"
    # Add runtime payload modifications

# Test Parameters
test:
  concurrency: 50
  iterations: 1000
  delay_between_requests: 0.1
  delay_between_batches: 5.0
  max_failures: 100
  query_file: "benchmark_queries.json"
  # queries can be inline or from file
  queries:
    - "Simple query about AI"
    - "Complex technical explanation"
    - "Creative writing prompt"
    - "Code generation request"

# Report Configuration
report:
  output_dir: "./performance_results"
  formats: ["json", "csv", "txt", "html"]
  include_charts: true
  chart_types: ["time_series", "distribution", "scatter", "box_plot"]
  timestamp_format: "%Y%m%d_%H%M%S"
  chart_settings:
    width: 80
    height: 20
    show_grid: true

# Logging
logging:
  level: "DEBUG"
  file: "detailed_test.log"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
"""

def get_minimal_config_template() -> str:
    """Get minimal configuration template."""
    return """# Minimal TTFT Performance Test Configuration

api:
  base_url: "https://api.example.com"
  endpoint: "/api/agent-executor/v2/agent/run"

test:
  concurrency: 1
  iterations: 5
  queries:
    - "What is machine learning?"

report:
  output_dir: "./results"
  formats: ["txt"]
"""

def main() -> int:
    """Main entry point for the CLI."""
    # Parse arguments
    parser = create_parser()
    args = parser.parse_args()

    # Set up logging
    log_level = 'DEBUG' if args.verbose else args.log_level
    if args.quiet:
        log_level = 'WARNING'
    setup_logging(log_level)

    # Handle no command
    if args.command is None:
        parser.print_help()
        return 1

    # Route to appropriate handler
    handlers = {
        'test': handle_test,
        'validate': handle_validate,
        'report': handle_report,
        'version': handle_version
    }

    # Special handling for config subcommands
    if args.command == 'config':
        if args.config_subcommand is None:
            # No subcommand provided, show help
            subparsers = parser._subparsers._actions[1]
            config_parser = subparsers._name_parser_map['config']
            config_parser.print_help()
            return 1

        config_handlers = {
            'init': handle_config_init,
            'validate': handle_config_validate,
            'show': handle_config_show
        }

        if args.config_subcommand in config_handlers:
            return config_handlers[args.config_subcommand](args)
        else:
            print(f"Unknown config subcommand: {args.config_subcommand}")
            return 1

    # Handle main commands
    if args.command in handlers:
        return handlers[args.command](args)
    else:
        print(f"Unknown command: {args.command}")
        parser.print_help()
        return 1

if __name__ == '__main__':
    sys.exit(main())