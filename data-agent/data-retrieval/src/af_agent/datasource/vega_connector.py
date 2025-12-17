import requests
from urllib.parse import urlparse
import json
import asyncio

# from af_agent.datasource.vega_datasource import VegaDataSource, get_datasource_from_kg_params
from af_agent.datasource.dip_dataview import DataView, get_datasource_from_kg_params
from af_agent.api.auth import get_authorization
from af_agent.api import VegaType
from af_agent.utils.dip_services.base import ServiceType

# apilevel = "2.0"
# threadsafety = 1
# paramstyle = "named"  # 比如 :name 形式

def connect(
        url=None,
        user=None,
        password=None,
        host=None,
        port=None,
        user_id="",
        view_list=None,
        kg_params=None,
        **kwargs
    ):
    if not url:
        raise ValueError("Missing URL")

    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.hostname}"
    if parsed.port:
        base_url += f":{parsed.port}"
    else:
        if port:
            base_url += f":{port}"

    return Connection(
        base_url=base_url,
        username=user or '',
        password=password,
        token=kwargs.get("token", ""),
        user_id=user_id,
        view_list=view_list,
        kg_params=kg_params
    )

class Connection:
    """ 参数说明

    base_url: DIP 或 AF 服务地址
    username: 用户名，可选
    password: 密码，可选
    token: 令牌，可选
    user_id: 用户ID
    view_list: 可选，视图列表
    kg_params: 可选，知识图谱参数
    dip_type: 可选，服务类型，默认 dip，可选值：dip、outter_dip、af
    """
    def __init__(
        self,
        base_url: str = "",
        username: str = "",
        password: str = "",
        token: str = "",
        user_id: str = "dip",
        account_type: str = "user",
        view_list: list = None,
        kg_params: dict = None,
        vega_type: str = ""
    ):
        self.base_url = base_url

        if not token:
            self.auth = (username, password, get_authorization(self.base_url, username, password))
        else:
            self.auth = (username, password, token)
        
        self.user_id = user_id
        self.account_type = account_type
        self.kg_params = kg_params
        self.view_list = view_list
        self.af_datasource = None
        self.vega_type = vega_type
        
    def _init_datasource(self):
        # 如果设置了地址，则默认为外部的 DIP 服务, 也有可能是 AF 服务
        if self.base_url:
            dip_type = self.vega_type.lower() or ServiceType.OUTTER_DIP.value
        else:
            dip_type = self.vega_type.lower() or ServiceType.DIP.value

        if not self.af_datasource:
            if self.kg_params:
                headers={
                        "x-user": self.user_id,
                        "x-account-id": self.user_id,
                        "x-account-type": self.account_type
                    }
                token = self.auth[2]
                if token:
                    if not token.startswith("Bearer "):
                        token = f"Bearer {token}"
                    headers["Authorization"] = token

                datasources_in_kg = asyncio.run(get_datasource_from_kg_params(
                    addr=self.base_url,
                    kg_params=self.kg_params,
                    dip_type=dip_type,
                    headers=headers
                    )
                )

                self.view_list = [ds.get("id") for ds in datasources_in_kg]
            else:
                self.view_list = self.view_list

            if not self.view_list:
                raise ValueError("Missing view_list")

            self.af_datasource = DataView(
                view_list=self.view_list,
                user_id=self.user_id,
                user=self.auth[0] or 'admin',
                token=token,
                base_url=self.base_url,
                account_type=self.account_type,
            )

    def cursor(self):
        self._init_datasource()
        return Cursor(self.base_url, self.auth, self.af_datasource, self.account_type)

    def commit(self):
        pass  # 如果接口无事务控制

    def rollback(self):
        pass  # 同上

    def close(self):
        pass
    
    def get_meta_sample_data(self, input_query="", **kwargs):
        """ Params:
            input_query: 用户问题
            view_limit: 视图数量限制
            dimension_num_limit: 维度数量限制
            with_sample: 是否包含样本数据
        """
        self._init_datasource()
        api_res = self.af_datasource.get_meta_sample_data(input_query, **kwargs)

        # 删除不必要的信息
        api_res.pop("view_schema_infos")


        sample_dict = api_res.pop("sample", {})

        for detail in api_res.get("detail", []):
            detail.pop("en2cn")

            if kwargs.get("with_sample", False):
                detail["sample"] = sample_dict.get(detail.get("id", ""), {})
    
        return api_res
    

    async def get_meta_sample_data_async(self, input_query="", **kwargs):
        """ Params:
            input_query: 用户问题
            view_limit: 视图数量限制
            dimension_num_limit: 维度数量限制
            with_sample: 是否包含样本数据
        """
        self._init_datasource()
        api_res = await self.af_datasource.get_meta_sample_data_async(input_query, **kwargs)

        # 删除不必要的信息
        api_res.pop("view_schema_infos")


        sample_dict = api_res.pop("sample", {})

        for detail in api_res.get("detail", []):
            detail.pop("en2cn")

            if kwargs.get("with_sample", False):
                detail["sample"] = sample_dict.get(detail.get("id", ""), {})
    
        return api_res

class Cursor:
    def __init__(
            self,
            base_url: str,
            auth: tuple,
            af_datasource: DataView,
            account_type: str = "user"
        ):
        self.base_url = base_url
        self.auth = auth
        self._results = []
        self.description = []
        self.af_datasource = af_datasource
        self.account_type = account_type

    def execute(self, query, params=None):
        try:
            if query.strip().lower().startswith("select"):
                data = self.af_datasource.query(query)
                self._results = data.get("data", [])
                self.description = [(col["name"], col["type"], None, None, None, None, None) for col in data["columns"]]
            else:
                self.af_datasource.query(query)
                self._results = []
        except Exception as e:
            raise e

    def fetchone(self):
        return self._results.pop(0) if self._results else None

    def fetchall(self):
        rows = self._results
        self._results = []
        return rows

    def close(self):
        pass

