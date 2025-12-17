from app.utils.common import is_dolphin_var


async def check(request: dict):
    value = request.get("value")
    if is_dolphin_var(value):
        value = value.get("value")
    return value
