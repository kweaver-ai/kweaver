import unittest
from unittest.mock import patch

from app.driven.ad.intentpool_service import intentpool_service
from test import MockSession
from test.driven_test import myAssertRaises


class TestIntentpoolService(unittest.IsolatedAsyncioTestCase):
    async def test_load_model_success(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, [])):
            result = await intentpool_service.load_model("intentpool_id")
            self.assertEqual(result, [])

    async def test_load_model_fail(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(500, [])):
            await myAssertRaises(
                Exception, intentpool_service.load_model, "intentpool_id"
            )

    async def test_test_model_success(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, [])):
            result = await intentpool_service.test_model("intentpool_id", "query_text")
            self.assertEqual(result, [])

    async def test_test_model_fail(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(500, [])):
            await myAssertRaises(
                Exception, intentpool_service.test_model, "intentpool_id", "query_text"
            )


if __name__ == "__main__":
    unittest.main()
