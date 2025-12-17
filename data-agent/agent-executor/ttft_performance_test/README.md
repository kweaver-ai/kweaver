# TTFT Performance Testing Package

A standalone Python package for testing Time to First Token (TTFT) performance of conversation APIs with support for concurrent testing, flexible configuration, and comprehensive reporting.

## Features

- **TTFT Performance Testing**: Measure Time to First Token for conversation APIs
- **Concurrent Testing**: Support for high-concurrency performance testing
- **Flexible Configuration**: YAML configuration files with CLI overrides
- **Comprehensive Reports**: Multi-format output (JSON, CSV, text with ASCII charts)
- **Minimal Dependencies**: Uses Python standard library only for maximum compatibility
- **Easy Installation**: Single package with pip installation support
- **Bash Script**: Convenient script for running tests

## Installation

### From Source

```bash
git clone <repository-url>
cd ttft_performance_test
pip install -e .
```

### With Optional Dependencies

```bash
pip install -e ".[charts,full]"
```

## Quick Start

### Basic Usage

```bash
# Run a basic test
ttft-tester test --url https://api.example.com --concurrency 5 --iterations 10

# Generate configuration
ttft-tester config init --output config.yaml

# Validate API
ttft-tester validate --url https://api.example.com
```

### Using the Enhanced Bash Script (Recommended)

We provide an enhanced bash script that makes running TTFT tests much easier:

```bash
# Check dependencies and configuration
./run_test.sh check examples/senario1/config.yaml

# Run basic test
./run_test.sh basic examples/senario1/config.yaml

# Run concurrent test with 10 concurrent users, 20 iterations
./run_test.sh concurrent examples/senario1/config.yaml 10 20

# Run all tests (basic + concurrent + report)
./run_test.sh all examples/senario1/config.yaml

# Generate comprehensive report
./run_test.sh report examples/senario1/config.yaml

# Show test results
./run_test.sh results
```

### Using Configuration File

```yaml
# config.yaml
api:
  base_url: "https://api.example.com"
  endpoint: "/api/agent-executor/v2/agent/run"
  headers:
    x-user: "user-12345"
    Content-Type: "application/json"

test:
  concurrency: 10
  iterations: 100
  queries:
    - "What is artificial intelligence?"
    - "Explain blockchain technology"

report:
  output_dir: "./results"
  formats: ["json", "txt"]
  include_charts: true
```

```bash
ttft-tester test --config config.yaml
```

## Features Overview

### 1. Standalone Package
- Completely separate from main project code
- Easy distribution and installation
- Minimal third-party dependencies
- Professional package structure

### 2. Performance Testing
- TTFT (Time to First Token) measurement
- Concurrent request execution
- Statistical analysis (mean, median, percentiles)
- Success rate and error tracking

### 3. Flexible Configuration
- YAML configuration files
- CLI parameter overrides
- Environment variable support
- Custom headers and payloads

### 4. Comprehensive Reporting
- Multiple output formats (JSON, CSV, text)
- ASCII chart generation
- Statistical summaries
- Error analysis

### 5. Enhanced Bash Script
- Professional script with comprehensive error handling
- Multiple test scenarios (basic, concurrent, load testing)
- Automatic dependency checking and virtual environment activation
- Colored output and detailed logging
- Report generation and results analysis
- Easy automation and CI/CD integration

## Requirements

- Python 3.10+
- No external dependencies (standard library only)

## Project Structure

```
ttft_performance_test/
├── setup.py
├── setup.cfg
├── pyproject.toml
├── requirements.txt
├── MANIFEST.in
├── README.md
├── run_test.sh                  # Enhanced bash script for testing
├── ttft_tester/
│   ├── __init__.py
│   ├── cli.py          # Command-line interface
│   ├── core.py         # Core testing logic
│   ├── config.py       # Configuration management
│   ├── reporter.py     # Report generation
│   ├── models.py       # Data models
│   ├── utils.py        # Utility functions
│   └── charts.py       # ASCII chart generation
├── tests/
├── examples/
└── docs/
```

## Bash Script Usage

The enhanced `run_test.sh` script provides a user-friendly interface for running TTFT performance tests with comprehensive error handling and automation support.

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `check` | Validate dependencies and configuration | `./run_test.sh check config.yaml` |
| `info` | Display configuration information | `./run_test.sh info config.yaml` |
| `basic` | Run basic performance test | `./run_test.sh basic config.yaml 5` |
| `concurrent` | Run concurrent test | `./run_test.sh concurrent config.yaml 10 20` |
| `load` | Run high-load test | `./run_test.sh load config.yaml 20 50` |
| `custom` | Run test with custom parameters | `./run_test.sh custom config.yaml --concurrency 5 --iterations 10` |
| `report` | Generate comprehensive report | `./run_test.sh report config.yaml` |
| `results` | Show test results | `./run_test.sh results` |
| `all` | Run complete test suite | `./run_test.sh all config.yaml` |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONFIG_FILE` | Default configuration file path | `examples/senario1/config.yaml` |
| `CLEAN_RESULTS` | Auto-clean old result files | `false` |

### Options

| Option | Description |
|--------|-------------|
| `--clean` | Clean old result files (7+ days) |
| `--venv` | Force virtual environment activation |

### Examples

```bash
# Basic workflow
./run_test.sh check examples/senario1/config.yaml
./run_test.sh basic examples/senario1/config.yaml
./run_test.sh results

# Performance testing
./run_test.sh concurrent examples/senario1/config.yaml 10 50
./run_test.sh load examples/senario1/config.yaml 20 100

# Automation
CLEAN_RESULTS=true ./run_test.sh all examples/senario1/config.yaml

# Custom testing
./run_test.sh custom examples/senario1/config.yaml --concurrency 5 --iterations 100 --delay 0.1
```

## Documentation

- [Quick Start Guide](docs/quickstart.md)
- [Configuration Guide](docs/configuration.md)
- [API Reference](docs/api.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

## Development

```bash
# Clone and setup development environment
git clone <repository-url>
cd ttft_performance_test
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black ttft_tester tests

# Type checking
mypy ttft_tester

# Linting
flake8 ttft_tester tests
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.