"""
@File: calculator.py
@Date: 2024-09-11
@Author: Danny.gao
@Desc:
"""

from enum import Enum
import json
import pandas as pd
from typing import Any, Optional, Type, Tuple, Dict

from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import BaseTool

from af_agent.utils._common import _route_similarity, format_table_datas
from af_agent.tools.base import construct_final_answer, async_construct_final_answer, ToolMultipleResult, AFTool
from af_agent.datasource.db_base import DataSource
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName


_DESCS = {
    'tool_description': {
        'cn': '对电子运单、车辆轨迹进行异常检测，包括电子运单运输重量不一致、车辆轨迹偏离常规路线等',
        'en': 'calculate transport volume based on indicators and corresponding analysis dimensions',
    },
    'chat_history': {
        'cn': '对话历史',
        'en': 'chat history',
    },
    'factors': {
        'cn': '根据用户问题，抽取到的电子运单号码、车牌号\n'
          '示例1：{"veh_nos": ["浙A45639"], "bill_nos": ["310000523324060100231932"]}\n'
          '示例2：{"veh_nos": ["浙A45639"]}\n'
          '示例3：{"bill_nos": ["310000523324060100231932"]}\n',
        'en': '',
    }
}


class DetectionInput(BaseModel):
    factors: dict = Field(description=_DESCS['factors']['cn'])


class DetectionTool(AFTool):
    name: str = ToolName.detect_anomalies.value
    description: str = _DESCS['tool_description']['cn']
    language: str = 'cn'
    background: str = '--'
    args_schema: Type[BaseModel] = DetectionInput
    retry_times: int = 3
    data_source: DataSource # 逻辑视图资源
    catelogs: dict = None # 逻辑视图映射表
    session_id: Optional[Any] = None
    session: Optional[RedisHistorySession] = None

    def get_chat_history(
            self,
            session_id,
    ):
        history = self.session.get_chat_history(
            session_id=session_id
        )
        return history

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.catelogs = self.format_tables()

    def format_tables(self) -> dict:
        res = {}
        # 找到所有的逻辑视图
        # ['vdm_maria_u4u8lxul.default.vehicle_track_road_aggregated', 'vdm_maria_u4u8lxul.default.waybill_main', 'vdm_maria_u4u8lxul.default.waybill_goods',
        # 'vdm_maria_u4u8lxul.default.loc_patterns', 'vdm_maria_u4u8lxul.default.regular_routes', 'vdm_maria_u4u8lxul.default.goods_loc_patterns',
        # 'vdm_maria_u4u8lxul.default.bill_an']
        catelogs = self.data_source.get_catelog()
        for catelog in catelogs:
            if '.goods_transport_details' in catelog:
                res['details'] = catelog
            elif '.waybill_goods' in catelog:
                res['goods'] = catelog
            elif '.loc_patterns' in catelog:
                res['loc_patterns'] = catelog
            elif '.regular_routes' in catelog:
                res['regular_routes'] = catelog
            elif '.goods_loc_patterns' in catelog:
                res['goods_loc_patterns'] = catelog
            elif '.bill_an' in catelog:
                res['bill_an'] = catelog
        return res

    def cal_similar(self, actual_route, regular_routes, regular_top_roads, regular_all_roads):
        if not regular_routes:
            return 0, '正常', '实际路线与历史路线一致。', [], [], []
        # 主要道路是否符合
        out_top_roads = []
        for item in actual_route:
            for road, duration in item.items():
                if '未知' in road:
                    continue
                if road not in regular_top_roads:
                    out_top_roads.append(road)
        # 是否行驶到未知道路
        out_roads, over_duration_roads = [], []
        for item in actual_route:
            for road, duration in item.items():
                if '未知' in road:
                    continue
                if road not in regular_all_roads:
                    out_roads.append(road)
                else:
                    duration_min_max = regular_all_roads[road]
                    max_ = duration_min_max[1]
                    if duration > max_ * 1.2:
                        over_duration_roads.append(road)
        # 路线相似度
        max_similarity = 0
        for reg_route in regular_routes:
            similarity = _route_similarity(actual_route, reg_route)
            max_similarity = max(max_similarity, similarity)
        if max_similarity > 0.8:
            status = '正常'
            reason = '实际路线与历史路线一致。'
        elif max_similarity > 0.5:
            status = '可疑'
            reason = '实际路线与历史路线有所偏离'
        else:
            status = '异常'
            reason = '实际路线严重偏离历史路线，请关注！'

        return max_similarity, status, reason, out_top_roads, out_roads, over_duration_roads

    def _search_regular_routes(self, veh_nos, origin_to_dests):
        all_datas = []
        table_name = self.catelogs.get('regular_routes', '')
        if not table_name:
            return []

        if veh_nos:
            sql = f"select * from {table_name} where veh_no in ('{', '.join(veh_nos)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        if origin_to_dests:
            sql = f"select * from {table_name} where origin_to_dest in ('{', '.join(origin_to_dests)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        return all_datas
        # search_index = f'test_gd_regular_routes'
        # shoulds = []
        # if veh_nos:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'veh_no.keyword': veh_nos
        #             }
        #         }
        #     )
        # if origin_to_dests:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'origin_to_dest.keyword': origin_to_dests
        #             }
        #         }
        #     )
        # if not shoulds:
        #     return []
        # query = ''
        # query += '{"index": "%s"}\n' % search_index
        # query_module = {
        #     'size': 3,
        #     'query': {
        #         'bool': {
        #             'should': shoulds
        #         }
        #     }
        # }
        # query += json.dumps(query_module)
        # query += '\n'
        # # logger.info(f'常规路线检索-query： {query.strip()}')
        # responses = ad_opensearch_connector(url=f'{search_index}/_msearch', body=query)
        # res = []
        # if responses:
        #     responses = responses['responses']
        #     for response in responses:
        #         hits = []
        #         for hit in response.get('hits', {}).get('hits', []):
        #             hits.append(hit['_source'])
        #         res.append(hits)
        # return res[0] if len(res) > 0 else []

    def _search_loc_patterns(self, goods_name_and_types, origin_to_dests, locations):
        all_datas = []
        table_name = self.catelogs.get('loc_patterns', '')
        if not table_name:
            return []

        if goods_name_and_types:
            sql = f"select * from {table_name} where goods_name_and_type in ('{', '.join(goods_name_and_types)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        if origin_to_dests:
            sql = f"select * from {table_name} where origin_to_dest in ('{', '.join(origin_to_dests)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        if locations:
            sql = f"select * from {table_name} where location in ('{', '.join(locations)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        return all_datas

        # search_index = f'test_gd_loc_patterns'
        # shoulds = []
        # if goods_name_and_types:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'goods_name_and_type.keyword': goods_name_and_types
        #             }
        #         }
        #     )
        # if origin_to_dests:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'origin_to_dest.keyword': origin_to_dests
        #             }
        #         }
        #     )
        # if locations:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'location.keyword': locations
        #             }
        #         }
        #     )
        # if not shoulds:
        #     return []
        # query = ''
        # query += '{"index": "%s"}\n' % search_index
        # query_module = {
        #     'size': 3,
        #     'query': {
        #         'bool': {
        #             'should': shoulds
        #         }
        #     }
        # }
        # query += json.dumps(query_module)
        # query += '\n'
        # # logger.info(f'常规路线检索-query： {query.strip()}')
        # responses = ad_opensearch_connector(url=f'{search_index}/_msearch', body=query)
        # res = []
        # if responses:
        #     responses = responses['responses']
        #     for response in responses:
        #         hits = []
        #         for hit in response.get('hits', {}).get('hits', []):
        #             hits.append(hit['_source'])
        #         res.append(hits)
        # return res[0] if len(res) > 0 else []


    def _search_goods_patterns(self, goods_name_and_types, origin_to_dests):
        all_datas = []
        table_name = self.catelogs.get('goods_loc_patterns', '')
        if not table_name:
            return []

        if goods_name_and_types:
            sql = f"select * from {table_name} where goods_name_and_type in ('{', '.join(goods_name_and_types)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        if origin_to_dests:
            sql = f"select * from {table_name} where origin_to_dest in ('{', '.join(origin_to_dests)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)

        return all_datas
        # search_index = f'test_gd_goods_loc_patterns'
        # shoulds = []
        # if goods_name_and_types:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'goods_name_and_type.keyword': goods_name_and_types
        #             }
        #         }
        #     )
        # if origin_to_dests:
        #     shoulds.append(
        #         {
        #             'terms': {
        #                 'origin_to_dest.keyword': origin_to_dests
        #             }
        #         }
        #     )
        # if not shoulds:
        #     return []
        # query = ''
        # query += '{"index": "%s"}\n' % search_index
        # query_module = {
        #     'size': 3,
        #     'query': {
        #         'bool': {
        #             'should': shoulds
        #         }
        #     }
        # }
        # query += json.dumps(query_module)
        # query += '\n'
        # # logger.info(f'常规路线检索-query： {query.strip()}')
        # responses = ad_opensearch_connector(url=f'{search_index}/_msearch', body=query)
        # res = []
        # if responses:
        #     responses = responses['responses']
        #     for response in responses:
        #         hits = []
        #         for hit in response.get('hits', {}).get('hits', []):
        #             hits.append(hit['_source'])
        #         res.append(hits)
        # return res[0] if len(res) > 0 else []

    def _search_bill_an(self, bill_no):
        bill_data, goods_data = [], []
        bill_tb_name = self.catelogs.get('bill_an', '')
        goods_tb_name = self.catelogs.get('goods', '')
        if not bill_tb_name or not goods_tb_name:
            return [], []

        if bill_no:
            sql = f"select * from {bill_tb_name} where dispatch_id in ('{bill_no}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            bill_data.extend(data)

            sql = f"select * from {goods_tb_name} where dispatch_id in ('{bill_no}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            goods_data.extend(data)
        return bill_data, goods_data

        # search_index = f'test_gd_bill_an'
        # query = ''
        # query += '{"index": "%s"}\n' % search_index
        # query_module = {
        #     'size': 1,
        #     'query': {
        #         'bool': {
        #             'must': [
        #                 {
        #                     'terms': {'dispatch_id.keyword': [int(bill_no)]}
        #                 }
        #             ]
        #         }
        #     }
        # }
        # query += json.dumps(query_module)
        # query += '\n'
        # # logger.info(f'常规路线检索-query： {query.strip()}')
        # responses = ad_opensearch_connector(url=f'{search_index}/_msearch', body=query)
        # res = []
        # if responses:
        #     responses = responses['responses']
        #     for response in responses:
        #         hits = []
        #         for hit in response.get('hits', {}).get('hits', []):
        #             hits.append(hit['_source'])
        #         res.append(hits)
        # return res[0] if len(res) > 0 else []

    def _search_goods(self, dispatch_ids, veh_nos):
        all_datas = []
        table_name = self.catelogs.get('details', '')
        if not table_name:
            return pd.DataFrame()

        if dispatch_ids:
            sql = f"select * from {table_name} where dispatch_id in ('{', '.join(dispatch_ids)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)
        if veh_nos:
            sql = f"select * from {table_name} where dispatch_id in ('{', '.join(veh_nos)}')"
            data = self.data_source.query(sql)
            data = format_table_datas(data)
            all_datas.extend(data)
        datas_df = pd.DataFrame(data=all_datas)
        return datas_df

    # def _search_gps(self, dispatch_id, start_time, end_time, origin_to_dest):
    #     table_name = self.catelogs.get('gps', '')
    #     if not table_name:
    #         return []
    #
    #     sql = f"select * from {table_name} where dispatch_id in ('{dispatch_id}') " \
    #           f"and start_time >= '{start_time}' and end_time <= '{end_time}'"
    #     datas = self.data_source.query(sql)
    #     datas = format_table_datas(datas)
    #
    #     new_datas = []
    #     veh_no = ''
    #     for data in datas:
    #         road_name = data['road_name']
    #
    #         item = {
    #             road_name: data['track_duration']
    #         }
    #         new_datas.append(item)
    #         veh_no = data['veh_no']
    #
    #     return {veh_no: {origin_to_dest: new_datas}}

    def analyze_vehicle_route(self, vehicles_routes: dict[str, dict[str, dict]]):
        """
        使用最长公共子序列（LCS）算法来计算路线相似度，这更适合比较道路名称序列。
        :param actural_routes: {"车牌号": {"origin_to_dest": [{实际道路: 轨迹时长}]}}
        :return:
        """
        final_res = {}
        # 车辆信息 + origin_dest信息
        vehicles = list(vehicles_routes.keys())
        origin_to_dests = []
        for _, origin_dest_routes in vehicles_routes.items():
            origin_to_dests.extend(list(origin_dest_routes.keys()))
        origin_to_dests = list(set(origin_to_dests))
        # 车辆|地址之间的常规路径
        regular_routes, veh_regular_routes = {}, {}
        search_res = self._search_regular_routes(veh_nos=vehicles, origin_to_dests=origin_to_dests)
        for item in search_res:
            veh_no = item['veh_no']
            origin_to_dest = item['origin_to_dest']
            routes = item['routes']
            try:
                routes = json.loads(routes)
            except:
                routes = []

            top_roads = item['top_roads']
            try:
                top_roads = json.loads(top_roads)
            except:
                top_roads = []

            all_roads = item['all_roads']
            try:
                all_roads = json.loads(all_roads)
            except:
                all_roads = {}

            if veh_no and veh_no in vehicles:
                values = veh_regular_routes.get(veh_no, {})
                infos = values.get(origin_to_dest, {})
                infos['routes'] = infos.get('routes', []) + routes
                infos['top_roads'] = infos.get('top_roads', []) + top_roads
                all_roads_ = infos.get('all_roads', {})
                for k, v in all_roads.items():
                    all_roads_[k] = v
                infos['all_roads'] = all_roads_
                values[origin_to_dest] = infos
                veh_regular_routes[veh_no] = values
            else:
                infos = regular_routes.get(origin_to_dest, {})
                infos['routes'] = infos.get('routes', []) + routes
                infos['top_roads'] = infos.get('top_roads', []) + top_roads
                all_roads_ = infos.get('all_roads', {})
                for k, v in all_roads.items():
                    all_roads_[k] = v
                infos['all_roads'] = all_roads_
                regular_routes[origin_to_dest] = infos

        # if not regular_routes:
        #     return {
        #         'status': '未知',
        #         'similarity': 0,
        #         'reason': f'没有该车辆 {vehicle} 在此起始-目的地({origin}-{destination})的历史轨迹数据',
        #         'regular_routes': regular_routes,
        #         'actual_route': actual_route
        #     }
        if not regular_routes and not veh_regular_routes:
            return final_res

        # 计算路线相似度
        for veh_no, origin_dest_routes in vehicles_routes.items():
            res = {}
            for origin_to_dest, actural_route in origin_dest_routes.items():
                items = []
                veh_infos = veh_regular_routes.get(veh_no, {}).get(origin_to_dest, {})
                reg_infos = regular_routes.get(origin_to_dest, {})
                # 有实际路线：则默认是与该车辆的常规路线比较；如果该车辆没有这个origin_to_dest，那么就比较通用路线
                # 没有实际路线：那么就是该车辆的路线与通用路线比较
                if actural_route:
                    item = {}
                    # 和自身路线比较
                    veh_routes = veh_infos.get('routes', [])
                    veh_top_roads = veh_infos.get('top_roads', [])
                    veh_all_roads = veh_infos.get('all_roads', [])

                    if veh_routes:
                        max_similarity, status, reason, out_top_roads, out_roads, over_duration_roads = \
                            self.cal_similar(actual_route=actural_route, regular_routes=veh_routes,
                                             regular_top_roads=veh_top_roads, regular_all_roads=veh_all_roads)
                        item['与自身历史路线比较'] = {
                            'status': status,
                            'similarity': max_similarity,
                            'reason': f'该车辆 {veh_no} 在此起始-目的地({origin_to_dest})的{reason}',
                            'actual_route': actural_route,
                            'regular_routes': veh_routes,
                            'out_top_roads': out_top_roads,
                            'out_all_roads': out_roads,
                            'over_duration_roads': over_duration_roads
                        }
                    else:
                        item['与自身历史路线比较'] = {
                                'status': '未知',
                                'similarity': 0,
                                'reason': f'没有该车辆 {veh_no} 在此起始-目的地({origin_to_dest})的历史轨迹数据',
                                'actual_route': actural_route,
                                'regular_routes': veh_routes,
                                'out_top_roads': [],
                                'out_all_roads': [],
                                'over_duration_roads': []
                        }

                    # 和通用路线比较
                    routes = reg_infos.get('routes', [])
                    top_roads = reg_infos.get('top_roads', [])
                    all_roads = reg_infos.get('all_roads', [])
                    if routes:
                        max_similarity, status, reason, out_top_roads, out_roads, over_duration_roads = \
                            self.cal_similar(actual_route=actural_route, regular_routes=routes,
                                             regular_top_roads=top_roads, regular_all_roads=all_roads)
                        item['与通用历史路线比较'] = {
                            'status': status,
                            'similarity': max_similarity,
                            'reason': f'该车辆 {veh_no} 在此起始-目的地({origin_to_dest})的{reason}',
                            'actual_route': actural_route,
                            'regular_routes': routes,
                            'out_top_roads': out_top_roads,
                            'out_all_roads': out_roads,
                            'over_duration_roads': over_duration_roads
                        }
                    else:
                        item['与通用历史路线比较'] = {
                            'status': '未知',
                            'similarity': 0,
                            'reason': f'没有在此起始-目的地({origin_to_dest})的历史轨迹数据',
                            'actual_route': actural_route,
                            'regular_routes': routes,
                            'out_roads': [],
                            'out_regular_roads': [],
                            'over_duration_roads': []
                        }

                    items.append(item)
                else:
                    veh_routes = veh_infos.get('routes', [])
                    routes = reg_infos.get('routes', [])
                    top_roads = reg_infos.get('top_roads', [])
                    all_roads = reg_infos.get('all_roads', [])
                    if routes:
                        for actural_route in vehicles_routes:
                            item = {}
                            max_similarity, status, reason, out_top_roads, out_roads, over_duration_roads = \
                                self.cal_similar(actual_route=actural_route, regular_routes=routes,
                                                 regular_top_roads=top_roads, regular_all_roads=all_roads)
                            item['与通用历史路线比较'] = {
                                'status': status,
                                'similarity': max_similarity,
                                'reason': f'该车辆 {veh_no} 在此起始-目的地({origin_to_dest})的{reason}',
                                'actual_route': actural_route,
                                'regular_routes': veh_routes,
                                'out_top_roads': out_top_roads,
                                'out_all_roads': out_roads,
                                'over_duration_roads': over_duration_roads
                            }
                            items.append(item)
                    else:
                        item = {}
                        item['与通用历史路线比较'] = {
                            'status': '未知',
                            'similarity': 0,
                            'reason': f'没有在此起始-目的地({origin_to_dest})的历史轨迹数据',
                            'actual_route': actural_route,
                            'regular_routes': routes,
                            'out_roads': [],
                            'out_regular_roads': [],
                            'over_duration_roads': []
                        }
                        items.append(item)

                res[origin_to_dest] = items
            final_res[veh_no] = res

        return final_res

    def analyze_loc_patterns(self, goods_infos: list[dict]) -> dict:
        # goods_info = {
        #     'goods_name': goods_name,
        #     'danger_goods_type': danger_goods_type,
        #     'goods_weight': goods_weight,
        #     'origin_to_dest': origin_to_dests
        # }
        final_res = {}
        # 货物信息+地址信息
        goods_name_and_types, origin_to_dests, locations = [], [], []
        for good_info in goods_infos:
            goods_name_and_types.append(f'{good_info["goods_name"]}_{good_info["danger_goods_type"]}')
            origin_to_dests.append(good_info['origin_to_dest'])
            origin, dest = good_info['origin_to_dest'].split('_to_')
            dest = f'1_{dest}' if origin.startswith('1_') else f'2_{dest}'
            locations.append(origin)
            locations.append(dest)
        origin_to_dests = list(set(origin_to_dests))
        locations = list(set(locations))
        # 具体地址的流动模式、货物模式
        loc_flow_goods_patterns, loc_goods_patterns = {}, {}
        search_res = self._search_loc_patterns(goods_name_and_types=goods_name_and_types,
                                                     origin_to_dests=origin_to_dests, locations=locations)
        for item in search_res:
            origin_to_dest = item['origin_to_dest']
            goods_name_and_type = item['goods_name_and_type']
            weights = item['weights']
            freqs = item['freqs']
            location = item['location']
            inflow = item['inflow']
            outflow = item['outflow']
            inflow_locations = item['inflow_locations']
            outflow_locations = item['outflow_locations']
            if origin_to_dest:
                values = loc_flow_goods_patterns.get(origin_to_dest, {})
                infos = values.get(goods_name_and_type, {})
                infos['weights'] = infos.get('weights', 0) + weights
                infos['freqs'] = infos.get('freqs', 0) + freqs
                values[goods_name_and_type] = infos
                loc_flow_goods_patterns[origin_to_dest] = values
            else:
                values = loc_goods_patterns.get(location, {})
                infos = values.get(goods_name_and_type, {})
                infos['inflow'] = infos.get('inflow', 0) + inflow
                infos['outflow'] = infos.get('outflow', 0) + outflow
                infos['inflow_locations'] = infos.get('inflow_locations', inflow_locations)
                infos['outflow_locations'] = infos.get('outflow_locations', outflow_locations)
                values[goods_name_and_type] = infos
                loc_goods_patterns[location] = values

        # 检测异常
        for good_info in goods_infos:
            flow_items, origin_items, dest_items = [], [], []
            goods_name = good_info['goods_name']
            danger_goods_type = good_info['danger_goods_type']
            try:
                goods_weight = float(good_info['goods_weight'])
            except:
                goods_weight = 0
            origin_to_dest = good_info['origin_to_dest']
            origin, dest = good_info['origin_to_dest'].split('_to_')
            dest = f'1_{dest}' if origin.startswith('1_') else f'2_{dest}'
            goods_name_and_type = f'{goods_name}_{danger_goods_type}'

            # origin_to_dest：的流动模式
            flow_patterns = loc_flow_goods_patterns.get(origin_to_dest, {})
            if not flow_patterns:
                item = {
                    'status': '未知',
                    'reason': f'此起始-目的地({origin_to_dest})没有历史货物运输记录。',
                    'location_pattern': flow_patterns,
                    'goods_info': good_info,
                    'type': 'path'
                }
                flow_items.append(item)
            else:
                flow_pattern = flow_patterns.get(goods_name_and_type, {})
                if not flow_pattern:
                    item = {
                        'status': '未知',
                        'reason': f'此起始-目的地({origin_to_dest})没有运输货物({goods_name_and_type})的历史运输记录。',
                        'location_pattern': flow_patterns,
                        'goods_info': good_info,
                        'type': 'path'
                    }
                    flow_items.append(item)
                else:
                    weights = flow_pattern.get('weights', 0)
                    freqs = flow_pattern.get('freqs', 0)
                    if goods_weight > weights * 1.0 / freqs * 1.2:
                        item = {
                            'status': '异常',
                            'reason': f'在起始-目的地({origin_to_dest})的该货物({goods_name_and_type})的运量已经超出正常的运输量。',
                            'location_pattern': flow_patterns,
                            'goods_info': good_info,
                            'type': 'path'
                        }
                        flow_items.append(item)
                    else:
                        item = {
                            'status': '正常',
                            'reason': f'在起始-目的地({origin_to_dest})正常该货物({goods_name_and_type})的运输量正常。',
                            'location_pattern': flow_patterns,
                            'goods_info': good_info,
                            'type': 'path'
                        }
                        flow_items.append(item)

            # origin：的模式
            origin_pattern = loc_goods_patterns.get(origin, {})
            if not origin_pattern:
                item = {
                    'status': '未知',
                    'reason': f'没有此地({origin})没有向外运输货物的历史记录。',
                    'location_pattern': origin_pattern,
                    'goods_info': good_info,
                    'type': 'origin'
                }
                origin_items.append(item)
            else:
                pattern = origin_pattern.get(goods_name_and_type, {})
                if not pattern:
                    item = {
                        'status': '未知',
                        'reason': f'没有此地({origin})向外运输货物({goods_name_and_type})的历史记录。',
                        'location_pattern': origin_pattern,
                        'goods_info': good_info,
                        'type': 'origin'
                    }
                    origin_items.append(item)
                else:
                    outflow_locations = pattern.get('outflow_locations', '{}')
                    try:
                        outflow_locations = json.loads(outflow_locations)
                    except:
                        outflow_locations = {}
                    if dest in outflow_locations:
                        outflow = outflow_locations[dest]
                        if goods_weight > outflow * 1.2:
                            item = {
                                'status': '异常',
                                'reason': f'在起始-目的地({origin_to_dest})之间运输的货物({goods_name_and_type})运量已经超出{origin}流出的正常运输量。',
                                'location_pattern': origin_pattern,
                                'goods_info': good_info,
                                'type': 'origin'
                            }
                            origin_items.append(item)
                        else:
                            item = {
                                'status': '正常',
                                'reason': f'在起始-目的地({origin_to_dest})之间运输的货物({goods_name_and_type})运量正常。',
                                'location_pattern': origin_pattern,
                                'goods_info': good_info,
                                'type': 'origin'
                            }
                            origin_items.append(item)
                    else:
                        item = {
                            'status': '未知',
                            'reason': f'没有此地({origin})向外运输货物({goods_name_and_type})的历史记录。',
                            'location_pattern': origin_pattern,
                            'goods_info': good_info,
                            'type': 'origin'
                        }
                        origin_items.append(item)

            # dest：的模式
            dest_pattern = loc_goods_patterns.get(dest, {})
            if not dest_pattern:
                item = {
                    'status': '未知',
                    'reason': f'没有流入此地({origin})的货物运输历史记录。',
                    'location_pattern': dest_pattern,
                    'goods_info': good_info,
                    'type': 'dest'
                }
                dest_items.append(item)
            else:
                pattern = dest_pattern.get(goods_name_and_type, {})
                if not pattern:
                    item = {
                        'status': '未知',
                        'reason': f'没有流入此地({origin})的货物({goods_name_and_type})历史记录。',
                        'location_pattern': dest_pattern,
                        'goods_info': good_info,
                        'type': 'dest'
                    }
                    dest_items.append(item)
                else:
                    inflow_locations = pattern.get('inflow_locations', '{}')
                    try:
                        inflow_locations = json.loads(inflow_locations)
                    except:
                        inflow_locations = {}
                    if origin in inflow_locations:
                        inflow = inflow_locations[origin]
                        if goods_weight > inflow * 1.2:
                            item = {
                                'status': '异常',
                                'reason': f'在起始-目的地({origin_to_dest})之间运输的货物({goods_name_and_type})运量已经超出流入{dest}的正常运输量。',
                                'location_pattern': dest_pattern,
                                'goods_info': good_info,
                                'type': 'dest'
                            }
                            dest_items.append(item)
                        else:
                            item = {
                                'status': '正常',
                                'reason': f'在起始-目的地({origin_to_dest})之间运输的货物({goods_name_and_type})运量正常。',
                                'location_pattern': dest_pattern,
                                'goods_info': good_info,
                                'type': 'dest'
                            }
                            dest_items.append(item)
                    else:
                        item = {
                            'status': '未知',
                            'reason': f'没有流入此地({origin})的货物({goods_name_and_type})历史记录。',
                            'location_pattern': dest_pattern,
                            'goods_info': good_info,
                            'type': 'dest'
                        }
                        dest_items.append(item)

            values = final_res.get(origin_to_dest, [])
            values.extend(flow_items)
            final_res[origin_to_dest] = values
            values = final_res.get(origin, [])
            values.extend(origin_items)
            final_res[origin] = values
            values = final_res.get(dest, [])
            values.extend(dest_items)
            final_res[dest] = values
        return final_res

    def analyze_bill_an(self, bill_no: str) -> tuple[dict[str, str] | dict[str, str] | dict[str, str], Any]:
        search_res, goods_datas = self._search_bill_an(bill_no=bill_no)
        if len(search_res) > 0:
            res = search_res[0]
            explanation = ''
            only_down = res['only_down']
            only_up = res['only_up']
            up_over_down = res['up_over_down']
            up_lower_down = res['up_lower_down']
            goods_name_an = res['goods_name_an']
            # goods_type_an = res['goods_type_an']
            if only_down == 'YES':
                explanation += '\n 只有卸货记录，没有装货记录；'
            if only_up == 'YES':
                explanation += '\n 只有装货记录，没有卸货记录；'
            if up_over_down == 'YES':
                explanation += '\n 装货重量大于卸货重量；'
            if up_lower_down == 'YES':
                explanation += '\n 装货重量小于卸货重量；'
            if goods_name_an == 'YES':
                explanation += '\n 装卸货物名称不一致；'
            # if goods_type_an == 'YES':
            #     explanation += '\n 装卸货物品类不一致；'
            if explanation:
                item = {
                    'status': '异常',
                    'reason': explanation
                }
            else:
                item = {
                    'status': '正常',
                    'reason': '正常'
                }
        else:
            item = {
                'status': '正常',
                'reason': '正常'
            }

        return item, goods_datas


    def detect_all_anomalies(self, veh_no, bill_no) -> dict[str, dict[Any, dict[str, list[dict[str, Any]]]]]:
        gps_items, goods_items = {}, []
        if bill_no:
            goods_df = self._search_goods(dispatch_ids=[bill_no] if bill_no else [], veh_nos=[veh_no] if veh_no else [])
            if 'start_gps_time' in goods_df:
                goods_df = goods_df.sort_values(by=['start_gps_time'])
            goods_ids = []
            for record in goods_df.to_dict(orient='records'):
                # goods_id = str(record['goods_id']).split('.')[0]
                # rel_goods_id = str(record['rel_goods_id']).split('.')[0]
                # if rel_goods_id == 'None':
                #     continue
                # elif goods_id in goods_ids or rel_goods_id in goods_ids:
                #     continue
                # else:
                #     goods_ids.append(goods_id)
                #     goods_ids.append(rel_goods_id)

                # dispatch_id = record['dispatch_id']
                # goods_type = record['goods_type']
                # if goods_type == '装货':
                #     up_loc, up_provice, up_city, up_county, up_time = record['goods_area'], record['province'], \
                #         record['city'], record['county'], record['goods_time']
                #     down_loc, down_provice, down_city, down_county, down_time = record['rel_goods_area'], \
                #         record['rel_province'], record['rel_city'], record['rel_county'], record['rel_goods_time']
                # else:
                #     down_loc, down_provice, down_city, down_county, down_time = record['goods_area'], record['province'], \
                #         record['city'], record['county'], record['goods_time']
                #     up_loc, up_provice, up_city, up_county, up_time = record['rel_goods_area'], record['rel_province'], \
                #         record['rel_city'], record['rel_county'], record['rel_goods_time']
                up_loc, up_provice, up_city, up_county, up_time = record['load_goods_area'], record['load_province'], \
                        record['load_city'], record['load_county'], record['load_time']
                down_loc, down_provice, down_city, down_county, down_time = record['unload_goods_area'], \
                    record['unload_province'], record['unload_city'], record['unload_county'], record['unload_time']
                if up_city != down_city or up_provice != down_provice:
                    route = f'1_{up_provice}_{up_city}_to_{down_provice}_{down_city}'
                else:
                    route = f'2_{up_loc}_to_{down_loc}'
                goods_name = record['goods_name']
                danger_goods_type = record['danger_goods_type']
                # goods_weight = record['goods_weight']
                goods_weight = record['weight']
                good = f'{goods_name}_{danger_goods_type}'
                # 轨迹信息
                # if up_time and down_time:
                #     gps_item = self._search_gps(dispatch_id=dispatch_id, start_time=up_time,
                #                                  end_time=down_time, origin_to_dest=route)
                #     gps_items.append(gps_item)
                vehicle_no = record['veh_no']
                gps_item = {record['road_name']: record['total_travel_duration']}
                veh_values = gps_items.get(vehicle_no, {})
                route_values = veh_values.get(route, [])
                route_values.append(gps_item)
                veh_values[route] = route_values
                gps_items[vehicle_no] = veh_values
                # 货物信息
                goods_item = {
                    'goods_name': goods_name,
                    'danger_goods_type': danger_goods_type,
                    'goods_weight': goods_weight,
                    'origin_to_dest': route
                }
                goods_items.append(goods_item)
        else:
            goods_df = pd.DataFrame()

        vehicle_anomalies = []
        # 轨迹异常
        if gps_items:
            for veh_no, veh_datas in gps_items.items():
                if not veh_no:
                    continue
                veh_detect_res = self.analyze_vehicle_route(vehicles_routes={veh_no: veh_datas})
                vehicle_anomalies.append(veh_detect_res)
        # elif veh_no:
        #     # {"车牌号": {"origin_to_dest": {实际道路: 轨迹时长}}}
        #     item = {
        #         veh_no: {}
        #     }
        #     veh_detect_res = self.analyze_vehicle_route(vehicles_routes=item)
        #     vehicle_anomalies.append(veh_detect_res)

        # 货物异常
        if goods_items:
            goods_detect_res = self.analyze_loc_patterns(goods_infos=goods_items)
        else:
            goods_detect_res = {}

        # 订单异常
        bill_detect_res, goods_data = self.analyze_bill_an(bill_no)
        bill_detect_res['data'] = goods_data

        return {
            'veh_detect_res': vehicle_anomalies,
            'goods_detect_res': goods_detect_res,
            'bill_detect_res': bill_detect_res
        }

    @construct_final_answer
    def _run(
            self,
            factors: dict,
            chat_history: Optional[list] = None,
            run_manager: Optional[CallbackManagerForToolRun] = None,
    ):
        """
        基于用户问题inputs、历史信息chat history，执行工具
        :param inputs:
        :param chat_history:
        :param run_manager:
        :return:
        """
        res = {}
        veh_nos = factors.get('veh_nos', [])
        bill_nos = factors.get('bill_nos', [])
        # 逻辑视图
        if veh_nos and bill_nos:
            for veh_no in veh_nos:
                for bill_no in bill_nos:
                    tmp_res = self.detect_all_anomalies(veh_no=veh_no, bill_no=bill_no)
                    res[f'veh_no={veh_no}#@#bill_no={bill_no}'] = tmp_res
        elif veh_nos:
            for veh_no in veh_nos:
                tmp_res = self.detect_all_anomalies(veh_no=veh_no, bill_no='')
                res[f'veh_no={veh_no}'] = tmp_res
        elif bill_nos:
            for bill_no in bill_nos:
                tmp_res = self.detect_all_anomalies(veh_no='', bill_no=bill_no)
                res[f'bill_no={bill_no}'] = tmp_res
        self.session.add_agent_logs(
            self._result_cache_key,
            logs=res
        )
        return res

    @async_construct_final_answer
    async def _arun(
            self,
            factors: dict,
            chat_history: Optional[list] = None,
            run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        return self._run(factors=factors)
    
    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
            if tool_res:
                log['result'] = tool_res

            ans_multiple.cache_keys[self._result_cache_key] = {
                "tool_name": "danger_goods_transport",
                "title": log.get("title", "danger_goods_transport"),
            }


