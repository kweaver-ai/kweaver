"""
ASCII Chart Generation for TTFT Performance Testing Package

Provides ASCII-based chart generation for performance data visualization,
compatible with terminal output and text reports.
"""

from typing import List, Dict, Any, Tuple, Optional
import math
import logging
from dataclasses import dataclass
from datetime import datetime

from .models import ChartData, ChartType
from .utils import calculate_percentile, create_histogram, format_number

logger = logging.getLogger(__name__)


@dataclass
class ChartOptions:
    """Options for chart generation."""
    width: int = 80
    height: int = 20
    show_grid: bool = True
    show_labels: bool = True
    show_stats: bool = True
    precision: int = 2
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class ASCIIChartGenerator:
    """Generate ASCII charts for performance data visualization."""

    def __init__(self, options: ChartOptions = None):
        """Initialize chart generator.

        Args:
            options: Chart generation options
        """
        self.options = options or ChartOptions()

    def generate_time_series_chart(self, data: List[Dict[str, Any]], title: str = "Time Series") -> str:
        """Generate ASCII time series chart.

        Args:
            data: List of data points with 'x' and 'y' values
            title: Chart title

        Returns:
            ASCII chart as string
        """
        if not data:
            return f"No data available for {title}"

        # Extract x and y values
        x_values = [point.get('x', i) for i, point in enumerate(data)]
        y_values = [point.get('y', 0) for point in data]

        return self._generate_line_chart(x_values, y_values, title, "Time", "Value")

    def generate_histogram_chart(self, histogram_data: Dict[str, float], title: str = "Distribution") -> str:
        """Generate ASCII histogram chart.

        Args:
            histogram_data: Dictionary with bin labels and counts
            title: Chart title

        Returns:
            ASCII chart as string
        """
        if not histogram_data:
            return f"No data available for {title}"

        # Extract labels and values
        labels = list(histogram_data.keys())
        values = list(histogram_data.values())

        return self._generate_bar_chart(labels, values, title, "Range", "Count")

    def generate_scatter_plot(self, data: List[Dict[str, Any]], title: str = "Scatter Plot") -> str:
        """Generate ASCII scatter plot.

        Args:
            data: List of data points with 'x' and 'y' values
            title: Chart title

        Returns:
            ASCII chart as string
        """
        if not data:
            return f"No data available for {title}"

        # Extract x and y values
        x_values = [point.get('x', i) for i, point in enumerate(data)]
        y_values = [point.get('y', 0) for point in data]

        return self._generate_scatter_plot(x_values, y_values, title, "X Value", "Y Value")

    def generate_box_plot(self, values: List[float], title: str = "Box Plot") -> str:
        """Generate ASCII box plot.

        Args:
            values: List of numerical values
            title: Chart title

        Returns:
            ASCII chart as string
        """
        if not values:
            return f"No data available for {title}"

        # Calculate statistics
        sorted_values = sorted(values)
        n = len(sorted_values)

        min_val = sorted_values[0]
        max_val = sorted_values[-1]
        q1 = calculate_percentile(sorted_values, 25)
        median = calculate_percentile(sorted_values, 50)
        q3 = calculate_percentile(sorted_values, 75)

        return self._generate_box_plot(min_val, q1, median, q3, max_val, title, "Value")

    def _generate_line_chart(self, x_values: List[Any], y_values: List[float], title: str, x_label: str, y_label: str) -> str:
        """Generate ASCII line chart."""
        width = self.options.width - 10  # Account for y-axis labels
        height = self.options.height - 5   # Account for x-axis labels and title

        if not y_values:
            return f"No data available for {title}"

        # Scale values to fit chart
        min_y = self.options.min_value if self.options.min_value is not None else min(y_values)
        max_y = self.options.max_value if self.options.max_value is not None else max(y_values)

        if max_y == min_y:
            max_y = min_y + 1

        # Create chart grid
        chart_lines = [[' ' for _ in range(width)] for _ in range(height)]

        # Plot data points
        for i, y in enumerate(y_values):
            if y is not None:
                x_pos = min(int(i * width / len(y_values)), width - 1)
                y_pos = height - 1 - int((y - min_y) * (height - 1) / (max_y - min_y))
                y_pos = max(0, min(height - 1, y_pos))

                # Add character at position
                if 0 <= y_pos < height and 0 <= x_pos < width:
                    chart_lines[y_pos][x_pos] = '•'

        # Generate chart string
        chart_lines = self._add_chart_grid(chart_lines, width, height)
        chart_string = self._chart_to_string(chart_lines, title, x_label, y_label, min_y, max_y)

        return chart_string

    def _generate_bar_chart(self, labels: List[str], values: List[float], title: str, x_label: str, y_label: str) -> str:
        """Generate ASCII bar chart."""
        width = self.options.width - 10
        height = self.options.height - 5

        if not values:
            return f"No data available for {title}"

        # Calculate bar width
        bar_width = max(1, width // len(labels))
        max_value = max(values)

        # Create chart
        chart_lines = [[' ' for _ in range(width)] for _ in range(height)]

        # Draw bars
        for i, (label, value) in enumerate(zip(labels, values)):
            bar_height = int((value / max_value) * (height - 1))
            x_start = i * bar_width
            x_end = min(x_start + bar_width - 1, width - 1)

            for y in range(height - bar_height, height):
                for x in range(x_start, x_end + 1):
                    if 0 <= y < height and 0 <= x < width:
                        chart_lines[y][x] = '█'

        # Generate chart string
        chart_lines = self._add_chart_grid(chart_lines, width, height)
        chart_string = self._bar_chart_to_string(chart_lines, title, x_label, y_label, labels, values, max_value)

        return chart_string

    def _generate_scatter_plot(self, x_values: List[float], y_values: List[float], title: str, x_label: str, y_label: str) -> str:
        """Generate ASCII scatter plot."""
        width = self.options.width - 10
        height = self.options.height - 5

        if not x_values or not y_values:
            return f"No data available for {title}"

        # Scale values
        min_x = min(x_values)
        max_x = max(x_values)
        min_y = min(y_values)
        max_y = max(y_values)

        if max_x == min_x:
            max_x = min_x + 1
        if max_y == min_y:
            max_y = min_y + 1

        # Create chart grid
        chart_lines = [[' ' for _ in range(width)] for _ in range(height)]

        # Plot points
        for x, y in zip(x_values, y_values):
            x_pos = int((x - min_x) * (width - 1) / (max_x - min_x))
            y_pos = height - 1 - int((y - min_y) * (height - 1) / (max_y - min_y))
            y_pos = max(0, min(height - 1, y_pos))
            x_pos = max(0, min(width - 1, x_pos))

            chart_lines[y_pos][x_pos] = '•'

        # Generate chart string
        chart_lines = self._add_chart_grid(chart_lines, width, height)
        chart_string = self._chart_to_string(chart_lines, title, x_label, y_label, min_y, max_y)

        return chart_string

    def _generate_box_plot(self, min_val: float, q1: float, median: float, q3: float, max_val: float, title: str, y_label: str) -> str:
        """Generate ASCII box plot."""
        width = 60
        height = 10

        # Calculate positions
        min_pos = 2
        q1_pos = 18
        median_pos = 30
        q3_pos = 42
        max_pos = 58

        # Create box plot
        chart_lines = [[' ' for _ in range(width)] for _ in range(height)]

        # Draw whiskers
        for y in range(4, 8):
            chart_lines[y][min_pos] = '|'
            chart_lines[y][q1_pos] = '|'
            chart_lines[y][median_pos] = '|'
            chart_lines[y][q3_pos] = '|'
            chart_lines[y][max_pos] = '|'

        # Draw box
        for x in range(q1_pos, q3_pos + 1):
            chart_lines[4][x] = '─'
            chart_lines[6][x] = '─'

        for y in range(4, 7):
            chart_lines[y][q1_pos] = '│'
            chart_lines[y][q3_pos] = '│'

        chart_lines[4][q1_pos] = '┌'
        chart_lines[4][q3_pos] = '┐'
        chart_lines[6][q1_pos] = '└'
        chart_lines[6][q3_pos] = '┘'

        # Draw median
        chart_lines[4][median_pos] = '┬'
        chart_lines[5][median_pos] = '│'
        chart_lines[6][median_pos] = '┴'

        # Draw min/max lines
        chart_lines[5][min_pos] = '├'
        chart_lines[5][max_pos] = '┤'

        # Connect box to whiskers
        for x in range(min_pos + 1, q1_pos):
            chart_lines[5][x] = '─'
        for x in range(q3_pos + 1, max_pos):
            chart_lines[5][x] = '─'

        # Generate chart string
        chart_lines_str = [''.join(row) for row in chart_lines]

        # Add labels and title
        chart_string = []
        chart_string.append(f"{'='*width}=")
        chart_string.append(f"{title:^{width}}")
        chart_string.append(f"{'='*width}=")
        chart_string.append("")

        # Add box plot
        chart_string.extend(chart_lines_str)

        # Add statistics
        chart_string.append("")
        chart_string.append("Statistics:")
        chart_string.append(f"  Min: {format_number(min_val, self.options.precision)}")
        chart_string.append(f"  Q1:  {format_number(q1, self.options.precision)}")
        chart_string.append(f"  Median: {format_number(median, self.options.precision)}")
        chart_string.append(f"  Q3:  {format_number(q3, self.options.precision)}")
        chart_string.append(f"  Max: {format_number(max_val, self.options.precision)}")

        return '\n'.join(chart_string)

    def _add_chart_grid(self, chart_lines: List[List[str]], width: int, height: int) -> List[List[str]]:
        """Add grid lines to chart."""
        if not self.options.show_grid:
            return chart_lines

        # Add horizontal grid lines
        for i in range(0, height, height // 4):
            for j in range(width):
                if chart_lines[i][j] == ' ':
                    chart_lines[i][j] = '·'

        # Add vertical grid lines
        for j in range(0, width, width // 8):
            for i in range(height):
                if chart_lines[i][j] == ' ':
                    chart_lines[i][j] = '·'

        return chart_lines

    def _chart_to_string(self, chart_lines: List[List[str]], title: str, x_label: str, y_label: str, min_y: float, max_y: float) -> str:
        """Convert chart lines to string with labels."""
        width = len(chart_lines[0])
        height = len(chart_lines)

        chart_string = []
        chart_string.append(f"{'='*width}=")
        chart_string.append(f"{title:^{width}}")
        chart_string.append(f"{'='*width}=")
        chart_string.append("")

        # Add chart with y-axis labels
        for i, line in enumerate(chart_lines):
            y_value = max_y - (max_y - min_y) * i / (height - 1)
            y_label = f"{format_number(y_value, self.options.precision):>8}" if self.options.show_labels and i % 2 == 0 else "        "
            chart_string.append(f"{y_label}│{line}")

        # Add x-axis
        chart_string.append(f"        └{'─'*(width-1)}")

        # Add x-axis label
        if self.options.show_labels:
            chart_string.append(f"{'':>10}{x_label:^{width-1}}")

        return '\n'.join(chart_string)

    def _bar_chart_to_string(self, chart_lines: List[List[str]], title: str, x_label: str, y_label: str, labels: List[str], values: List[float], max_value: float) -> str:
        """Convert bar chart to string with labels."""
        width = len(chart_lines[0])
        height = len(chart_lines)

        chart_string = []
        chart_string.append(f"{'='*width}=")
        chart_string.append(f"{title:^{width}}")
        chart_string.append(f"{'='*width}=")
        chart_string.append("")

        # Add chart with y-axis labels
        for i, line in enumerate(chart_lines):
            y_value = max_value * (height - i) / (height - 1)
            y_label = f"{format_number(y_value, self.options.precision):>8}" if self.options.show_labels and i % 2 == 0 else "        "
            chart_string.append(f"{y_label}│{line}")

        # Add x-axis
        chart_string.append(f"        └{'─'*(width-1)}")

        # Add x-axis labels (bar labels)
        if self.options.show_labels:
            bar_width = max(1, width // len(labels))
            x_labels = ""
            for i, label in enumerate(labels):
                label_pos = i * bar_width + bar_width // 2
                x_labels += f"{'':>10}{label:^{bar_width}}"

            chart_string.append(x_labels)

        # Add x-axis label
        if self.options.show_labels:
            chart_string.append(f"{'':>10}{x_label:^{width-1}}")

        return '\n'.join(chart_string)

    def generate_performance_summary_chart(self, successful_measurements: List[float], failed_count: int) -> str:
        """Generate performance summary chart."""
        if not successful_measurements:
            return "No successful measurements for performance summary"

        # Calculate statistics
        min_val = min(successful_measurements)
        max_val = max(successful_measurements)
        avg_val = sum(successful_measurements) / len(successful_measurements)
        median_val = sorted(successful_measurements)[len(successful_measurements) // 2]

        # Create simple text-based summary
        summary = []
        summary.append("=" * 60)
        summary.append("PERFORMANCE SUMMARY")
        summary.append("=" * 60)
        summary.append(f"Total Requests:    {len(successful_measurements) + failed_count}")
        summary.append(f"Successful:         {len(successful_measurements)}")
        summary.append(f"Failed:             {failed_count}")
        summary.append(f"Success Rate:        {len(successful_measurements) / (len(successful_measurements) + failed_count) * 100:.1f}%")
        summary.append("-" * 60)
        summary.append("TTFT Statistics (ms):")
        summary.append(f"  Average:           {avg_val:.2f}")
        summary.append(f"  Median:            {median_val:.2f}")
        summary.append(f"  Min:               {min_val:.2f}")
        summary.append(f"  Max:               {max_val:.2f}")
        summary.append(f"  Range:             {max_val - min_val:.2f}")

        # Create simple ASCII visualization
        if len(successful_measurements) >= 5:
            summary.append("")
            summary.append("Distribution Visualization:")
            summary.append(self._create_simple_distribution(successful_measurements))

        return '\n'.join(summary)

    def _create_simple_distribution(self, values: List[float]) -> str:
        """Create simple ASCII distribution."""
        if not values:
            return ""

        # Create bins
        min_val = min(values)
        max_val = max(values)
        bin_count = 10
        bin_size = (max_val - min_val) / bin_count
        bins = [0] * bin_count

        # Count values in each bin
        for val in values:
            bin_index = min(int((val - min_val) / bin_size), bin_count - 1)
            bins[bin_index] += 1

        # Find max count for scaling
        max_count = max(bins)
        if max_count == 0:
            return ""

        # Create ASCII bars
        max_bar_width = 40
        lines = []
        lines.append(f"{'Range':<15} │ {'Count':<6} │ Distribution")
        lines.append("-" * 40)

        for i, count in enumerate(bins):
            if count > 0:
                bin_start = min_val + i * bin_size
                bin_end = min_val + (i + 1) * bin_size
                range_label = f"{format_number(bin_start, 1)}-{format_number(bin_end, 1)}"
                bar_width = int((count / max_count) * max_bar_width)
                bar = '█' * bar_width

                lines.append(f"{range_label:<15} │ {count:<6} │ {bar}")

        return '\n'.join(lines)