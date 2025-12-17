# -*- coding: utf-8 -*-
import logging

# 1、创建一个logger
logger = logging.getLogger('af-agent')
if not logger.handlers:
    logger.setLevel(logging.DEBUG)

    # 2、创建一个handler，用于写入日志文件
    fh = logging.FileHandler('af-agent.log')
    fh.setLevel(logging.DEBUG)

    # 再创建一个handler，用于输出到控制台
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)

    # 3、定义handler的输出格式（formatter），添加文件名和行号
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s')

    # 4、给handler添加formatter
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)

    # 5、给logger添加handler
    logger.addHandler(fh)
    logger.addHandler(ch)

# 设置logger的propagate属性为False，防止日志传播到父logger导致重复输出
logger.propagate = False
# 添加以下代码以减少 httpcore 和 httpx 的冗余日志
logging.getLogger("httpcore").setLevel(logging.INFO)
logging.getLogger("httpx").setLevel(logging.INFO)