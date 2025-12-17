import time

from circuitbreaker import CircuitBreakerError

from app.utils.common import GetRecoveryTimeout, func_judgment


def myAssertNotRaises(callable_obj, *args, **kwargs):
    """
    自定义断言方法，用于处理 CircuitBreakerError 异常。

    Args:
        callable_obj: 要执行的函数或方法。
        *args: 传递给 callable_obj 的位置参数。
        **kwargs: 传递给 callable_obj 的关键字参数。
    """
    try:
        callable_obj(*args, **kwargs)
    except CircuitBreakerError:
        # 如果抛出的是断路器异常，等待 断路器恢复 后重试断言
        time.sleep(GetRecoveryTimeout())
        try:
            callable_obj(*args, **kwargs)
        except Exception as e:
            raise AssertionError(f"Raised unexpected exception: {e}")
    except Exception as e:
        raise AssertionError(f"Raised unexpected exception: {e}")


async def myAssertRaises(expected_exception, callable_obj, *args, **kwargs):
    """
    自定义断言方法，用于处理 CircuitBreakerError 异常。

    Args:
        expected_exception: 期望的异常类型。
        callable_obj: 要执行的函数或方法。
        *args: 传递给 callable_obj 的位置参数。
        **kwargs: 传递给 callable_obj 的关键字参数。
    """
    try:
        asynchronous, stream = func_judgment(callable_obj)
        if asynchronous:
            if stream:
                async for _ in callable_obj(*args, **kwargs):
                    pass
            else:
                await callable_obj(*args, **kwargs)
        else:
            if stream:
                for _ in callable_obj(*args, **kwargs):
                    pass
            else:
                callable_obj(*args, **kwargs)
    except expected_exception:
        pass
    except CircuitBreakerError:
        # 如果抛出的是断路器异常，等待 断路器恢复 后重试断言
        time.sleep(GetRecoveryTimeout())
        try:
            callable_obj(*args, **kwargs)
        except expected_exception:
            pass
        else:
            # 如果重试后没有抛出期望的异常，则断言失败
            raise AssertionError(f"Did not raise {expected_exception.__name__}")
    else:
        # 如果没有抛出任何异常，则断言失败
        raise AssertionError(f"Did not raise {expected_exception.__name__}")
