from DolphinLanguageSDK.skill_results.strategies import BaseStrategy
from DolphinLanguageSDK.skill_results.result_reference import ResultReference
from typing import Any, Dict


class TestStrategy(BaseStrategy):
    category = "frontend"

    def process(self, result_reference: "ResultReference", **kwargs) -> Dict[str, Any]:
        try:
            # full_result = result_reference.get_full_result()
            # metadata = result_reference.get_metadata()
            return {"result": "测试成功"}

        except Exception as e:
            return {
                "error": f"数据处理失败: {str(e)}",
                "reference_id": result_reference.reference_id,
            }
