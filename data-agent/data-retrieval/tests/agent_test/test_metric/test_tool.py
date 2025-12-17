from af_agent.datasource.af_indicator import AFIndicator
from af_agent.tools.base_tools.text2metric import Text2MetricTool
# from langchain_community.chat_models import ChatOllama
from langchain_openai import ChatOpenAI
from af_agent.utils.llm import CustomChatOpenAI
import traceback

# llm = ChatOpenAI(
#     model_name='Qwen-72B-Chat',
#     openai_api_key="EMPTY",
#     openai_api_base="http://192.168.173.19:8304/v1",
#     max_tokens=2000,
#     temperature=0.01,
# )

llm = CustomChatOpenAI(
    model_name="Qwen2.5-14B-Chat",
    openai_api_key="EMPTY",
    openai_api_base="http://192.168.173.19:8503/v1",
    # max_tokens=8092,
    # temperature=0.2,
    # request_timeout=60,
    # top_p=0.95,
    # presence_penalty=0.1,
    # frequency_penalty=0.1,
)
# llm = ChatOllama(model="phi3:latest")
# llm = ChatOllama(model="codegemma")

from af_agent.api.auth import get_authorization

# indicator_list = ["532179399886306706"]
# token = get_authorization("https://10.4.109.201", "liberly", "111111")
# text2metric = AFIndicator(
#     indicator_list=indicator_list,
#     token=token
# )
# indicator_list = ["535772491461722839", "536195966831723223", "536195625633481431", "536196205823165143"]
# token = get_authorization("http://10.4.109.201", "liberly", "111111")

indicator_list = ["541569060106716947", "541569242810599187", "541569417713075987", "541569516732204819"]
token = get_authorization("http://10.4.109.142", "liberly", "111111")

text2metric = AFIndicator(
    indicator_list=indicator_list,
    token=token,
)

# from af_agent.datasource.af_indicator import MockAFIndicator
# text2metric = MockAFIndicator()

tool = Text2MetricTool.from_indicator(
    indicator=text2metric,
    llm=llm,
    with_execution=True,
    retry_times=2,
    get_desc_from_datasource=True,
    session_id="-7-",
    enable_yoy_or_mom=True
)

print(tool.description)


async def run(text):
    res = await tool.ainvoke({"input": text})
    print("============")
    print(res)

async def run_repl():
    from prompt_toolkit import PromptSession
    prompt_session = PromptSession()
    while True:
        try:
            text = await prompt_session.prompt_async(
                "Your question: >>",
            )
            if text == 'q':
                print('Bye!')
                break
            if text.strip() == "":
                continue
            res = await tool.ainvoke({"input": text})
            print("="*100)
            print(res)
        except Exception as e:
            traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    import sys

    if len(sys.argv) == 1:
        asyncio.run(run_repl())
    else:
        asyncio.run(run(sys.argv[1]))