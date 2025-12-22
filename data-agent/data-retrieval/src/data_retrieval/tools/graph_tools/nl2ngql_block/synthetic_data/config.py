


class MethodConfig:  # 只配置当前模块的参数
    enable_template_base = True

    enable_embedding_base = True

    enable_user_base = True
    enable_user_embedding_base = True

    rewrite = True


    template_base = {
        "name": "nGQLTemplateBaseSynthetic",
        "params": {
            "check": False,
            "sample_size": 1,
        },
    }




if __name__ == "__main__":
    """
    Question: "AnyShare的管理测试都有谁"
    keywords: {{'AnyShare': 'orgnization.name', '管理测试': 'person.position'}}
    """

    def get_keyword_example():
        keywords = "{}"
        import regex as re
        config = MethodConfig.user_base["params"]["user_data_template"]
        for question_type, examples in config.items():
            for index, (template, question_examples) in enumerate(examples["question_template"].items()):
                for question, example in question_examples:
                    keywords_dic = {}
                    print("Question: {}".format(question))
                    # print("keywords: {}".format(question))
                    result = re.findall("\.([^. ]+)\.([^. ]+) ?(?:==|contains|CONTAINS) ?['\"]([^'\"]+)['\"]", example)
                    if result:
                        result = list(set(result))
                        prop_values = []
                        for index, res in enumerate(result):
                            label_name = res[0]
                            prop_name = res[1]
                            prop_values.append(res[2])
                            keywords_dic.setdefault(res[2], label_name + "." + prop_name)
                    # print(keywords_dic)
                    keywords = "keywords: {}".format(keywords_dic).replace("{", "{{").replace("}", "}}")
                    print(keywords )

    def get_all_example():
        import regex as re
        config = MethodConfig.user_base["params"]["user_data_template"]
        for question_type, examples in config.items():
            for index, (template, question_examples) in enumerate(examples["question_template"].items()):
                for question, example in question_examples:
                    print("Question: {}".format(question))
                    print("nGQL: {}".format(example))


    get_keyword_example()
    # get_all_example()
