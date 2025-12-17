# -*- coding:utf-8 -*-
import threading

from app.utils.pymysql_pool import PymysqlPool


def once(func):
    instance = None
    lock = threading.Lock()

    def wrapper(*args, **kwargs):
        nonlocal instance
        if instance is None:
            with lock:
                # 再次检查 instance，防止多次赋值
                if instance is None:
                    instance = func(*args, **kwargs)
        return instance

    return wrapper


def connect_execute_commit_close_db(func):
    """sql修改语句使用到的装饰器"""

    def wrapper(*args, **kwargs):
        if kwargs.get("connection") is None and kwargs.get("cursor") is None:
            pymysql_pool = PymysqlPool.get_pool()
            connection = pymysql_pool.connection()
            cursor = connection.cursor()
            kwargs["connection"] = connection
            kwargs["cursor"] = cursor
            try:
                ret = func(*args, **kwargs)
                connection.commit()
                return ret
            except Exception as e:
                connection.rollback()
                raise e
            finally:
                cursor.close()
                connection.close()
            return None
        else:
            ret = func(*args, **kwargs)
            return ret

    return wrapper


def connect_execute_close_db(func):
    """sql查询语句使用到的装饰器"""

    def wrapper(*args, **kwargs):
        if kwargs.get("connection") is None and kwargs.get("cursor") is None:
            pymysql_pool = PymysqlPool.get_pool()
            connection = pymysql_pool.connection()
            kwargs["connection"] = connection
            cursor = connection.cursor()
            kwargs["cursor"] = cursor
            try:
                ret = func(*args, **kwargs)
                return ret
            except Exception as e:
                raise e
            finally:
                cursor.close()
                connection.close()
            return None
        else:
            ret = func(*args, **kwargs)
            return ret

    return wrapper
