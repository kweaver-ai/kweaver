"""
Report Generation for TTFT Performance Testing Package

Handles generation of comprehensive reports in multiple formats including
JSON, CSV, text, and HTML with embedded ASCII charts.
"""

import json
import csv
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timezone
from pathlib import Path
import os
import re

from .models import (
    TestSession, TestConfiguration, TTFTMeasurement,
    ReportFormat, ChartType, ChartData
)
from .utils import (
    calculate_test_statistics, save_results_json, save_results_csv,
    get_output_filename, validate_output_directory, format_duration,
    format_number, get_time_series_data
)
from .charts import ASCIIChartGenerator, ChartOptions
from .errors import ReportingError, FileError

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Main report generation engine."""

    def __init__(self, session: TestSession, options: ChartOptions = None):
        """Initialize report generator.

        Args:
            session: TestSession with results
            options: Chart generation options
        """
        self.session = session
        self.options = options or ChartOptions()
        self.chart_generator = ASCIIChartGenerator(self.options)

        # Calculate statistics if not already calculated
        if not session.statistics:
            session.statistics = calculate_test_statistics(session)

    def generate_reports(self, formats: List[ReportFormat], output_dir: str) -> Dict[str, str]:
        """Generate reports in multiple formats.

        Args:
            formats: List of report formats to generate
            output_dir: Output directory path

        Returns:
            Dictionary mapping format to file path
        """
        # Validate output directory
        output_path = validate_output_directory(output_dir)

        results = {}
        for format_type in formats:
            try:
                if format_type == ReportFormat.JSON:
                    file_path = self.generate_json_report(output_dir)
                elif format_type == ReportFormat.CSV:
                    file_path = self.generate_csv_report(output_dir)
                elif format_type == ReportFormat.TXT:
                    file_path = self.generate_text_report(output_dir)
                elif format_type == ReportFormat.HTML:
                    file_path = self.generate_html_report(output_dir)
                else:
                    logger.warning(f"Unsupported format: {format_type}")
                    continue

                results[format_type.value] = file_path
                logger.info(f"Generated {format_type.value} report: {file_path}")

            except Exception as e:
                logger.error(f"Failed to generate {format_type.value} report: {e}")
                raise ReportingError(f"Report generation failed for {format_type.value}: {e}")

        return results

    def generate_json_report(self, output_dir: str) -> str:
        """Generate JSON report.

        Args:
            output_dir: Output directory path

        Returns:
            Path to generated JSON file
        """
        filename = get_output_filename(
            prefix="ttft_report",
            extension="json",
            timestamp_format=self.session.configuration.report_config.timestamp_format,
            output_dir=output_dir
        )

        save_results_json(self.session, filename, include_raw_data=True)
        return filename

    def generate_csv_report(self, output_dir: str) -> str:
        """Generate CSV report.

        Args:
            output_dir: Output directory path

        Returns:
            Path to generated CSV file
        """
        filename = get_output_filename(
            prefix="ttft_measurements",
            extension="csv",
            timestamp_format=self.session.configuration.report_config.timestamp_format,
            output_dir=output_dir
        )

        save_results_csv(self.session.measurements, filename)
        return filename

    def generate_text_report(self, output_dir: str) -> str:
        """Generate text report with ASCII charts.

        Args:
            output_dir: Output directory path

        Returns:
            Path to generated text file
        """
        filename = get_output_filename(
            prefix="ttft_report",
            extension="txt",
            timestamp_format=self.session.configuration.report_config.timestamp_format,
            output_dir=output_dir
        )

        try:
            report_content = self._generate_text_report_content()

            with open(filename, 'w', encoding='utf-8') as f:
                f.write(report_content)

            return filename

        except Exception as e:
            raise ReportingError(f"Failed to generate text report: {e}")

    def generate_html_report(self, output_dir: str) -> str:
        """Generate HTML report with embedded ASCII charts.

        Args:
            output_dir: Output directory path

        Returns:
            Path to generated HTML file
        """
        filename = get_output_filename(
            prefix="ttft_report",
            extension="html",
            timestamp_format=self.session.configuration.report_config.timestamp_format,
            output_dir=output_dir
        )

        try:
            html_content = self._generate_html_report_content()

            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)

            return filename

        except Exception as e:
            raise ReportingError(f"Failed to generate HTML report: {e}")

    def _generate_text_report_content(self) -> str:
        """Generate content for text report."""
        lines = []

        # Header
        lines.append("=" * 80)
        lines.append("TTFT PERFORMANCE TEST REPORT")
        lines.append("=" * 80)

        # Session information
        lines.append(f"Session ID:     {self.session.session_id}")
        lines.append(f"Test Started:   {self.session.started_at}")
        if self.session.completed_at:
            duration = (self.session.completed_at - self.session.started_at).total_seconds()
            lines.append(f"Test Completed:  {self.session.completed_at}")
            lines.append(f"Duration:        {format_duration(duration)}")
        else:
            lines.append(f"Test Status:     {self.session.status.value if hasattr(self.session.status, 'value') else str(self.session.status)}")
        lines.append("")

        # Configuration summary
        lines.append("TEST CONFIGURATION")
        lines.append("-" * 40)
        config = self.session.configuration
        lines.append(f"API Endpoint:     {config.api_config.base_url}{config.api_config.endpoint}")
        lines.append(f"Concurrency:      {config.test_config.concurrency}")
        lines.append(f"Iterations:       {config.test_config.iterations}")
        lines.append(f"Timeout:          {config.api_config.timeout}s")
        lines.append(f"Queries:          {len(config.test_config.queries) or 'From file'}")
        lines.append("")

        # Statistics summary
        if self.session.statistics:
            lines.append("TEST STATISTICS")
            lines.append("-" * 40)
            stats = self.session.statistics
            lines.append(f"Total Requests:   {stats.total_requests}")
            lines.append(f"Successful:       {stats.successful_requests}")
            lines.append(f"Failed:           {stats.failed_requests}")
            lines.append(f"Success Rate:      {stats.success_rate:.1f}%")
            lines.append("")

            # TTFT Statistics
            if stats.ttft_stats:
                lines.append("TTFT PERFORMANCE STATISTICS")
                lines.append("-" * 40)
                ttft = stats.ttft_stats
                lines.append(f"Average TTFT:     {format_number(ttft.mean_ms)}ms")
                lines.append(f"Median TTFT:      {format_number(ttft.median_ms)}ms")
                lines.append(f"Min TTFT:         {format_number(ttft.min_ms)}ms")
                lines.append(f"Max TTFT:         {format_number(ttft.max_ms)}ms")
                lines.append(f"Std Deviation:    {format_number(ttft.std_dev_ms)}ms")
                lines.append(f"95th Percentile:   {format_number(ttft.percentile_95_ms)}ms")
                lines.append(f"99th Percentile:   {format_number(ttft.percentile_99_ms)}ms")
                lines.append(f"Data Points:       {ttft.data_points}")
                lines.append("")

            # Throughput Statistics
            if stats.throughput_stats:
                lines.append("THROUGHPUT STATISTICS")
                lines.append("-" * 40)
                throughput = stats.throughput_stats
                lines.append(f"Requests/Second:  {format_number(throughput.requests_per_second)}")
                lines.append(f"Tokens/Second:    {format_number(throughput.tokens_per_second)}")
                lines.append(f"Total Time:       {format_duration(throughput.total_time_seconds)}")
                lines.append("")

            # Token Statistics
            if stats.token_stats:
                lines.append("TOKEN STATISTICS")
                lines.append("-" * 40)
                tokens = stats.token_stats
                lines.append(f"Average Tokens:   {format_number(tokens.mean)}")
                lines.append(f"Median Tokens:    {format_number(tokens.median)}")
                lines.append(f"Min Tokens:       {tokens.min}")
                lines.append(f"Max Tokens:       {tokens.max}")
                lines.append(f"Total Tokens:      {tokens.total}")
                lines.append("")

        # Performance summary chart
        if self.session.configuration.report_config.include_charts:
            successful_ttfts = [m.ttft_ms for m in self.session.measurements if m.status == "success" and m.ttft_ms is not None]
            failed_count = len([m for m in self.session.measurements if m.status == "error"])

            if successful_ttfts:
                chart = self.chart_generator.generate_performance_summary_chart(successful_ttfts, failed_count)
                lines.append(chart)
                lines.append("")

        # Time series chart
        if self.session.configuration.report_config.include_charts and ChartType.TIME_SERIES in self.session.configuration.report_config.chart_types:
            time_series_data = get_time_series_data(self.session.measurements)
            if time_series_data:
                x_values = [point.get('test_id') for point in time_series_data]
                y_values = [point.get('ttft_ms') for point in time_series_data if point.get('ttft_ms')]

                if y_values:
                    chart_data = [{'x': x, 'y': y} for x, y in zip(x_values, y_values) if y is not None]
                    chart = self.chart_generator.generate_time_series_chart(chart_data, "TTFT Performance Over Time")
                    lines.append(chart)
                    lines.append("")

        # Individual measurement details
        if self.session.measurements:
            lines.append("INDIVIDUAL MEASUREMENTS")
            lines.append("-" * 40)
            lines.append("ID │ Status   │ TTFT (ms) │ Total (ms) │ Tokens │ Query")
            lines.append("-" * 80)

            for measurement in self.session.measurements[:20]:  # Show first 20 measurements
                status = measurement.status[:8]
                ttft = format_number(measurement.ttft_ms) if measurement.ttft_ms else "N/A"
                total = format_number(measurement.total_time_ms)
                tokens = str(measurement.tokens_count)
                query = measurement.query[:40] + "..." if len(measurement.query) > 40 else measurement.query

                lines.append(f"{measurement.test_id:3d} │ {status:<8} │ {ttft:>9} │ {total:>9} │ {tokens:>6} │ {query}")

            if len(self.session.measurements) > 20:
                lines.append(f"... and {len(self.session.measurements) - 20} more measurements")
                lines.append("")

        # Error analysis
        failed_measurements = [m for m in self.session.measurements if m.status == "error"]
        if failed_measurements:
            lines.append("ERROR ANALYSIS")
            lines.append("-" * 40)
            lines.append(f"Total Errors: {len(failed_measurements)}")

            for measurement in failed_measurements[:5]:  # Show first 5 errors
                lines.append(f"  Test {measurement.test_id}: {measurement.error_message}")

            if len(failed_measurements) > 5:
                lines.append(f"  ... and {len(failed_measurements) - 5} more errors")

        # Footer
        lines.append("")
        lines.append("Generated by TTFT Performance Testing Package")
        lines.append(f"https://github.com/your-repo/ttft-performance-test")
        lines.append("")

        return '\n'.join(lines)

    def _generate_html_report_content(self) -> str:
        """Generate content for HTML report."""
        # This is a simplified HTML report with embedded ASCII charts
        text_content = self._generate_text_report_content()

        # Basic HTML wrapper
        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TTFT Performance Test Report</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            line-height: 1.4;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
        }}
        .stats {{
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }}
        .chart {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            white-space: pre;
            font-family: 'Courier New', monospace;
        }}
        .measurement {{
            border-bottom: 1px solid #e1e4e8;
            padding: 8px 0;
        }}
        .error {{
            color: #e74c3c;
            background-color: #fdf2f2;
            padding: 10px;
            border-left: 4px solid #e74c3c;
            margin: 10px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            color: #7f8c8d;
        }}
        pre {{
            white-space: pre-wrap;
            word-wrap: break-word;
        }}
    </style>
</head>
<body>
    <div class="container">
        <pre>{text_content}</pre>
        <div class="footer">
            Generated by TTFT Performance Testing Package
            <br>
            <a href="https://github.com/your-repo/ttft-performance-test">
                https://github.com/your-repo/ttft-performance-test
            </a>
        </div>
    </div>
</body>
</html>
"""

        return html_template

    def generate_report_from_file(self, input_file: str, output_format: ReportFormat, output_file: Optional[str] = None) -> str:
        """Generate report from existing data file.

        Args:
            input_file: Path to input JSON file
            output_format: Output format
            output_file: Optional output file path

        Returns:
            Path to generated report file
        """
        try:
            # Load data from file
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Reconstruct session from data
            session = self._reconstruct_session_from_data(data)

            # Create report generator
            report_gen = ReportGenerator(session, self.options)

            # Generate report
            if output_format == ReportFormat.JSON:
                return report_gen.generate_json_report(os.path.dirname(output_file) if output_file else ".")
            elif output_format == ReportFormat.CSV:
                return report_gen.generate_csv_report(os.path.dirname(output_file) if output_file else ".")
            elif output_format == ReportFormat.TXT:
                return report_gen.generate_text_report(os.path.dirname(output_file) if output_file else ".")
            elif output_format == ReportFormat.HTML:
                return report_gen.generate_html_report(os.path.dirname(output_file) if output_file else ".")
            else:
                raise ReportingError(f"Unsupported output format: {output_format}")

        except Exception as e:
            raise ReportingError(f"Failed to generate report from file: {e}")

    def _reconstruct_session_from_data(self, data: Dict[str, Any]) -> TestSession:
        """Reconstruct TestSession from JSON data."""
        # This is a simplified reconstruction
        # In a real implementation, you'd want to properly reconstruct all objects
        from .models import TestConfiguration, ApiConfiguration, TestParameters, ReportConfiguration
        from .config import ConfigurationManager

        # Reconstruct configuration
        config_manager = ConfigurationManager()
        config = config_manager._parse_config(data['configuration'])

        # Create session
        session = TestSession(
            session_id=data['session_id'],
            configuration=config,
            started_at=datetime.fromisoformat(data['started_at']) if data['started_at'] else None,
            completed_at=datetime.fromisoformat(data['completed_at']) if data['completed_at'] else None
        )

        # Reconstruct measurements
        for meas_data in data.get('measurements', []):
            from .models import TTFTMeasurement
            measurement = TTFTMeasurement(
                test_id=meas_data['test_id'],
                session_id=meas_data['session_id'],
                query=meas_data['query'],
                ttft_ms=meas_data.get('ttft_ms'),
                total_time_ms=meas_data['total_time_ms'],
                http_response_time_ms=meas_data['http_response_time_ms'],
                time_to_first_byte_ms=meas_data.get('time_to_first_byte_ms'),
                tokens_count=meas_data['tokens_count'],
                status=meas_data['status'],
                error_message=meas_data.get('error_message'),
                timestamp=datetime.fromisoformat(meas_data['timestamp'])
            )
            session.add_measurement(measurement)

        return session