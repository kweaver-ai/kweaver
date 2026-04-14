#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
@Time   : 2024/7/1 9:54
@Author : Leopold.yu
@File   : test_run.py
"""
import json
import random
import string as _str
from json import JSONDecodeError

import allure
import jsonpath
from jinja2 import Environment
from jsonschema.validators import validate

from common import at_env
from common.func import replace_params, replace_placeholders, genson, _COMMON_HANZI
from conftest import config, compute_case_list, BEARER_AUTH
from request.http_client import HTTPClient

resp_values = {}
global _case_list_cache


def _resolve_authorization(case_info):
    """默认 Bearer 见 conftest（环境变量优先）；套件 token_source: login 时再调 get_token。"""
    src = (case_info.get("_token_source") or "").strip().lower()
    if src not in ("login", "get_token", "token_provider"):
        return BEARER_AUTH
    try:
        from src.common.token_provider import get_token, clear_token_cache

        user, pwd = at_env.admin_credentials(config)
        if not user:
            allure.attach("token_source=login 但未配置 test_data.admin_user，已回退默认 Bearer", name="鉴权说明")
            return BEARER_AUTH
        # 清理缓存并强制刷新token，避免使用过期的缓存token
        clear_token_cache(user)
        tok = get_token(user, pwd, force_refresh=True)
        if tok:
            return "Bearer %s" % tok
        allure.attach(
            "get_token 返回空，已回退默认 Bearer（API_ACCESS_TOKEN / test_data.application_token）",
            name="鉴权说明",
        )
    except Exception as ex:
        allure.attach(str(ex), name="get_token 异常")
    return BEARER_AUTH


def _jinja_random_string(length=8, model=8):
    """
    生成指定长度的随机字符串
    :param length: 字符串长度
    :param model: 按位指定字符串类型，
                  1=string.whitespace
                  2=string.ascii_lowercase
                  4=string.ascii_uppercase
                  8=string.digits
                  16=string.hexdigits
                  32=string.octdigits
                  64=string.punctuation
                  128=常见中文
    """

    chars = ""
    if model & 1:
        chars += _str.whitespace
    if (model >> 1) & 1:
        chars += _str.ascii_lowercase
    if (model >> 2) & 1:
        chars += _str.ascii_uppercase
    if (model >> 3) & 1:
        chars += _str.digits
    if (model >> 4) & 1:
        chars += _str.hexdigits
    if (model >> 5) & 1:
        chars += _str.octdigits
    if (model >> 6) & 1:
        chars += _str.punctuation + r"·！￥……（）【】、：；“‘《》，。？、"
    if (model >> 7) & 1:
        chars += _COMMON_HANZI

    return json.dumps(''.join(random.choices(chars, k=length))).strip('"')


_jinja_env = Environment()
_jinja_env.globals["random_string"] = _jinja_random_string


def _render_jinja_fields(case_info):
    out = {}
    for k, v in case_info.items():
        out[k] = _jinja_env.from_string(v).render() if isinstance(v, str) else v
    return out


def pytest_generate_tests(metafunc):
    if metafunc.function.__name__ != "test_case":
        return
    cl = compute_case_list()
    argvals = [(x["feature"], x["story"], x["name"], x) for x in cl]
    metafunc.parametrize("feature, story, case_name, case_info", argvals)


@allure.title("{case_name}")
def test_case(feature, story, case_name, case_info):
    print("run case: %s @ %s.%s" % (case_name, story, feature))
    allure.attach(
        body="run case: %s @ %s.%s" % (case_name, story, feature), name="用例名称"
    )

    allure.dynamic.feature(feature)
    allure.dynamic.story(story)

    if case_info.get("prev_case", "") != '':
        with allure.step("执行前置用例执行"):
            for x in _case_list_cache:
                if x["name"] == case_info["prev_case"]:
                    test_case(x["feature"], x["story"], x["name"], x)
                    # 若存在同名用例，仅执行第一个匹配项
                    break

    with allure.step("加载用例参数"):
        # 更新前序用例提取的变量
        case_info = replace_params(case_info, **resp_values)

        # 替换 DP_AT 风格占位符（${ts_uuid}, ${random_str} 等）
        case_info = {k: replace_placeholders(v) for k, v in case_info.items()}
        case_info = _render_jinja_fields(case_info)

        # 替换path参数
        case_path_params = json.loads(case_info.get("path_params", "{}"))
        case_info = replace_params(case_info, **case_path_params)

        # 参数格式转换
        case_header_params = {**case_info.get("headers", {}),
                              **json.loads(case_info.get("header_params", "{}")),
                              "Authorization": _resolve_authorization(case_info)}
        case_cookie_params = json.loads(case_info.get("cookie_params", "{}"))
        case_query_params = json.loads(case_info.get("query_params", "{}"))
        case_body_params = json.loads(case_info.get("body_params", "{}"))
        case_form_params = json.loads(case_info.get("form_params", "{}"))

        url = case_info.get("url", "")

        allure.attach(
            body="url: %s\nheaders: %s\ncookies：%s\n"
                 "query_params: %s\nbody_params: %s\nform_params: %s" % (
                     url, case_header_params, case_cookie_params,
                     case_query_params, case_body_params, case_form_params),
            name="请求参数"
        )

    with allure.step("发送请求"):
        _scheme, _host = at_env.resolve_request_target(config)
        client = HTTPClient(url="%s://%s%s" % (_scheme, _host, url),
                            method=case_info.get("method", ""), headers=case_header_params)
        send_kw = dict(params=case_query_params, json=case_body_params, data=case_form_params)
        if case_cookie_params:
            send_kw["cookies"] = case_cookie_params
        client.send(**send_kw)

        resp_code = client.resp_code()
        resp_body = client.resp_body()

        allure.attach(
            body="url: %s\nhttp_code: %s\nresponse: %s" % (
                client.url, resp_code, json.dumps(resp_body, ensure_ascii=False)),
            name="请求响应"
        )

    # 结果断言
    if "code_check" in case_info:
        assert str(resp_code) == case_info["code_check"]

    if "resp_headers_check" in case_info:
        for k, v in json.loads(case_info.get("resp_headers_check", "{}")).items():
            assert client.resp.headers.get(k) == v

    if "resp_check" in case_info:
        for k, v in json.loads(case_info.get("resp_check", "{}")).items():
            assert jsonpath.jsonpath(resp_body, k)[0] == v

    if "resp_schema" in case_info:
        if resp_code in case_info["resp_schema"]:
            json_schema = genson(case_info["resp_schema"][resp_code])
            validate(instance=resp_body, schema=json_schema)

    # 提取响应中的变量
    if "resp_values" in case_info:
        for k, v in json.loads(case_info.get("resp_values", "{}")).items():
            param = jsonpath.jsonpath(resp_body, v)[0]
            if isinstance(param, list) or isinstance(param, dict):
                # 将对象存储为字符串,加载用例参数时再转换为JSON格式
                resp_values[k] = json.dumps(param, ensure_ascii=False)
            else:
                resp_values[k] = param


if __name__ == '__main__':
    pass
