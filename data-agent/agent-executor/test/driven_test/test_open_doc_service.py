import unittest
from unittest.mock import patch

from app.driven.anyshare.open_doc_service import OpenDocService
from test import MockSession, MockAsyncResponse
from test.driven_test import myAssertRaises


class TestOpenDocService(unittest.IsolatedAsyncioTestCase):
    async def test_get_full_text_success(self):
        open_doc_service = OpenDocService("address", "port")
        mock_res1 = MockAsyncResponse(
            200,
            {
                "doc_id": "525F15FAA5A14428B43D40DC9FFD5E23",
                "version": "897981BF180B4C419D6A49E0C05F0350",
                "status": "completed",
                "url": "https://XXX:443/Miachen/0606f1b1-78d9-4828-9ac2-5aedc032e90c/897981BF180B4C419D6A49E0C05F0350/sub/66e9f87602d31d3e70618182f246325c?AWSAccessKeyId=Miachen&Expires=1726881780&Signature=blygHGniqQ14%2fj1oczctSdLxMJA%3d",
            },
        )
        mock_res2 = MockAsyncResponse(200, "text")
        with patch(
            "aiohttp.ClientSession",
            return_value=MockSession(side_effect=[mock_res1, mock_res2]),
        ):
            result = await open_doc_service.get_full_text("doc_id")
            self.assertEqual(result, "text")

    async def test_get_full_text_fail1(self):
        open_doc_service = OpenDocService("address", "port")
        mock_res1 = MockAsyncResponse(500, {})
        mock_res2 = MockAsyncResponse(200, "text")
        with patch(
            "aiohttp.ClientSession",
            return_value=MockSession(side_effect=[mock_res1, mock_res2]),
        ):
            await myAssertRaises(Exception, open_doc_service.get_full_text, "doc_id")
            # result = await open_doc_service.get_full_text('doc_id')
            # self.assertIn('error', result)

    async def test_get_full_text_fail2(self):
        open_doc_service = OpenDocService("address", "port")
        mock_res1 = MockAsyncResponse(
            200,
            {
                "doc_id": "525F15FAA5A14428B43D40DC9FFD5E23",
                "version": "897981BF180B4C419D6A49E0C05F0350",
                "status": "",
                "url": "https://XXX:443/Miachen/0606f1b1-78d9-4828-9ac2-5aedc032e90c/897981BF180B4C419D6A49E0C05F0350/sub/66e9f87602d31d3e70618182f246325c?AWSAccessKeyId=Miachen&Expires=1726881780&Signature=blygHGniqQ14%2fj1oczctSdLxMJA%3d",
            },
        )
        mock_res2 = MockAsyncResponse(200, "text")
        with patch(
            "aiohttp.ClientSession",
            return_value=MockSession(side_effect=[mock_res1, mock_res2]),
        ):
            await myAssertRaises(Exception, open_doc_service.get_full_text, "doc_id")
            # result = await open_doc_service.get_full_text('doc_id')
            # self.assertIn('error', result)

    async def test_get_full_text_fail3(self):
        open_doc_service = OpenDocService("address", "port")
        mock_res1 = MockAsyncResponse(
            200,
            {
                "doc_id": "525F15FAA5A14428B43D40DC9FFD5E23",
                "version": "897981BF180B4C419D6A49E0C05F0350",
                "status": "completed",
                "url": "https://XXX:443/Miachen/0606f1b1-78d9-4828-9ac2-5aedc032e90c/897981BF180B4C419D6A49E0C05F0350/sub/66e9f87602d31d3e70618182f246325c?AWSAccessKeyId=Miachen&Expires=1726881780&Signature=blygHGniqQ14%2fj1oczctSdLxMJA%3d",
            },
        )
        mock_res2 = MockAsyncResponse(500, "text")
        with patch(
            "aiohttp.ClientSession",
            return_value=MockSession(side_effect=[mock_res1, mock_res2]),
        ):
            await myAssertRaises(Exception, open_doc_service.get_full_text, "doc_id")
            # result = await open_doc_service.get_full_text('doc_id')
            # self.assertIn('error', result)


if __name__ == "__main__":
    unittest.main()
