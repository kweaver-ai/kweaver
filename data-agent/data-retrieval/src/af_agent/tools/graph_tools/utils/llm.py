from af_agent.tools.graph_tools.driven.dip.model_manager_service import model_manager_service
import asyncio, aiohttp


async def llm_chat(inner_llm, messages, max_retries=3, initial_delay=1, backoff_factor=2):
    """
    带有重试机制的异步函数，用于调用大模型。

    :param inner_llm: 大模型的参数，应包含 account_id 和 account_type 字段
    :param messages: 用户消息
    :param max_retries: 最大重试次数
    :param initial_delay: 初始延迟时间（秒）
    :param backoff_factor: 退避因子
    :return: 模型响应
    """
    retries = 0
    delay = initial_delay

    while retries < max_retries:
        try:
            # 尝试调用模型服务
            # 从 inner_llm 中获取 account_id 和 account_type
            account_id = inner_llm.get("account_id", "")
            account_type = inner_llm.get("account_type", "user")
            response = await model_manager_service.call(
                model=inner_llm.get("name"),
                messages=messages,
                temperature=inner_llm.get("temperature", 0),
                max_tokens=inner_llm.get("max_tokens", 5000),
                account_id=account_id,
                account_type=account_type,
                top_k=inner_llm.get("top_k", 100),
                top_p=inner_llm.get("top_p"),
                presence_penalty=inner_llm.get("presence_penalty")
            )
            return response  # 成功调用后返回响应

        except Exception as e:
            retries += 1
            if retries >= max_retries:
                # 达到最大重试次数，抛出异常
                print(f"所有重试均失败，错误信息: {str(e)}")
                raise Exception(f'llm 模型调用失败: {str(e)}')

            # 打印错误日志并等待一段时间后重试
            print(f"请求失败（第 {retries} 次重试）: {str(e)}，等待 {delay} 秒后重试...")
            await asyncio.sleep(delay)

            # 指数退避策略
            delay *= backoff_factor


async def llm_chat_stream(inner_llm, messages, max_retries=3, initial_delay=1, backoff_factor=2):
    """
    带有重试机制的异步函数，用于流式调用大模型。

    :param inner_llm: 大模型的参数，应包含 account_id 和 account_type 字段
    :param messages: 用户消息
    :param max_retries: 最大重试次数
    :param initial_delay: 初始延迟时间（秒）
    :param backoff_factor: 退避因子
    :return: 流式模型响应的异步生成器
    """
    retries = 0
    delay = initial_delay

    while retries < max_retries:
        try:
            # 尝试流式调用模型服务
            # 从 inner_llm 中获取 account_id 和 account_type
            account_id = inner_llm.get("account_id", "")
            account_type = inner_llm.get("account_type", "user")
            async for chunk in model_manager_service.call_stream(
                model=inner_llm.get("name"),
                messages=messages,
                temperature=inner_llm.get("temperature", 0),
                max_tokens=inner_llm.get("max_tokens", 5000),
                account_id=account_id,
                account_type=account_type,
                top_k=inner_llm.get("top_k", 100),
                top_p=inner_llm.get("top_p"),
                presence_penalty=inner_llm.get("presence_penalty")
            ):
                yield chunk  # 逐块返回响应

            # 如果成功完成流式调用，跳出重试循环
            break

        except Exception as e:
            retries += 1
            if retries >= max_retries:
                # 达到最大重试次数，抛出异常
                print(f"所有重试均失败，错误信息: {str(e)}")
                raise Exception(f'llm 模型调用失败: {str(e)}')

            # 打印错误日志并等待一段时间后重试
            print(f"请求失败（第 {retries} 次重试）: {str(e)}，等待 {delay} 秒后重试...")
            await asyncio.sleep(delay)

            # 指数退避策略
            delay *= backoff_factor
