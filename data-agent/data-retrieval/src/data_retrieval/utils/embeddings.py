# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-09-26

from abc import abstractmethod
from typing import List
from urllib.parse import urljoin
from traceback import print_exc

import aiohttp
import json
import requests
from enum import Enum
from langchain_core.embeddings import Embeddings

from data_retrieval.logs.logger import logger
from data_retrieval.settings import get_settings

settings = get_settings()

class EmbeddingType(Enum):
    MODEL_FACTORY = "model_factory"
    RAW = "raw"


MSE_EMBEDDING_SIZE: int = 768


class BaseEmbeddingsService:

    def __init__(
        self,
        embedding_type: str = EmbeddingType.MODEL_FACTORY.value,
        base_url: str = "",
        timeout: int = 60,
        token: str = "",
        user_id: str = "",
        account_type: str = "user",
    ):
        self.embedding_type = embedding_type
        self.timeout = timeout
        self.base_url = base_url
        self.token = token
        self.user_id = user_id
        self.account_type = account_type

        logger.info(f'Embedding base_url: {self.base_url}')

    def get_headers(self):
        headers = {}
        if self.token:
            headers["Authorization"] = self.token
        if self.user_id:
            headers["x-user"] = self.user_id
            headers["x-account-id"] = self.user_id
            headers["x-account-type"] = self.account_type
        return headers

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        pass

    @abstractmethod
    async def aembed_texts(self, texts: List[str]) -> List[List[float]]:
        pass

    def embed_texts_with_idx(self, texts: List[str], idx: List) -> List[List[float]]:
        if len(texts) != len(idx):
            raise ValueError(f"texts and idx must have the same length")
        return zip(idx, self.embed_texts(texts))

    async def aembed_texts_with_idx(self, texts: List[str], idx: List) -> List[List[float]]:
        if len(texts) != len(idx):
            raise ValueError(f"texts and idx must have the same length")
        return zip(idx, await self.aembed_texts(texts))


class EmbeddingServiceFactory:
    def __init__(
        self,
        embedding_type: str = EmbeddingType.MODEL_FACTORY.value,
        base_url: str = "",
        timeout: int = 60,
        token: str = "",
        user_id: str = "",
    ):
        self.embedding_type = embedding_type
        self.timeout = timeout
        self.base_url = base_url
        self.token = token
        self.user_id = user_id

        if not base_url:
            self.base_url = settings.EMB_URL
        else:
            if settings.EMB_URL_suffix:
                self.base_url = urljoin(self.base_url, settings.EMB_URL_suffix)
            else:
                self.default_path = "api/mf-model-api/v1/small-model/embedding"
                self.base_url = urljoin(self.base_url, self.default_path)
    
    def get_service(self) -> BaseEmbeddingsService:
        if self.embedding_type == EmbeddingType.MODEL_FACTORY.value:
            return ModelFactoryEmbeddings(
                base_url=self.base_url,
                timeout=self.timeout,
                token=self.token,
                user_id=self.user_id,
            )
        elif self.embedding_type == EmbeddingType.RAW.value:
            return RawEmbeddings(
                base_url=self.base_url,
                timeout=self.timeout,
                token=self.token,
                user_id=self.user_id,
            )
        else:
            raise ValueError(f'Invalid embedding type: {self.embedding_type}')


class RawEmbeddings(BaseEmbeddingsService):
    def __init__(
        self,
        base_url: str = "",
        timeout: int = 30,
        token: str = "",
        user_id: str = "",
    ):
        super().__init__(
            embedding_type=EmbeddingType.RAW.value,
            base_url=base_url,
            timeout=timeout,
            token=token,
            user_id=user_id,
        )
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        try:
            vec = requests.post(
                self.base_url,
                json={"texts": texts},
                timeout=self.timeout,
                headers=self.get_headers(),
                verify=False)
        except Exception as e:
            logger.error(f'Raw embedding 错误: {self.base_url} Exception= {str(e)}')
            logger.debug(print_exc())
            return []
        return vec.json()
    
    async def aembed_texts(self, texts: List[str]) -> List[List[float]]:
        try:
            timeout = aiohttp.ClientTimeout(total=self.timeout)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    self.base_url,
                    json={"texts": texts},
                    verify_ssl=False,
                    headers=self.get_headers()) as resp:
                    res = await  resp.text()
                    h_status = resp.status
                if h_status != 200:
                    logger.error(f'Embedding 服务请求错误返回码: {self.base_url}, status_code: {h_status}')
                    return []
                else:
                    embeddings = json.loads(res)
                    return embeddings
        except Exception as e:
            logger.error(f'M3E embedding 错误: {self.base_url} Exception= ',str(e))
            return []


    
class ModelFactoryEmbeddings(BaseEmbeddingsService):
    def __init__(
        self,
        base_url: str = "",
        timeout: int = 60,
        token: str = "",
        user_id: str = "",
    ):
        super().__init__(
            embedding_type=EmbeddingType.MODEL_FACTORY.value,
            base_url=base_url,
            timeout=timeout,
            token=token,
            user_id=user_id,
        )
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        try:
            vec = []
            payload = {
                "input": texts,
                "model": "embedding",
            }

            # 结构是:
            # {
            #     "object": "list",
            #     "data": [
            #         {
            #             "object": "embedding",
            #             "embedding": [0.1, 0.2, 0.3]
            #         }
            #     ]
            # }
            logger.info(f'ModelFactory embedding 请求: {self.base_url} payload= {payload}')
            try:
                resp = requests.post(
                    self.base_url,
                    json=payload,
                    timeout=self.timeout,
                    headers=self.get_headers(),
                    verify=False
                )
                if resp.status_code / 100 != 2:
                    logger.error(f'ModelFactory embedding 错误: {self.base_url} response= {resp.text}')
                    return []
                data = resp.json().get("data", [])
            except Exception as e:
                logger.error(f'ModelFactory embedding 错误: {self.base_url} Exception= {str(e)}')
                logger.debug(print_exc())
                return []
            for item in data:
                vec.append(item.get("embedding", []))

        except Exception as e:
            logger.error(f'ModelFactory embedding 错误: {self.base_url} Exception= {str(e)}')
            logger.debug(print_exc())
            return []
        return vec
    
    async def aembed_texts(self, texts: List[str]) -> List[List[float]]:
        try:
            timeout = aiohttp.ClientTimeout(total=self.timeout)

            payload = {
                "input": texts,
                "model": "embedding",
            }

            vec = []
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    self.base_url,
                    json=payload,
                    verify_ssl=False,
                    headers=self.get_headers()
                ) as resp:
                    res = await resp.text()
                    h_status = resp.status
                if h_status != 200:
                    logger.error(f'Embedding 服务请求错误返回码: {self.base_url}, status_code: {h_status}')
                    return []
                else:
                    data = json.loads(res).get("data", [])
                    for item in data:
                        vec.append(item.get("embedding", []))
                    return vec
        except Exception as e:
            logger.error(f'M3E embedding 错误: {self.base_url} Exception= ',str(e))
            return []
    


class M3EEmbeddings(Embeddings):
    service: BaseEmbeddingsService = None

    def __init__(
        self,
        time_out: int = 5,
        base_url: str = "",
        embedding_type: str = EmbeddingType.MODEL_FACTORY.value,
        token: str = "",
        user_id: str = "",
    ):
        factory = EmbeddingServiceFactory(
            embedding_type=embedding_type,
            base_url=base_url,
            timeout=time_out,
            token=token,
            user_id=user_id,
        )
        self.service = factory.get_service()

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        return await self.service.aembed_texts(texts)
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.service.embed_texts(texts)

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]
    
    async def aembed_query(self, text: str) -> List[float]:
        res = await self.aembed_documents([text])
        return res[0]


if __name__ == "__main__":
    # embedding = M3EEmbeddings(embedding_type=EmbeddingType.RAW)
    embedding = M3EEmbeddings(
        embedding_type=EmbeddingType.MODEL_FACTORY,
        # base_url="http://192.168.152.11:18302/v1/embeddings",
        # base_url="https://192.168.124.90/api/mf-model-api/v1/small-model/embedding",
        time_out=5,
        token="Bearer ory_at_nrj_KBORymr5dbAQXC2TqjYLeIM41wExj_WKlH3-C40.beJ_xcHDa9sQbbWBm2LYZcerYwlGhWUf6-0qWFd0GLc",
        user_id="450dd110-5bba-11f0-b8d9-1688e6ea28e2",
    )
    print(embedding.embed_documents(["你好", "世界"]))
    print(embedding.embed_query("你好"))

    import asyncio
    asyncio.run(embedding.aembed_documents(["你好", "世界"]))
    res = asyncio.run(embedding.aembed_query("你好"))
    print(res)

    # import faiss
    # from langchain_community.docstore.in_memory import InMemoryDocstore
    # from langchain_community.vectorstores import FAISS

    # 创建一个FAISS索引
    # size = len(embedding.embed_query("你好"))
    # index = faiss.IndexFlatL2(MSE_EMBEDDING_SIZE)
    # vectorstore = FAISS(
    #     embedding,
    #     index=index,
    #     docstore=InMemoryDocstore(),
    #     index_to_docstore_id={}
    # )

    # print(len(embedding.embed_query("你好")))

    # 添加文档到FAISS索引
    # vectorstore.add_texts(["你好", "世界"])
    # res = vectorstore.similarity_search_with_score("大家好", k=1)

    # import asyncio
    # res = asyncio.run(vectorstore.asimilarity_search_with_relevance_scores("大家好", k=1))
    # print(res)

