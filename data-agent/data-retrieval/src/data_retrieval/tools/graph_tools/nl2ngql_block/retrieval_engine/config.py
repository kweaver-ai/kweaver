class MethodConfig:  # 只配置当前模块的参数
    # 控制是否启用value_retrieval
    enable_value_retrieval = True
    # 用于检索嵌套节点
    enable_kg_node_retrieval = True
    # 控制是否启用qq_retrieval
    enable_qq_retrieval = True

    value_retrieval = {
        "name": "ValueRetrieval",
        "params": {
            "score": 0.9,
            "select_num": 5,
        },
    }

    kg_node_retrieval = {
        "name": "KGNestedNodeRetrieval",
        "params": {
        },
    }


    qq_retrieval = {
        "name": "QuestionRuleRetrieval",
        "params": {
            "size": 10,
        }
    }



