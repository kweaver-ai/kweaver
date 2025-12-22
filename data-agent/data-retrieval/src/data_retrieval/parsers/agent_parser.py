import re
import json
from typing import Optional
from langchain_core.output_parsers import StrOutputParser


class StrAgentParser(StrOutputParser):
    text: Optional[str] = None

    def _exchange(self):
        self.text = self.text.replace("{{", "{").replace("}}", "}")

    def _extract(self):
        pattern = r'```json(.*?)```'
        match = re.search(pattern, self.text, re.DOTALL)
        if match:
            self.text = match.group(1).strip()

    def parse(self, text: str) -> str:
        self.text = text
        self._exchange()
        # self._extract()

        return self.text


def AfAgentParserErrorHandler(output_parser_exception) -> str:
    return str(output_parser_exception.llm_output)