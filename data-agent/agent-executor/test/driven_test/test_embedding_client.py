import unittest
from unittest.mock import patch

from app.driven.external.embedding_client import EmbeddingClient
from test import MockSession
from test.driven_test import myAssertRaises


class TestEmbeddingClient(unittest.IsolatedAsyncioTestCase):
    async def test_ado_embedding_success(self):
        embedding_client = EmbeddingClient()
        embedding_client.embedding_url = "http://XXX:8316/v1/embeddings"
        with patch("aiohttp.ClientSession", return_value=MockSession(200, [])):
            result = await embedding_client.ado_embedding("word")
            self.assertEqual(result, [])

    async def test_ado_embedding_invalid_url(self):
        embedding_client_invalid = EmbeddingClient()
        embedding_client_invalid.embedding_url = ""
        await myAssertRaises(
            Exception, embedding_client_invalid.ado_embedding, *("word",)
        )

    async def test_ado_embedding_fail(self):
        embedding_client = EmbeddingClient()
        embedding_client.embedding_url = "http://XXX:8316/v1/embeddings"
        with patch("aiohttp.ClientSession", return_value=MockSession(500, [])):
            await myAssertRaises(Exception, embedding_client.ado_embedding, *("word",))


if __name__ == "__main__":
    unittest.main()
