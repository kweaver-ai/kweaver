# -*- coding: utf-8 -*-
"""
HTTP请求模块
处理与知识网络API相关的HTTP请求
"""

import httpx
from typing import List, Dict, Any, Optional
from af_agent.logs.logger import logger
from .config import config

# 知识网络API基础URL（从配置文件读取）
KNOWLEDGE_NETWORK_API_BASE = config.KNOWLEDGE_NETWORK_API_BASE


class KnowledgeNetworkHTTPClient:
    """知识网络HTTP客户端"""
    
    @classmethod
    async def _make_http_request(cls, url: str, method: str = "GET", params: Optional[Dict[str, Any]] = None, 
                                json_data: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        通用HTTP请求方法
        
        Args:
            url: 请求URL
            method: HTTP方法，默认为GET
            params: 查询参数
            json_data: JSON请求体数据
            headers: HTTP请求头
            
        Returns:
            响应数据或None（如果出错）
        """
        try:
            # 合并默认headers和传入的headers
            request_headers = {}
            if headers:
                request_headers.update(headers)
            
            async with httpx.AsyncClient() as client:
                if method.upper() == "GET":
                    response = await client.get(
                        url,
                        headers=request_headers,
                        params=params,
                        timeout=30.0
                    )
                elif method.upper() == "POST":
                    response = await client.post(
                        url,
                        headers=request_headers,
                        params=params,
                        json=json_data,
                        timeout=30.0
                    )
                else:
                    raise ValueError(f"不支持的HTTP方法: {method}")
                
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP状态错误 (URL: {url}, Status: {e.response.status_code}): {str(e)}")
            return None
        except httpx.RequestError as e:
            logger.error(f"HTTP请求错误 (URL: {url}): {str(e)}")
            return None
        except Exception as e:
            logger.error(f"HTTP请求失败 (URL: {url}): {str(e)}", exc_info=True)
            return None

    @classmethod
    async def _get_knowledge_networks(cls, headers: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """
        获取业务知识网络列表
        
        Args:
            headers: HTTP请求头
            
        Returns:
            知识网络列表
        """
        try:
            url = f"{KNOWLEDGE_NETWORK_API_BASE}/in/v1/knowledge-networks"
            params = {
                "include_detail": "false"
            }
            
            logger.debug(f"开始获取知识网络列表，URL: {url}")
            data = await cls._make_http_request(url, "GET", params=params, json_data=None, headers=headers)
            
            if data and "entries" in data:
                networks = data["entries"]
                logger.debug(f"成功获取知识网络列表，数量: {len(networks)}")
                return networks
            else:
                logger.warning("获取知识网络列表返回空数据")
                return []
                    
        except Exception as e:
            logger.error(f"获取知识网络列表失败: {str(e)}", exc_info=True)
            return []

    @classmethod
    async def _get_knowledge_network_detail(cls, kn_id: str, headers: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        获取知识网络详情
        
        Args:
            kn_id: 知识网络ID
            headers: HTTP请求头
            
        Returns:
            知识网络详情
        """
        try:
            url = f"{KNOWLEDGE_NETWORK_API_BASE}/in/v1/knowledge-networks/{kn_id}"
            params = {
                "include_detail": "true",
                "mode": "export"  # 新增mode=export参数
            }
            
            data = await cls._make_http_request(url, "GET", params=params, headers=headers)
            if data:
                logger.debug(f"成功获取知识网络详情 (ID: {kn_id})")
                return data
            else:
                logger.warning(f"获取知识网络详情返回空数据 (ID: {kn_id})")
                return None
                
        except Exception as e:
            logger.error(f"获取知识网络详情失败 (ID: {kn_id}): {str(e)}", exc_info=True)
            return None