# -*- coding:utf-8 -*-
import re
import time
import base64
import requests
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import urllib3

urllib3.disable_warnings()


def get_password(min_pwd) -> str:
    rsa_pub_key_base64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4E+eiWRwffhRIPQYvlXUjf0b3HqCmosiCxbFCYI/gdfDBhrTUzbt3fL3o/gRQQBEPf69vhJMFH2ZMtaJM6ohE3yQef331liPVM0YvqMOgvoID+zDa1NIZFObSsjOKhvZtv9esO0REeiVEPKNc+Dp6il3x7TV9VKGEv0+iriNjqv7TGAexo2jVtLm50iVKTju2qmCDG83SnVHzsiNj70MiviqiLpgz72IxjF+xN4bRw8I5dD0GwwO8kDoJUGWgTds+VckCwdtZA65oui9Osk5t1a4pg6Xu9+HFcEuqwJTDxATvGAz1/YW0oUisjM0ObKTRDVSfnTYeaBsN6L+M+8gCwIDAQAB"
    password_ming = f"{min_pwd}"
    # rsa加密 把页面上的base64的公钥处理成字节，直接处理
    pub_key = RSA.importKey(base64.b64decode(rsa_pub_key_base64))
    rsa = PKCS1_v1_5.new(pub_key)
    mi_password = rsa.encrypt(password_ming.encode("utf-8"))
    mi_password_base64 = base64.b64encode(mi_password).decode()
    return mi_password_base64


def get_authorization(IP, name, pwd) -> str:
    useIP = f"{IP}"
    name = f"{name}"
    pwd = get_password(pwd)

    session = requests.Session()
    # ---------第一次请求-------------获取二次请求地址， 会话id(cookie)
    timestamp = int(time.time() * 1000)
    cookies = {}
    url_1 = f"{useIP}/af/api/session/v1/login"
    headers_1 = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Referer': f'{useIP}/anyfabric/',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    }
    params_1 = {
        'state': str(timestamp),
    }
    response_1 = session.get(url=url_1, params=params_1, headers=headers_1, verify=False, allow_redirects=False)
    cookies.update(response_1.cookies)
    content_1 = response_1.text
    yuan_url_1 = str(re.findall(r'href="(.*?)">Moved', content_1)[0]).replace(";", "&")
    # ---------第二次请求-------------获取challenge,三次地址  ory_hydra_login_csrf_518000218(cookie)
    url_2 = f"{useIP}" + yuan_url_1
    response_2 = session.get(url=url_2, headers=headers_1, cookies=cookies, verify=False, allow_redirects=False)
    cookies.update(response_2.cookies)
    content_2 = response_2.text
    # singin时使用challenge
    challenge = str(re.findall(r'challenge=(.*?)">Found', content_2)[0])
    url_3 = str(re.findall(r'href="(.*?)">Found', content_2)[0]).replace(":443", "")
    # ---------第三次请求-------------获取csrf_token  _csrf(cookie)
    response_3 = session.get(url=url_3, headers=headers_1, cookies=cookies, verify=False, allow_redirects=False)
    cookies.update(response_3.cookies)
    content_3 = response_3.text
    csrftoken = str(re.findall(r'"csrftoken":"(.*?)",', content_3)[0])

    # --------第四次请求-------登录  获取通信校验
    headers_4 = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': f'{useIP}',
        'Pragma': 'no-cache',
        'Referer': f'{useIP}/oauth2/signin?login_challenge={challenge}',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    }
    json_data = {
        '_csrf': f'{csrftoken}',
        'challenge': f'{challenge}',
        'account': f'{name}',
        'password': f"{pwd}",
        'vcode': {
            'id': '',
            'content': '',
        },
        'dualfactorauthinfo': {
            'validcode': {
                'vcode': '',
            },
            'OTP': {
                'OTP': '',
            },
        },
        'remember': False,
        'device': {
            'name': '',
            'description': '',
            'client_type': 'unknown',
            'udids': [],
        },
    }

    response_4 = requests.post(f'{useIP}/oauth2/signin', cookies=cookies, headers=headers_4, json=json_data,
                               verify=False, allow_redirects=False)
    cookies.update(response_4.cookies)
    response_4_content = response_4.json()
    url_4 = str(response_4_content["redirect"]).replace("amp=&amp=&amp=&amp=&amp=&", "")
    # url_4 = str(response_4_content["redirect"])
    # -------第五次 获取consent_challeng---------
    response_5 = session.get(url=url_4, cookies=cookies, headers=headers_4, verify=False, allow_redirects=False)
    cookies.update(response_4.cookies)
    content_5 = response_5.text
    url_5 = str(re.findall(r'href="(.*?)">Found', content_5)[0])  # 包含了challenge
    # ------第六次（含challenge）------获取重定向地址及state
    response_6 = session.get(url=url_5, cookies=cookies, headers=headers_4, verify=False)
    cookies.update(response_6.cookies)
    ori = 'Bearer '
    token = ori + cookies['af.oauth2_token']

    return token


if __name__ == '__main__':
    res = get_authorization("https://10.2.179.130", "Jun", "111111")
    print(res)
