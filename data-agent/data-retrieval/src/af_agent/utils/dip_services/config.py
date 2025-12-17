# -*- coding: utf-8 -*-
# Get config from .env
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: config.py
from dotenv import load_dotenv, find_dotenv
import os


load_dotenv(find_dotenv(usecwd=True), verbose=True)


class Config:
    """ Base config
    """
   
    # AD_ADDR = os.getenv("AD_ADDR", "http://yourdomain.com")
    AD_ACCESS_KEY = os.getenv("AD_ACCESS_KEY", "youraccesskey")
    # 默认 Version 是 3.0.0.2 及以上版本
    AD_VERSON = os.getenv("AD_VERSION", "3.0.0.2")
    
    # opensearch http.max_initial_line_length配置
    OS_HTTP_MAX_INITIAL_LINE_LENGTH = int(os.getenv("OS_HTTP_MAX_INITIAL_LINE_LENGTH", "16384"))
    OS_IPS = os.getenv("OS_IPS", "yourdomain.com").split(",")
    OS_PORTS = os.getenv("OS_PORTS", "9200").split(",")
    OS_USER = os.getenv("OS_USER", "admin")
    OS_PWD = os.getenv("OS_PWD", "admin")

