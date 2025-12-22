import asyncio
import httpx
from src.data_retrieval.utils.password import get_authorization
import traceback

async def fetch_authorization(ip, username, password, attempt_counter):
    try:
        token = await asyncio.to_thread(get_authorization, ip, username, password)
        print(f"Token received: {token}")
    except Exception as e:
        print(f"Error occurred after {attempt_counter} attempts:")
        traceback.print_exc()
        raise  # 重新抛出异常以停止压测

async def main(ip, username, password, concurrency=5):
    attempt_counter = 0
    while True:
        tasks = [fetch_authorization(ip, username, password, attempt_counter) for _ in range(concurrency)]
        attempt_counter += concurrency
        await asyncio.gather(*tasks)
"""
14:32 Error occurred after 580 attempts:

14:44 Error occurred after 1305 attempts:
File "D:\af_project\ATG-pre-research\api_tools\af_api_auth\password.py", line 138, in get_authorization
    token = ori + cookies['af.oauth2_token']
                  ~~~~~~~^^^^^^^^^^^^^^^^^^^
KeyError: 'af.oauth2_token'
"""
if __name__ == "__main__":
    IP = "https://10.4.111.246"
    USERNAME = "xia"
    PASSWORD = ""

    try:
        asyncio.run(main(IP, USERNAME, PASSWORD))
    except Exception as e:
        print(f"Stopping due to error: {e}")