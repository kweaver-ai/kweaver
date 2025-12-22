# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-21
from typing import Type
from langchain_core.tools import tool
from langchain_core.pydantic_v1 import BaseModel, Field
from data_retrieval.tools.base import AFTool, api_tool_decorator


@tool
def add(first: int, second: int) -> int:
    """Add two numbers
    """
    return first + second


@tool
def multiply(first: int, second: int) -> int:
    """Multiply two numbers
    """
    return first * second


@tool
def divide(first: int, second: int) -> int:
    """Divide two numbers
    """
    return first / second


class MinusInput(BaseModel):
    first: int = Field(description="The first number")
    second: int = Field(description="The second number")

class MinusTool(AFTool):
    name: str = "minus"
    description: str = "Minus two numbers"
    args_schema: Type[BaseModel] = MinusInput
    language: str = "cn"
    mock_type: str = "sync"

    def _run(self, first: int, second: int) -> int:
        """Minus two numbers
        """
        return first - second
    
    async def _arun(self, first: int, second: int) -> int:
        """Minus two numbers
        """

        # mock error
        if first == -1001:
            raise ValueError("MinusTool error")

        return first - second
    
    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls, first: int, second: int, language: str = "cn", mock_type: str = "sync",
        stream: bool = False,
        mode: str = "http"
    ):
        """Minus two numbers
        """
        tool = cls(
            language=language,
            mock_type=mock_type
        )
        res = await tool.ainvoke(input={"first": first, "second": second})
        return res


if __name__ == "__main__":
    import asyncio

    async def main_cls():
        result = await MinusTool.as_async_api_cls(1, 2)
        print(result)

    asyncio.run(main_cls())
