import json

from app.common.stand_log import StandLogger
from app.driven.infrastructure.redis import redis_pool


class GraphUtils:
    async def find_redis_graph_cache(self, graph_id):
        res = {}
        try:
            async with redis_pool.acquire(3, "read") as redis_reader:
                name = "graph_" + str(graph_id)
                res["graph_name"] = json.loads(
                    redis_reader.hget(name, "graph_name").decode()
                )
                res["dbname"] = json.loads(
                    redis_reader.hget(name, "dbname").decode(encoding="utf-8")
                )
                res["entity"] = json.loads(
                    redis_reader.hget(name, "entity").decode(encoding="utf-8")
                )
                res["edge"] = json.loads(
                    redis_reader.hget(name, "edge").decode(encoding="utf-8")
                )
                res["quantized_flag"] = json.loads(
                    redis_reader.hget(name, "quantized_flag").decode(encoding="utf-8")
                )
                return res
        except Exception as e:
            StandLogger.error(
                f"Error in obtaining schema information for graph from Redis: {repr(e)}"
            )
            raise Exception(
                f"Error in obtaining schema information for graph from Redis: {repr(e)}"
            )


graph_util = GraphUtils()
