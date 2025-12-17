"""
Core HTTP Client and Test Execution Logic for TTFT Performance Testing Package

Handles HTTP requests, SSE stream processing, TTFT measurement, and test orchestration.
"""

import asyncio
import json
import logging
import re
import time
import urllib.parse
from typing import Dict, List, Optional, Any, Tuple, AsyncGenerator
from datetime import datetime, timezone
from dataclasses import replace
import socket
import ssl

from .models import (
    TTFTMeasurement, TestSession, TestConfiguration,
    ApiConfiguration, TestParameters, TestStatus
)
from .config import ConfigurationManager
from .utils import (
    get_output_filename, validate_output_directory,
    format_duration, chunk_list, retry_async
)
from .errors import (
    NetworkError, APIError, TimeoutError, ConfigurationError,
    ValidationError, async_retry, ErrorHandler
)

logger = logging.getLogger(__name__)


class HTTPClient:
    """HTTP client with SSE support for API communication."""

    def __init__(self, api_config: ApiConfiguration):
        """Initialize HTTP client.

        Args:
            api_config: API configuration
        """
        self.api_config = api_config
        self.base_url = api_config.base_url.rstrip('/')
        self.endpoint = api_config.endpoint.lstrip('/')
        self.headers = api_config.headers.copy()
        self.timeout = api_config.timeout

        # Ensure content-type is set
        if 'Content-Type' not in self.headers:
            self.headers['Content-Type'] = 'application/json'

        # Add common headers
        self.headers.setdefault('User-Agent', 'TTFT-Performance-Tester/1.0.0')

        logger.debug(f"HTTP client initialized for: {self.base_url}/{self.endpoint}")

    @async_retry(max_attempts=3, delay=1.0)
    async def send_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send HTTP request and return response.

        Args:
            payload: Request payload

        Returns:
            Response data

        Raises:
            NetworkError: Network-related errors
            APIError: API-related errors
            TimeoutError: Timeout errors
        """
        try:
            # Try to use aiohttp first, fallback to standard library
            try:
                return await self._send_request_aiohttp(payload)
            except ImportError:
                logger.info("aiohttp not available, using standard library")
                return await self._send_request_standard(payload)

        except Exception as e:
            if "timeout" in str(e).lower():
                raise TimeoutError(f"Request timeout after {self.timeout} seconds", timeout_value=self.timeout)
            elif "connection" in str(e).lower():
                raise NetworkError(f"Connection error: {e}", url=f"{self.base_url}/{self.endpoint}")
            else:
                raise APIError(f"Request failed: {e}")

    async def _send_request_aiohttp(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send HTTP request using aiohttp."""
        import aiohttp
        import aiohttp.client_exceptions

        full_url = f"{self.base_url}/{self.endpoint}"
        start_time = time.time()

        try:
            async with aiohttp.ClientSession(
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                connector=aiohttp.TCPConnector(limit=None, ttl_dns_cache=300)
            ) as session:

                async with session.post(
                    full_url,
                    json=payload,
                    headers=self.headers
                ) as response:

                    response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

                    if response.status >= 400:
                        raise APIError(
                            f"HTTP {response.status}: {await response.text()}",
                            status_code=response.status
                        )

                    # Check content type to determine how to parse response
                    content_type = response.headers.get('Content-Type', '')

                    if 'application/json' in content_type:
                        response_data = await response.json()
                    elif 'text/event-stream' in content_type:
                        # For SSE streams, collect all data
                        response_text = await response.text()
                        response_data = {'raw_response': response_text, 'stream_type': 'sse'}
                    else:
                        # Fallback to text for other content types
                        response_text = await response.text()
                        try:
                            response_data = json.loads(response_text)
                        except json.JSONDecodeError:
                            response_data = {'raw_response': response_text, 'content_type': content_type}
                    return {
                        'data': response_data,
                        'response_time_ms': response_time,
                        'status_code': response.status,
                        'headers': dict(response.headers)
                    }

        except aiohttp.client_exceptions.ClientConnectorError as e:
            raise NetworkError(f"Connection failed: {e}", url=full_url)
        except aiohttp.client_exceptions.ServerTimeoutError as e:
            raise TimeoutError(f"Server timeout: {e}", timeout_value=self.timeout)
        except aiohttp.client_exceptions.ClientResponseError as e:
            raise APIError(f"Response error: {e}")

    async def _send_request_standard(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send HTTP request using standard library."""
        from http.client import HTTPConnection, HTTPSConnection
        import urllib.parse

        # Parse URL
        parsed_url = urllib.parse.urlparse(f"{self.base_url}/{self.endpoint}")
        use_ssl = parsed_url.scheme == 'https'

        # Create connection
        if use_ssl:
            conn = HTTPSConnection(parsed_url.hostname, parsed_url.port or 443, timeout=self.timeout)
        else:
            conn = HTTPConnection(parsed_url.hostname, parsed_url.port or 80, timeout=self.timeout)

        try:
            start_time = time.time()

            # Prepare request
            json_payload = json.dumps(payload)
            request_path = parsed_url.path + ('?' + parsed_url.query if parsed_url.query else '')

            # Send request
            conn.request(
                "POST",
                request_path,
                body=json_payload,
                headers=self.headers
            )

            # Get response
            response = conn.getresponse()
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

            # Read response
            response_body = response.read().decode('utf-8')

            if response.status >= 400:
                raise APIError(f"HTTP {response.status}: {response_body}", status_code=response.status)

            # Parse JSON response
            try:
                response_data = json.loads(response_body)
            except json.JSONDecodeError:
                response_data = {'raw_response': response_body}

            return {
                'data': response_data,
                'response_time_ms': response_time,
                'status_code': response.status,
                'headers': dict(response.getheaders())
            }

        finally:
            conn.close()

    async def send_request_stream(self, payload: Dict[str, Any]) -> AsyncGenerator[Tuple[str, float], None]:
        """Send HTTP request with SSE stream support.

        Args:
            payload: Request payload

        Yields:
            Tuple of (chunk_type, timestamp) where chunk_type is:
            - 'first_byte': First byte received
            - 'first_token': First token received
            - 'chunk': Regular data chunk
            - 'complete': Response complete

        Raises:
            NetworkError: Network-related errors
            APIError: API-related errors
            TimeoutError: Timeout errors
        """
        try:
            # Try to use aiohttp first, fallback to standard library
            try:
                async for chunk_type, timestamp in self._send_request_stream_aiohttp(payload):
                    yield chunk_type, timestamp
            except ImportError:
                logger.info("aiohttp not available, using standard library for streaming")
                async for chunk_type, timestamp in self._send_request_stream_standard(payload):
                    yield chunk_type, timestamp

        except Exception as e:
            if "timeout" in str(e).lower():
                raise TimeoutError(f"Stream timeout after {self.timeout} seconds", timeout_value=self.timeout)
            elif "connection" in str(e).lower():
                raise NetworkError(f"Stream connection error: {e}", url=f"{self.base_url}/{self.endpoint}")
            else:
                raise APIError(f"Stream request failed: {e}")

    async def _send_request_stream_aiohttp(self, payload: Dict[str, Any]) -> AsyncGenerator[Tuple[str, float], None]:
        """Send streaming HTTP request using aiohttp."""
        import aiohttp
        import aiohttp.client_exceptions

        full_url = f"{self.base_url}/{self.endpoint}"
        start_time = time.time()
        first_byte_received = False
        first_token_received = False

        try:
            async with aiohttp.ClientSession(
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as session:

                async with session.post(
                    full_url,
                    json=payload,
                    headers={**self.headers, 'Accept': 'text/event-stream'}
                ) as response:

                    if response.status >= 400:
                        raise APIError(f"HTTP {response.status}: {await response.text()}", status_code=response.status)

                    yield 'request_start', start_time

                    async for chunk in response.content:
                        chunk_time = time.time()

                        if not first_byte_received:
                            yield 'first_byte', chunk_time
                            first_byte_received = True

                        # Try to decode chunk as text for token detection
                        try:
                            text_chunk = chunk.decode('utf-8')
                            if not first_token_received and text_chunk.strip():
                                yield 'first_token', chunk_time
                                first_token_received = True
                        except UnicodeDecodeError:
                            pass

                        yield 'chunk', chunk_time

                    yield 'complete', time.time()

        except aiohttp.client_exceptions.ClientConnectorError as e:
            raise NetworkError(f"Stream connection failed: {e}", url=full_url)
        except aiohttp.client_exceptions.ServerTimeoutError as e:
            raise TimeoutError(f"Stream timeout: {e}", timeout_value=self.timeout)

    async def _send_request_stream_standard(self, payload: Dict[str, Any]) -> AsyncGenerator[Tuple[str, float], None]:
        """Send streaming HTTP request using standard library with SSE support."""
        import asyncio
        import urllib.request
        import urllib.error

        start_time = time.time()

        def run_sync_request():
            """Run the synchronous HTTP request in a separate thread."""
            results = []

            try:
                # Prepare request
                json_payload = json.dumps(payload).encode('utf-8')
                parsed_url = urllib.parse.urlparse(self.base_url + self.endpoint)

                # Create request with SSE headers
                req = urllib.request.Request(
                    parsed_url.geturl(),
                    data=json_payload,
                    headers={**self.headers, 'Accept': 'text/event-stream'},
                    method='POST'
                )

                results.append(('request_start', start_time))

                # Send request and process SSE stream
                response = urllib.request.urlopen(req, timeout=self.timeout)

                first_byte_received = False
                first_token_received = False
                buffer = ""
                request_start_time = time.time()

                while True:
                    chunk = response.read(1024)  # Read in chunks
                    if not chunk:
                        break

                    chunk_time = time.time()

                    if not first_byte_received:
                        results.append(('first_byte', chunk_time))
                        first_byte_received = True

                    # Decode and process SSE data
                    try:
                        text_chunk = chunk.decode('utf-8')
                        buffer += text_chunk

                        # Process SSE format: data: ...\n\n
                        while 'data: ' in buffer and '\n\n' in buffer:
                            data_start = buffer.find('data: ') + 6
                            data_end = buffer.find('\n\n', data_start)
                            if data_end > data_start:
                                data_line = buffer[data_start:data_end].strip()
                                buffer = buffer[data_end + 2:]

                                # Check if this contains actual content (not just ping/heartbeat)
                                if data_line and not first_token_received:
                                    results.append(('first_token', chunk_time))
                                    first_token_received = True
                                    break

                    except UnicodeDecodeError:
                        pass

                    results.append(('chunk', chunk_time))

                results.append(('complete', time.time()))

            except urllib.error.HTTPError as e:
                raise APIError(f"HTTP {e.code}: {e.read().decode('utf-8')}", status_code=e.code)
            except urllib.error.URLError as e:
                raise NetworkError(f"Connection failed: {e}", url=parsed_url.geturl())
            except Exception as e:
                if isinstance(e, (APIError, NetworkError, TimeoutError)):
                    raise
                raise NetworkError(f"Stream connection failed: {e}", url=parsed_url.geturl())

            return results

        try:
            # Run the synchronous request in a thread pool
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, run_sync_request)

            # Yield results in order
            for event_type, event_time in results:
                yield event_type, event_time

        except Exception as e:
            if isinstance(e, (APIError, NetworkError, TimeoutError)):
                raise
            raise NetworkError(f"Stream connection failed: {e}", url=self.base_url + self.endpoint)


class TTFTTester:
    """Main TTFT performance testing engine."""

    def __init__(self, config: TestConfiguration):
        """Initialize TTFT tester.

        Args:
            config: Test configuration
        """
        self.config = config
        self.http_client = HTTPClient(config.api_config)
        self.error_handler = ErrorHandler(fail_fast=False, max_retries=config.test_config.max_failures)
        self.session = TestSession(
            session_id=config.session_id,
            configuration=config,
            started_at=datetime.now(timezone.utc),
            status=TestStatus.RUNNING
        )

    @async_retry(max_attempts=2, delay=1.0)
    async def measure_single_ttft(self, query: str, test_id: int) -> TTFTMeasurement:
        """Measure TTFT for a single query.

        Args:
            query: Test query
            test_id: Test identifier

        Returns:
            TTFTMeasurement with timing data
        """
        start_time = time.time()
        try:
            logger.debug(f"Starting measurement {test_id}: {query[:50]}...")

            # Prepare payload
            payload = self._prepare_payload(query)

            try:
                # Try streaming request first
                measurement = await self._measure_ttft_streaming(payload, query, test_id, start_time)
            except Exception as streaming_error:
                logger.debug(f"Streaming failed, falling back to non-streaming: {streaming_error}")
                measurement = await self._measure_ttft_non_streaming(payload, query, test_id, start_time)

            # Calculate total time
            measurement.total_time_ms = (time.time() - start_time) * 1000

            logger.debug(f"Measurement {test_id} completed: TTFT={measurement.ttft_ms}ms, "
                        f"Total={measurement.total_time_ms}ms, Tokens={measurement.tokens_count}")

            return measurement

        except Exception as e:
            # Handle measurement failure
            error_time = time.time()
            return TTFTMeasurement(
                test_id=test_id,
                session_id=self.session.session_id,
                query=query,
                ttft_ms=None,
                total_time_ms=(error_time - start_time) * 1000,
                http_response_time_ms=0,
                time_to_first_byte_ms=None,
                tokens_count=0,
                status="error",
                error_message=str(e),
                timestamp=datetime.now(timezone.utc)
            )

    async def _measure_ttft_streaming(self, payload: Dict[str, Any], query: str, test_id: int, start_time: float) -> TTFTMeasurement:
        """Measure TTFT using streaming request."""
        first_byte_time = None
        first_token_time = None
        complete_time = None

        token_count = 0
        request_start_time = None

        async for chunk_type, chunk_time in self.http_client.send_request_stream(payload):
            if chunk_type == 'request_start':
                request_start_time = chunk_time
                logger.info(f"Request started at: {chunk_time}")
            elif chunk_type == 'first_byte':
                first_byte_time = chunk_time
                logger.info(f"First byte received at: {chunk_time}, elapsed: {(chunk_time - request_start_time) * 1000:.2f}ms")
            elif chunk_type == 'first_token':
                first_token_time = chunk_time
                logger.info(f"First token received at: {chunk_time}, elapsed: {(chunk_time - request_start_time) * 1000:.2f}ms")
            elif chunk_type == 'chunk':
                # This would need proper token counting in real implementation
                token_count += 1
            elif chunk_type == 'complete':
                complete_time = chunk_time
                logger.info(f"Request completed at: {chunk_time}, total elapsed: {(chunk_time - request_start_time) * 1000:.2f}ms")

        # Use the earliest available start time
        actual_start_time = request_start_time if request_start_time else start_time

        # Calculate TTFT (Time to First Token)
        if first_token_time:
            ttft_ms = (first_token_time - actual_start_time) * 1000
        elif first_byte_time:
            ttft_ms = (first_byte_time - actual_start_time) * 1000
        else:
            ttft_ms = (complete_time - actual_start_time) * 1000

        # Calculate time to first byte
        time_to_first_byte_ms = (first_byte_time - actual_start_time) * 1000 if first_byte_time else None

        logger.info(f"TTFT calculation: {ttft_ms:.2f}ms, Total time: {(complete_time - actual_start_time) * 1000:.2f}ms")

        return TTFTMeasurement(
            test_id=test_id,
            session_id=self.session.session_id,
            query=query,
            ttft_ms=ttft_ms,
            total_time_ms=(complete_time - actual_start_time) * 1000 if complete_time else 0,
            http_response_time_ms=0,  # Would be calculated from actual HTTP response time
            time_to_first_byte_ms=time_to_first_byte_ms,
            tokens_count=token_count,
            status="success",
            error_message=None,
            timestamp=datetime.now(timezone.utc)
        )

    async def _measure_ttft_non_streaming(self, payload: Dict[str, Any], query: str, test_id: int, start_time: float) -> TTFTMeasurement:
        """Measure TTFT using non-streaming request."""
        response = await self.http_client.send_request(payload)

        # For non-streaming, we can only estimate TTFT from response time
        # This is a simplified approximation
        ttft_ms = response['response_time_ms'] * 0.3  # Assume 30% of response time is TTFT

        # Extract token count if available
        token_count = self._extract_token_count(response['data'])

        return TTFTMeasurement(
            test_id=test_id,
            session_id=self.session.session_id,
            query=query,
            ttft_ms=ttft_ms,
            total_time_ms=response['response_time_ms'],
            http_response_time_ms=response['response_time_ms'],
            time_to_first_byte_ms=ttft_ms * 0.8,  # Approximation
            tokens_count=token_count,
            status="success",
            error_message=None,
            timestamp=datetime.now(timezone.utc)
        )

    async def run_concurrent_test(self, queries: List[str]) -> TestSession:
        """Run concurrent TTFT performance test.

        Args:
            queries: List of queries to test

        Returns:
            TestSession with all measurements
        """
        iterations = self.config.test_config.iterations
        logger.info(f"Starting concurrent test with {len(queries)} queries and {iterations} iterations each")

        self.session.status = TestStatus.RUNNING

        try:
            # Prepare all queries with iterations
            query_tasks = []
            test_id = 0

            # Create tasks for each query and each iteration
            for query in queries:
                for iteration in range(iterations):
                    task = self.measure_single_ttft(query, test_id)
                    query_tasks.append(task)
                    test_id += 1

            logger.info(f"Created {len(query_tasks)} total tasks ({len(queries)} queries × {iterations} iterations)")

            # Execute tasks with concurrency control
            semaphore = asyncio.Semaphore(self.config.test_config.concurrency)

            async def run_with_semaphore(task):
                async with semaphore:
                    return await task

            # Wait for all tasks to complete
            results = await asyncio.gather(*[run_with_semaphore(task) for task in query_tasks])

            # Add measurements to session
            for measurement in results:
                self.session.add_measurement(measurement)

            logger.info(f"Concurrent test completed with {len(self.session.measurements)} measurements")

        except Exception as e:
            logger.error(f"Concurrent test failed: {e}")
            self.session.status = TestStatus.FAILED
            raise e

        return self.session

    async def run_sequential_test(self, queries: List[str]) -> TestSession:
        """Run sequential TTFT performance test.

        Args:
            queries: List of queries to test

        Returns:
            Session with all measurements
        """
        iterations = self.config.test_config.iterations
        logger.info(f"Starting sequential test with {len(queries)} queries and {iterations} iterations each")

        self.session.status = TestStatus.RUNNING

        try:
            test_id = 0
            for query in queries:
                for iteration in range(iterations):
                    if test_id > 0 and self.config.test_config.delay_between_requests > 0:
                        await asyncio.sleep(self.config.test_config.delay_between_requests)

                    measurement = await self.measure_single_ttft(query, test_id)
                    self.session.add_measurement(measurement)
                    test_id += 1

                    # Check failure threshold
                    failed_count = len([m for m in self.session.measurements if m.status == "error"])
                    if (self.config.test_config.max_failures > 0 and
                        failed_count >= self.config.test_config.max_failures):
                        logger.warning(f"Maximum failures ({self.config.test_config.max_failures}) reached, stopping test")
                        break

            logger.info(f"Sequential test completed with {len(self.session.measurements)} measurements")

        except Exception as e:
            logger.error(f"Sequential test failed: {e}")
            self.session.status = TestStatus.FAILED
            raise e

        return self.session

    def _prepare_payload(self, query: str) -> Dict[str, Any]:
        """Prepare request payload with query.

        Args:
            query: User query to include in payload

        Returns:
            Prepared payload dictionary
        """
        try:
            # Start with base payload template
            if self.config.api_config.payload_overrides:
                payload = self.config.api_config.payload_overrides.copy()
            else:
                payload = {}

            # Load payload template if specified
            template_data = None
            if self.config.api_config.payload_template:
                config_manager = ConfigurationManager()
                template_data = config_manager.resolve_payload_template(self.config)
                if template_data:
                    payload.update(template_data)

            # Replace query placeholder in payload
            payload = self._replace_query_in_payload(payload, query)

            logger.debug(f"Prepared payload: {json.dumps(payload, indent=2)[:200]}...")
            return payload

        except Exception as e:
            raise ConfigurationError(f"Failed to prepare payload: {e}")

    def _replace_query_in_payload(self, payload: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Replace query placeholder in payload with robust handling for agent_input.query."""

        # Strategy 1: Direct replacement in agent_input.query field
        if isinstance(payload, dict):
            # Handle agent_input.query specifically
            if 'agent_input' in payload and isinstance(payload['agent_input'], dict):
                agent_input = payload['agent_input']
                if 'query' in agent_input:
                    # Replace the query value directly
                    agent_input['query'] = query
                    logger.debug(f"Replaced agent_input.query with: {query[:50]}...")

            # Strategy 2: Recursive search and replace for common patterns
            payload = self._recursive_query_replace(payload, query)

        # Strategy 3: String-based replacement for complex cases
        payload_str = json.dumps(payload)

        # More precise patterns for query replacement
        patterns = [
            r'{{\s*query\s*}}',                    # Template-style: {{ query }}
            r'\$query\b',                          # Variable-style: $query
            r'"query":\s*"\$query"',               # JSON field with $query
            r'"query":\s*"{{\s*query\s*}}"',       # JSON field with template
        ]

        original_payload_str = payload_str
        for pattern in patterns:
            try:
                # For JSON field patterns, we need to be more careful
                if pattern.startswith('"query":'):
                    # Replace the entire value part after "query":
                    replacement = f'"query": {json.dumps(query)}'
                    payload_str = re.sub(pattern, replacement, payload_str)
                else:
                    # For simple placeholders, replace with quoted query
                    payload_str = re.sub(pattern, json.dumps(query), payload_str)
            except re.error:
                logger.warning(f"Regex pattern failed: {pattern}")
                continue

        # Only convert back if string replacement actually changed something
        if payload_str != original_payload_str:
            try:
                payload = json.loads(payload_str)
                logger.debug("Applied string-based query replacement")
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse payload after string replacement: {e}")

        return payload

    def _recursive_query_replace(self, obj: Any, query: str) -> Any:
        """Recursively search and replace query placeholders in nested structures."""
        if isinstance(obj, dict):
            new_dict = {}
            for key, value in obj.items():
                if key == 'query' and isinstance(value, str):
                    # Replace query field values
                    new_dict[key] = query
                elif isinstance(value, (dict, list)):
                    new_dict[key] = self._recursive_query_replace(value, query)
                else:
                    new_dict[key] = value
            return new_dict
        elif isinstance(obj, list):
            return [self._recursive_query_replace(item, query) for item in obj]
        else:
            return obj

    def _extract_token_count(self, response_data: Dict[str, Any]) -> int:
        """Extract token count from API response."""
        # Common token count field names
        token_fields = [
            'token_count', 'tokens', 'token_usage', 'usage.total_tokens',
            'prompt_tokens', 'completion_tokens', 'total_tokens'
        ]

        for field in token_fields:
            if field in response_data:
                if isinstance(response_data[field], dict):
                    # Handle nested token counts
                    for subfield in ['total', 'count', 'value']:
                        if subfield in response_data[field]:
                            return int(response_data[field][subfield])
                else:
                    try:
                        return int(response_data[field])
                    except (ValueError, TypeError):
                        continue

        # Try to estimate from text length
        if 'text' in response_data or 'content' in response_data:
            text = response_data.get('text', '') or response_data.get('content', '')
            # Rough estimate: 1 token ≈ 4 characters
            return len(text) // 4

        return 0

    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary of current session."""
        if not self.session.measurements:
            return {"total": 0, "successful": 0, "failed": 0}

        successful = len([m for m in self.session.measurements if m.status == "success"])
        failed = len([m for m in self.session.measurements if m.status == "error"])

        return {
            "total": len(self.session.measurements),
            "successful": successful,
            "failed": failed,
            "success_rate": (successful / len(self.session.measurements)) * 100 if self.session.measurements else 0
        }

    async def validate_api_connectivity(self) -> bool:
        """Validate API connectivity.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            test_payload = {"test": "connectivity_check", "query": "ping"}
            await self.http_client.send_request(test_payload)
            logger.info("API connectivity validation successful")
            return True
        except Exception as e:
            logger.error(f"API connectivity validation failed: {e}")
            return False