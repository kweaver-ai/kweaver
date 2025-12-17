# -*- coding:utf-8 -*-
"""
国际化中间件
处理请求的国际化设置
"""

import gettext
import os
from fastapi import Request, Response
from app.utils.common import set_lang


async def before_request(request: Request, call_next) -> Response:
    """国际化中间件

    根据请求头的 accept-language 设置国际化语言
    支持中文和英文

    Args:
        request (Request): FastAPI请求对象
        call_next: 下一个中间件或路由处理函数

    Returns:
        Response: 处理完成的响应对象
    """
    # 设置国际化
    lang = request.headers.get("accept-language", "en")
    PROJECT_PATH = os.path.abspath(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )
    # babel翻译的目录，默认是translations。这里可以修改成international
    BABEL_TRANSLATION_DIRECTORIES = "app/common/international"
    BABEL_TRANSLATION_DIRECTORIES = PROJECT_PATH + "/" + BABEL_TRANSLATION_DIRECTORIES
    if lang.startswith("zh"):
        set_lang(
            gettext.translation(
                "messages", localedir=BABEL_TRANSLATION_DIRECTORIES, languages=["zh"]
            ).gettext
        )
    else:
        set_lang(gettext.gettext)

    response = await call_next(request)
    return response
