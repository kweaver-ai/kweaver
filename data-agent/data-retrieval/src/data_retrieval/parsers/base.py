from langchain_core.output_parsers import JsonOutputParser
from data_retrieval.utils.llm import deal_think_tags
from data_retrieval.logs.logger import logger

class BaseJsonParser(JsonOutputParser):
    def parse_result(self, result, *, partial: bool = False):
        for i, res in enumerate(result):
            before_think, think, after_think = deal_think_tags(res.text)
            if before_think:
                logger.info(f"before_think {i}, result: {before_think}")
            if think:
                logger.info(f"think {i}, result: {think}")
            if after_think:
                logger.info(f"after_think {i}, result: {after_think}")
            
            if after_think:
                res.text = after_think

        return super().parse_result(result, partial=partial)
