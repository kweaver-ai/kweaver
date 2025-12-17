import unittest

from app.utils.sserender import SSE


class TestSSE(unittest.TestCase):
    def setUp(self) -> None:
        print("section start")

    def tearDown(self) -> None:
        print("section end")

    def test_sse_render(self) -> None:
        instance = SSE(
            ID="1", event="test", data="test_data", comment="test_comment", retry=12345
        )
        res = instance.render()
        assert ": test_comment" in res
        assert "id: 1" in res
        assert "event: test" in res
        assert "data: test_data" in res
        assert "retry: 12345" in res

    def test_sse_render_to_bytes(self) -> None:
        instance = SSE(
            ID="1", event="test", data="test_data", comment="test_comment", retry=12345
        )
        res = instance.render(with_encode=True).decode("utf-8")
        assert ": test_comment" in res
        assert "id: 1" in res
        assert "event: test" in res
        assert "data: test_data" in res
        assert "retry: 12345" in res

    def test_sse_render_empty(self) -> None:
        with self.assertRaisesRegex(ValueError, r"at least one argument") as a:
            SSE()

    def test_sse_render_retry_not_int(self) -> None:
        with self.assertRaisesRegex(TypeError, r"retry argument must be int") as a:
            SSE(ID="12", retry="12345")

    def test_sse_from_content(self) -> None:
        instance = SSE(
            ID="1", event="test", data="test_data", comment="test_comment", retry=12345
        )
        content = instance.render()
        sse = SSE.from_content(content)
        print(sse.ID)
        assert sse.ID == "1"

    def test_sse_from_content_bytes(self) -> None:
        instance = SSE(
            ID="1", event="test", data="test_data", comment="test_comment", retry=12345
        )
        content = instance.render(with_encode=True)
        sse = SSE.from_content(content)
        print(sse.ID)
        assert sse.ID == "1"

    def test_sse_from_content_strict(self) -> None:
        instance = SSE(
            ID="1", event="test", data="test_data", comment="test_comment", retry=12345
        )
        content = instance.render().strip()
        with self.assertRaisesRegex(ValueError, r"not end with") as a:
            SSE.from_content(content, strict=True)
