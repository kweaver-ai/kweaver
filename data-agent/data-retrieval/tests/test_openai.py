import openai
from openai import OpenAI
import traceback

from openai._base_client import SyncHttpxClientWrapper, AsyncHttpxClientWrapper



# API_BASE = "https://1.94.239.36:8444/api/model-factory/v1/"
API_BASE = "http://10.4.118.205:8000/v1" # deepseek
API_BASE = "http://192.168.102.250:13522/v1/" # deepseek_distill

# API_BASE = "http://192.168.173.19:8503/v1" 
API_KEY = "EMPTY"
# API_KEY = "OCI3nFVdVm4Y0nhWQD_"
# client = OpenAI(
#     api_key=API_KEY,
#     base_url=API_BASE
# )

http_client = SyncHttpxClientWrapper(verify=False)

client = openai.OpenAI(api_key=API_KEY, base_url=API_BASE, http_client=http_client)

# completion = client.chat.completions.create(
#       wen-max-latest",
#     messages=[{"role": "user", "content": "你好吗?"}]
# )
# print(completion)

response = client.chat.completions.create(
    # model="qwen2:72b",
    model="r1-32",
    # model="Qwen2.5-14B-Chat",
    messages=[{"role": "user", "content": "deepseek 中有几个e?"}],
    stream=True
)

reasoning_content = ""
content = ""

try:
    for chunk in response:
        # if chunk.choices[0].delta.reasoning_content:
        #     reasoning_content += chunk.choices[0].delta.reasoning_content
        # else:
        #     content += chunk.choices[0].delta.content
        print(chunk.choices[0].delta.content, end="", flush=True)
except Exception as e:
    # pass
    traceback.print_exc()
    print(e)
