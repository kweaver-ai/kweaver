from datetime import datetime


async def get_date(inputs, props, resource, data_source_config, context=None):
    return {"date": datetime.today().strftime("%Y-%m-%d")}
