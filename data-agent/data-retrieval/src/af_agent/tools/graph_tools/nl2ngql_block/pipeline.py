from af_agent.tools.graph_tools.common.stand_log import StandLogger
from .retrieval_engine import RetrievalEngine
from .candidate_generator import CandidateGenerator
# from .question_rewrite import CoTRewrite
from .query_fixer import QueryFixer
from .common.structs import IntermediateResult



class Text2nGQLSystem:
    def __init__(self, params):
        self.params = params
        self.retrieval_engine = RetrievalEngine()
        self.candidate_generator = CandidateGenerator()
        self.query_fixer = QueryFixer()

    async def process(self, intermediate_result: IntermediateResult):

        if intermediate_result.retrieval:
        # Step 1: Value retrieval
            retrieval_values = await self.retrieval_engine.retrieval(intermediate_result)
            intermediate_result.retrieval_values = retrieval_values
        messages = await self.candidate_generator.generate(intermediate_result)
        # # # Step 4: Query fixer
        fixed_queries = await self.query_fixer.fix(intermediate_result)

        StandLogger.info('fixed_queries: {}'.format(fixed_queries))
        return {"messages": messages, "response": fixed_queries}


