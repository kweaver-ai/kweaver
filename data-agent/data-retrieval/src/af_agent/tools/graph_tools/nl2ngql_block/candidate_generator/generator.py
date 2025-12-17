import asyncio
from .config import MethodConfig
from .cot_generator import CoTGenerator
from ..common.structs import CandidateGeneratorResponse


class CandidateGenerator:
    def __init__(self):
        if MethodConfig.enable_cot_generator:
            self.cot_generator = CoTGenerator()

    async def generate(self, intermediate_result):
        # question = intermediate_result.query
        tasks = {}
        if MethodConfig.enable_cot_generator:
            tasks['cot_generator'] = asyncio.create_task(self.cot_generator.generate(intermediate_result))
        results = await asyncio.gather(*tasks.values())
        generate_values = {}
        for key, result in zip(tasks.keys(), results):
            generate_values[key] = result
        candidate_generator_response = CandidateGeneratorResponse(**generate_values)
        intermediate_result.candidate_queries = candidate_generator_response.cot_generator # 生成多个值
        # 目前就一种生成器,所以直接取出来
        return candidate_generator_response.cot_generator["messages"]
