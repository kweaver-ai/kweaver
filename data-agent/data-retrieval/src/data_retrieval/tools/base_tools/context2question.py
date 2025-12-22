# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-6-14

# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
from typing import Any, Optional, List

from langchain.callbacks.manager import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.chat_history import InMemoryChatMessageHistory

from langchain_core.prompts import (
    ChatPromptTemplate,
)

from langchain_core.messages import HumanMessage, BaseMessage, SystemMessage, AIMessage

from data_retrieval.prompts.tools_prompts \
    .context2question_prompt import Context2QueryPrompt

from data_retrieval.logs.logger import logger
from data_retrieval.tools.base import ToolName, LLMTool

_DESCS = {
    "tool_description": {
        "cn": "test2sql(text, tables), 根据用户输入的文本和表单来生成 SQL 语句",
        "en": "test2sql(text, tables), generate SQL according to user's text and tables",
    },
    "context": {
        "cn": "对话上下文",
        "en": "chat context",
    }
}


class Context2QuestionInput(BaseModel):
    context: Optional[list] = Field(description=_DESCS["context"]["cn"])


class Context2QuestionTool(LLMTool):
    """Context2Query Tool

    Generate a new question based on the chat context
    """
    name: str = ToolName.context2question.value
    description: str = _DESCS["tool_description"]["cn"]

    @classmethod
    def from_llm(cls, llm, prompt_manager, *args, language="cn", **kwargs):
        """Create a new instance of Text2SQLTool

        Args:
            data_source (DataSource): DataSource instance
            llm: Language model instance

        Examples:
            data_source = SQLiteDataSource(
                db_file="{yourfile}.db",
                tables=[{yourtable}]
            )
            tool = Text2SQLTool.from_data_source(
                data_source=sqlite,
                llm=llm
            )
        """
        description = _DESCS["tool_description"].get(language, "cn")
        return cls(
            llm=llm,
            prompt_manager=prompt_manager,
            name=ToolName.context2question.value,
            description=description,
            *args, **kwargs
        )
    
    def _pre_run(
        self, 
        context: List
    ):
        if not context or len(context) == 0:
            return "", None

        if len(context) == 1:
            return context[0], None

        if isinstance(context[0], BaseMessage):
            text = "\n".join([msg.type + ":" + msg.content for msg in context])
        else:
            text = "\n".join(context)

        system_prompt = Context2QueryPrompt(
            language=self.language,
            prompt_manager=self.prompt_manager
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt.render()),
                ("user", "{input}")
            ]
        )

        return text, prompt

    def _run(
        self,
        context: List,
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        # 1. 处理异常
        # 2. 选择指定表进行问答(DONE)
        # 3. 利用 Chat history 生成一个新的 SQL
        if run_manager:
            run_manager.on_text("正在总结新的问题")

        text, prompt = self._pre_run(context)
        if prompt is None:
            return text
        logger.debug(f"context2question -> text: {text}")
        chain = prompt | self.llm | JsonOutputParser()
        question = chain.invoke({"input": text})

        if run_manager:
            run_manager.on_text("总结完成")

        self.session.add_agent_logs(
            self._result_cache_key,
            logs=question
        )
        return question

    async def _arun(
        self,
        context: List,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        if run_manager:
            await run_manager.on_text("正在总结新的问题")

        text, prompt = self._pre_run(context)
        if prompt is None:
            return text
        
        logger.debug(f"context2question -> text: {text}")

        chain = prompt | self.llm | JsonOutputParser()
        question = await chain.ainvoke({"input": text})

        if run_manager:
            await run_manager.on_text("总结完成")

        return question
    
def chat_history_to_question(
    llm: Any,
    question: str,
    chat_history: Any,
    language: str = "cn",
    from_agent: bool = True,
    prompt_manager: Any = None
):
    # Use chat history to generate a new Question
    if chat_history:
        new_question_tool = Context2QuestionTool.from_llm(
            llm=llm,
            language=language,
            prompt_manager=prompt_manager
        )
        if isinstance(chat_history, InMemoryChatMessageHistory):
            chat_history = chat_history.messages
        else:
            if not isinstance(chat_history[0], BaseMessage):
                chat_history = [
                    HumanMessage(content=chat)
                    for chat in chat_history
                ]
        if from_agent:
            chat_history.append(
                AIMessage(content=f"我将问题转换成了: {question}")
            )
        logger.debug(f"chat_history: {chat_history}")
        new_question = new_question_tool.invoke({"context": chat_history})
        logger.info(f"New question: {new_question}")
    else:
        new_question = question

    return new_question

async def achat_history_to_question(
    llm: Any,
    question: str,
    chat_history: List,
    language: str = "cn",
    from_agent: bool = True,
    prompt_manager: Any = None
):
    if chat_history:
        new_question_tool = Context2QuestionTool.from_llm(
            llm=llm,
            language=language,
            prompt_manager=prompt_manager
        )
        if isinstance(chat_history, InMemoryChatMessageHistory):
            chat_history = chat_history.messages
        else:
            if not isinstance(chat_history[0], BaseMessage):
                chat_history = [
                    HumanMessage(content=chat)
                    for chat in chat_history
                ]
        # 这里不 append 新的 question, 在一开始已经将 question 添加到 chat_history 中了
        # 这里如果不添加 AIMessage, 则会导致外部 Agent 的问题转换的提示信息丢失
        if from_agent:
            chat_history.append(
                AIMessage(content=f"我将问题转换成了: {question}")
            )
        logger.debug(f"chat_history: {chat_history}")
        new_question = await new_question_tool.ainvoke({"context": chat_history})
        # 可能会出现
        if isinstance(new_question, BaseMessage):
            new_question = new_question.content  # @zkn 取出 content 的内容
        logger.info(f"New question: {new_question}")
    else:
        new_question = question

    return new_question
    

if __name__ == "__main__":
    # from langchain_openai import ChatOpenAI
    from langchain_community.chat_models import ChatOllama

    # llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    llm = ChatOllama(model="codegemma")

    chat_history = [
        "1975年后的电影有哪些?",
        # '{"sql": "SELECT * FROM movie WHERE year > 1975;", "res": [{"title": "Monty Python Live at the Hollywood Bowl", "year": 1982, "score": 7.9}, {"title": "Monty Python\'s The Meaning of Life", "year": 1983, "score": 7.5}, {"title": "Monty Python\'s Life of Brian", "year": 1979, "score": 8.0}]}',
        "这些电影的平均分是多少？"
    ]

    tool = Context2QuestionTool.from_llm(llm=llm, language="cn")
    print(tool.invoke({"context": chat_history}))

    chat_history = [
        HumanMessage(content="What moives were on after 1975?"),
        # AIMessage(
        #     content='{"sql": "SELECT * FROM movie WHERE year > 1975;", "res": [{"title": "Monty Python Live at the Hollywood Bowl", "year": 1982, "score": 7.9}, {"title": "Monty Python\'s The Meaning of Life", "year": 1983, "score": 7.5}, {"title": "Monty Python\'s Life of Brian", "year": 1979, "score": 8.0}]}'
        # ),
        HumanMessage(content="What is the average score of these films?")
    ]

    tool = Context2QuestionTool.from_llm(llm=llm, language="en")
    # print(tool.invoke({"context": chat_history}))