from baidusearch.baidusearch import search


async def baidu_search(inputs, props, resource, data_source_config, context=None):
    """百度搜索接口"""
    try:
        # 执行百度搜索
        search_results = []
        for result in search(inputs["query"], num_results=inputs["num_results"]):
            search_results.append(
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "description": result.get("abstract", ""),
                }
            )

        return {"query": inputs["query"], "results": search_results}
    except Exception as e:
        raise Exception(f"百度搜索出错: {str(e)}")
