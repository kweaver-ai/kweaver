"""
@File: calculator.py
@Date: 2024-09-11
@Author: Danny.gao
@Desc: 
"""

import re
import json
from enum import Enum
import numpy as np
import pandas as pd
from typing import Any, Optional, Type, Dict
import matplotlib.pyplot as plt
from scipy import stats
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox as lb_test
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_absolute_error, mean_squared_error
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer, AFTool, ToolMultipleResult
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName
from datetime import datetime, timedelta
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.utils._common import format_table_datas

_DESCS = {
    'tool_description': {
        'cn': '数据预测工具：对未来时间的货运量、运单数量、运输趟次、车辆数量、驾驶时长、运输时长等数据进行预测',
        'en': 'calculate transport svolume based on indicators and corresponding analysis dimensions',
    },
    'chat_history': {
        'cn': '对话历史',
        'en': 'chat history',
    },
    'input': {
        'cn': '一个没有歧义的表述清晰的问题'
    },
    # 'datas': {
    #     'cn': '根据用户问题抽取的数据，是一个时间序列数据列表，一定包括至少两列：1. 表示时间的列，譬如年、月、周、日、时间等；2. 表示值的列，譬如货运量、销量等。\n'
    #           '示例1：[{"月": "2024-05", "货运量": "30"}, {"月": "2024-06", "货运量": "40"}]\n'
    #           '示例2：[{"日": "2024-05-24", "货运量": "4"}, {"日": "2024-05-25", "货运量": "3"}]\n'
    #           '示例3：[{"周": "22周", "货运量": "30"}, {"日": "23周", "货运量": "40"}]',
    #     'en': '',
    # }
}


class ArimaInput(BaseModel):
    # datas: list = Field(description=_DESCS['datas']['cn'])
    input: str = Field(description=_DESCS["input"]["cn"])

class ArimaTool(AFTool):
    name: str = ToolName.arima_prediction.value
    description: str = _DESCS['tool_description']['cn']
    language: str = 'cn'
    background: str = '--'
    args_schema: Type[BaseModel] = ArimaInput
    llm: Optional[Any] = None
    retry_times: int = 3
    session_id: Optional[Any] = None
    session: Optional[RedisHistorySession] = None
    text2sql_tool: Text2SQLTool

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

    def execut(self, sql):
        sql = sql.replace('\n', '')
        logger.debug(f'text2sql tool\'s output: {sql}')

        def replace_(sql, col_list):
            for _ in col_list:
                if f'{_}" = ' in sql:
                    sql = sql.replace(f'{_}"=', f'{_}"<=').replace(f'{_}" =', f'{_}" <=')
                if f'{_}"=' in sql:
                    sql = sql.replace(f'{_}"=', f'{_}"<=').replace(f'{_}" =', f'{_}" <=')
            return sql
        year_list = ['year', '年', '年数', '年份']
        has_quarter = ['quarter', '季度', '季度数', '季度']
        month_list = ['month', 'month', '月份', '月数', '月']
        week_list = ['week', '周', '周数']
        has_day = ['day', '日', '天数', '天']
        load_time_list = ['load_time', '装货时间']
        unload_time_list = ['unload_time', '卸货时间']
        sql = replace_(sql, year_list + has_quarter + month_list + week_list + has_day + load_time_list + unload_time_list)

        sql = re.sub(r'(AND|and) T\d.*."?rn"? = \d+''', r'', sql)
        sql = re.sub(r'(WHERE|where) T\d.*."?rn"? = \d+ (AND|and)', r'WHERE', sql)

        logger.debug(f'text2sql tool\'s output (new_sql): {sql}')

        datas = self.text2sql_tool.data_source.query(sql)
        datas = format_table_datas(datas)
        return datas


    def str_to_date(self, time_str):
        year = datetime.strptime('2024年', '%Y年').year  # 提取年份
        week = int(time_str.replace('年', '').replace('周', '').replace('第', ''))  # 提取周数
        # 使用timedelta将一周的第一天定位到周一
        return datetime.strptime(f'{year}-01-01', '%Y-%m-%d') + timedelta(weeks=(week - 1), days=-7)

    def format_inputs(self, datas: list):
        # datas = [
        #     {
        #         '周': '2024-06-03 00:00:00.000',
        #         '爆炸品货运量': '169997.77'
        #     },
        #     {
        #         '周': '2024-06-17 00:00:00.000',
        #         '爆炸品货运量': '184868.4'
        #     },
        #     {
        #         '周': '2024-06-24 00:00:00.000',
        #         '爆炸品货运量': '175010.81'
        #     },
        #     {
        #         '周': '2024-05-27 00:00:00.000',
        #         '爆炸品货运量': '37662.16'
        #     },
        #     {
        #         '周': '2024-06-10 00:00:00.000',
        #         '爆炸品货运量': '136052.23'
        #     }
        # ]
        print('*****')
        print(datas)
        df = pd.DataFrame(data=datas)
        cols = df.columns.values
        n = len(cols)
        if n < 1 or len(df) < 2:
            return False, '', '', df
        # value_field_name = cols[-1]
        may_fields = [_ for _ in cols if ('运量' in _ or '货重' in _
                                          or '运单数量' in _ or '运输趟次' in _ or '车辆数' in _ or '驾驶时长' in _ or '运输时长' in _)
                      and '总' not in _]
        if len(may_fields) < 1:
            return False, '', '', df

        value_field_name = may_fields[0]
        # df['goods_weight'] = pd.to_numeric(df[value_field_name])
        df[value_field_name] = pd.to_numeric(df[value_field_name])
        time_field_name = ''
        for i in range(n - 1):
            col = cols[i]
            if col == value_field_name:
                continue
            if '年' in col or 'year' in col or 'yearly' in col:
                time_field_name = col
                df[col] = pd.to_datetime(df[col])
                df[time_field_name] = df[col].dt.to_period('Y')
                break
            elif '季度' in col or 'quarter' in col or 'quarterly' in col:
                time_field_name = col
                df[col] = df[col].apply(self.str_to_date)
                df[col] = pd.to_datetime(df[col])
                df[time_field_name] = df[col].dt.to_period('Q')
                # df = df.drop(col, axis=1)
                break
            elif '月' in col or 'month' in col or 'monthly' in col:
                time_field_name = col
                df[col] = df[col].apply(self.str_to_date)
                df[col] = pd.to_datetime(df[col])
                df[time_field_name] = df[col].dt.to_period('M')
                # df = df.drop(col, axis=1)
                break
            elif '周' in col or 'week' in col or 'weekly' in col:
                time_field_name = col
                df[col] = df[col].apply(self.str_to_date)
                df[col] = pd.to_datetime(df[col])
                df[time_field_name] = df[col].dt.to_period('W')
                # df = df.drop(col, axis=1)
                break
            elif '日' in col or 'day' in col or 'daily' in col:
                time_field_name = col
                df[col] = pd.to_datetime(df[col])
                df[time_field_name] = df[col].dt.to_period('D')
                # df = df.drop(col, axis=1)
                break
            elif '时间' in col or 'time' in col:
                time_field_name = col
                df[time_field_name] = pd.to_datetime(df[col])
                # df = df.drop(col, axis=1)
                break
            else:
                time_field_name = ''
        if not time_field_name:
            return False, '', df

        # 排序、索引
        df = df.sort_values(by=time_field_name)
        # df = df.set_index(time_field_name)
        return True, time_field_name, value_field_name, df

    def _get_pq(self, datas):
        """
        BIC 准则：综合考虑残差大小和自变量个数-残差越小、自变量个数越小，则BIC值越小，则模型越优；根据该准则可以获取p|q、参数;d一般取值1即可，即进行一次差分即可
        :param datas:
        :return:
        """
        return 1, 1
        # if len(datas) < 10:
        #     return 1, 1
        # # 一般阶数不超过len/10
        # pmax = int(len(datas)/10)
        # qmax = int(len(datas)/10)
        # bic_matrix = []
        # for p in range(pmax+1):
        #     tmp = []
        #     for q in range(qmax+1):
        #         try:
        #             # 将bic存入二维数组
        #             tmp.append(ARIMA(datas, order=(p, 1, q)).fit().bic)
        #         except:
        #             tmp.append(None)
        #     bic_matrix.append(tmp)
        # bic_matrix = pd.DataFrame(bic_matrix)
        # # 取bic最小的索引
        # p, q = bic_matrix.stack().astype('float64').idxmin()
        # return p, q

    def check_adf_stable(self, datas):
        """
        ARIMA模型：需要数据是稳定的，这样才能进行规律的挖掘和拟合
        1. 稳定的数据：是指均值、方差是一个常量，自协方差与时间无关
        2. 数据的稳定性可以用单位根检验Dickey-Fuller Test进行判断，即在一定置信水平之下，假设时序数据是非稳定，序列具有单位根；因此，对于一个平稳的时序数据，我们要在给定的置信水平上显著拒绝原假设
        """
        try:
            explanation = ''
            is_stable = True
            ads_res = adfuller(datas)
            t = abs(ads_res[0])
            for k, v in ads_res[4].items():
                v = abs(v)
                if t >= v:
                    explanation = f'在{k}的显著性水平下显著拒绝原假设，该时序数据是稳定的数据。'
                    break
            if not explanation:
                is_stable = False
                explanation = f'在10%的显著性水平下不显著拒绝原假设，该时序数据不是稳定的数据。'
            item = {
                't统计量': ads_res[0],
                't统计量p值': ads_res[1],
                '延迟阶数': ads_res[2],
                '观测值个数': ads_res[3],
                '临界区间': {k: v for k, v in ads_res[4].items()},
                'explanation': explanation,
                'is_stable': is_stable
            }
        except Exception as e:
            item = {
                't统计量': None,
                't统计量p值': None,
                '延迟阶数': None,
                '观测值个数': None,
                '临界区间': None,
                'explanation': str(e),
                'is_stable': None
            }
        return item

    def check_lb_random(self, datas, lags):
        """
        Ljung-box检验：随机性检验。如果数据是白噪声（即自无关、没有规律），那么该数据就没有建模的价值，纯粹是随机游走的
        LB的原假设：时序数据不相关，即是纯随机的；如果拒绝原假设，则说明有一定的规律
        :param datas:
        :return:
        """
        try:
            df = lb_test(datas, return_df=True, lags=min(lags, 5))
            lb_pvalue = list(df['lb_pvalue'])
            is_random = False
            for p in lb_pvalue:
                if p > 0.05:
                    is_random = True
                    break
            if is_random:
                explanation = '该时序数据检验之后五期的p值不全部小于0.05，说明在0.05的显著性水平之下，不显著拒绝原假设，该时序数据是纯随机序列。'
            else:
                explanation = '该时序数据检验之后五期的p值全部小于0.05，说明在0.05的显著性水平之下，显著拒绝原假设，该时序数据不是纯随机序列。'
            item = {
                'dataframe': df.to_dict(orient='records') if isinstance(df, pd.DataFrame) else df,
                'explanation': explanation
            }
        except Exception as e:
            item = {
                'dataframe': None,
                'explanation': str(e)
            }
        return item

    def check_season(self, datas, fname):
        try:
            explanation = ''
            decomposition = seasonal_decompose(datas)
            plt.figure()
            decomposition.plot()
            # plt.savefig(f'{base_path}/{fname}')
            # plt.show()

            trend = decomposition.trend
            seasonal = decomposition.seasonal
            residual = decomposition.resid

            item = {
                'trend': trend.to_dict(orient='records') if isinstance(trend, pd.DataFrame) else trend,
                'seasonal': seasonal.to_dict(orient='records') if isinstance(seasonal, pd.DataFrame) else seasonal,
                'residual': residual.to_dict(orient='records') if isinstance(residual, pd.DataFrame) else residual,
                # 'fname': fname,
                'explanation': explanation
            }
        except Exception as e:
            item = {
                'trend': None,
                'seasonal': None,
                'residual': None,
                # 'fname': None,
                'explanation': str(e)
            }
        return item

    def check_resid(self, resid):
        """
        原假设：随机游走
        :param resid:
        :return:
        """
        try:
            redis_normal = stats.normaltest(resid)
            p = redis_normal.pvalue
            if p > 0.05:
                explanation = f'在0.05的显著性水平下，残差不服从原假设，即残差不是随机白噪声，可能模型拟合的规律不够充分，需要进一步处理。'
            else:
                explanation = f'在0.05的显著性水平下，残差服从原假设（随机游走），说明残差是纯随机序列，模型已经充分提取了数据里面的规律，拟合良好。'
            item = {
                'redis': resid.to_dict(orient='records') if isinstance(resid, pd.DataFrame) else resid,
                'redis_normal': redis_normal,
                'explanation': explanation,
                # 'fname': self.draw_data(datas=resid, fname='resid.png'),
                'lb_test': self.check_lb_random(datas=resid, lags=len(resid)//2),
                'resid_acf': self.draw_acf_pacf(datas=resid, lags=len(resid)//2, fname='resid_data.png')
            }
        except Exception as e:
            item = {
                'redis': None,
                'redis_normal': None,
                'explanation': str(e),
                # 'fname': None,
                'lb_test': None,
                'resid_acf': None
            }
        return item

    def evaluation(self, y_test, y_predict):
        """
        MAE：平均绝对误差，是预测值与真实值之间的绝对误差平均值，该指标对异常值不敏感，因此能够很好的反映预测值误差的实际情况，该指标越小表示模型拟合越好
        RMSE：均方根误差，是MSE的平方根，通过开平方，使得误差值在数量级上更加直观，由于该指标对异常值敏感，因此能够提供比MAE更加精细的误差测量，该指标越小表示模型拟合越好
        :param y_test:
        :param y_predict:
        :return:
        """
        mae = mean_absolute_error(y_test, y_predict)
        rmse = np.sqrt(mean_squared_error(y_test, y_predict))
        return mae, rmse

    def predict(self, time_field, value_field, dataframe: pd.DataFrame, sql, cites):
        """
        预测任务
        :param indicator:
        :param dimensions:
        :return:
        """
        if time_field not in dataframe:
            return {}
        time_series = dataframe.set_index(time_field)
        """ 2. 数据校验: ADF + LB """
        adf_res = self.check_adf_stable(datas=time_series)
        lb_res = self.check_lb_random(datas=time_series, lags=len(time_series)//2)
        season = self.check_season(datas=time_series, fname='season')

        """ 3. 模型拟合 """
        p, q = self._get_pq(datas=time_series)
        is_stable = True if 'is_stable' in adf_res and adf_res['is_stable'] else False
        d = 0 if is_stable else 1
        model = ARIMA(time_series, order=(p,d,q)).fit()

        """ 4. 残差校验模型拟合能力 """
        resid_res = self.check_resid(resid=model.resid)

        """ 5. 模型预测 """
        predictions = model.predict(1, len(time_series)+3)


        """ 6. 模型评价 """
        mae, rmse = self.evaluation(time_series.to_numpy(), predictions[:len(time_series)].to_numpy())

        """ 7. 封装结果 """
        if isinstance(predictions, pd.Series):
            predictions = predictions.to_frame()
            indexes = predictions.index.tolist()
            new_items = []
            for index, record in zip(indexes, predictions.to_dict(orient='records')):
                record[time_field] = str(index)
                new_items.append(record)
            predictions = pd.DataFrame(data=new_items).to_dict(orient='records')
        if isinstance(dataframe, pd.DataFrame):
            dataframe[time_field] = dataframe[time_field].astype(str)
            dataframe = dataframe.to_dict(orient='records')

        final_res = {
            'data': dataframe,
            'pre_model': {
                'adf': adf_res,
                'lb': lb_res,
                'season': season
            },
            'model': {
                'p': p,
                'q': q,
                'd': d,
                'predictions': predictions
            },
            'post_model': {
                'resid': resid_res,
                'evaluate': {
                    'mae': mae,
                    'rmse': rmse
                }
            },
            'time_field':time_field, 'value_field': value_field, 'sql': sql, 'cites': cites
        }

        return final_res

    @construct_final_answer
    def _run(
        self,
        input: str,
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
        try:
            errors = {}
            res = {}
            for i in range(self.retry_times):
                logger.debug(f'{i + 1} time to generate SQL......')
                text2sql_res = self.text2sql_tool.invoke(input=input)
                sql, cites = '', []
                try:
                    text2sql_res = json.loads(text2sql_res)
                    sql = text2sql_res.get('output', {}).get('sql', '')
                    cites = text2sql_res.get('output', {}).get('cites', [])
                except Exception as e:
                    logger.error(f'Error: {e}')
                if not sql:
                    return {
                        'reason': '没有查询到相关数据记录，不支持数据预测。'
                    }

                datas = self.execut(sql=sql)
                logger.debug(f'sql execut data: {datas}')
                logger.debug(f'{i + 1} times to ARIMA predict......')
                # datas = [{'周数': '第22周', '运量': 11736.562}, {'周数': '第23周', '运量': 68916.86}, {'周数': '第24周', '运量': 68152.17}, {'周数': '第25周', '运量': 74618.94}, {'周数': '第26周', '运量': 71077.48}]
                # sql, cites = '', []
                try:
                    flag, time_field, value_field, df = self.format_inputs(datas=datas)
                    if flag:
                        res = self.predict(time_field=time_field, value_field=value_field, dataframe=df,
                                           sql=sql, cites=cites)
                        self.session.add_agent_logs(
                            self._result_cache_key,
                            logs=res
                        )
                    return res
                except Exception as e:
                    errors['res'] = res
                    errors['error'] = e.__str__()
                    logger.error(f'Error: {errors}')
            return {}
        except Exception as e:
            logger.error(f'Error: {e}')

    @async_construct_final_answer
    async def _arun(
        self,
        input: str,
        chat_history: Optional[list] = None,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        return self._run(input=input)
    
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
                "tool_name": "arima",
                "title": log.get("title", "arima"),
            }


if __name__ == '__main__':
    pass
    # from langchain_openai import ChatOpenAI
    #
    # # os.environ['OPENAI_API_KEY'] = 'your key'
    # # llm = ChatOpenAI(model='gpt-3.5-turbo', temperature=0)
    # llm = ChatOpenAI(
    #     model_name='Qwen-72B-Chat',
    #     openai_api_key='EMPTY',
    #     openai_api_base='http://192.168.173.19:8304/v1',
    #     max_tokens=2000,
    #     temperature=0.01,
    # )
    #
    # tool = ArimaTool(
    #     llm=llm,
    #     retry_times=2,
    #     # background='流向是指当沿路段上有货物运输时的方向'
    # )


