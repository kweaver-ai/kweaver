import tushare as ts
from datetime import datetime


async def check_stock(inputs, props, resource, data_source_config, context=None):
    end_date = datetime.now().strftime("%Y%m%d")
    tushare_token = props["tushare_token"]
    ts.set_token(tushare_token)
    # 初始化 API
    pro = ts.pro_api()
    # 查询股票代码（例如：600519.SH 是贵州茅台）
    stock_code = inputs["query"]
    if len(stock_code) == 6:
        if stock_code[0] == "6":
            stock_code += ".SH"
        else:
            stock_code += ".SZ"
    # 获取最新交易日的股票数据
    df = pro.daily(ts_code=stock_code, start_date="20250201", end_date=end_date)
    data = {"Date": [], "Open": [], "Close": [], "High": [], "Low": []}
    for i in range(len(df)):
        # 打印最新数据
        latest_data = df.iloc[i]
        data["Date"].append(latest_data["trade_date"][-4:])
        data["Open"].append(latest_data["open"])
        data["Close"].append(latest_data["close"])
        data["High"].append(latest_data["high"])
        data["Low"].append(latest_data["low"])
    data["Date"] = data["Date"][::-1]
    data["Open"] = data["Open"][::-1]
    data["Close"] = data["Close"][::-1]
    data["High"] = data["High"][::-1]
    data["Low"] = data["Low"][::-1]
    return data
