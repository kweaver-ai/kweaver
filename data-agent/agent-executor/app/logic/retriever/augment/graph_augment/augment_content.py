class AugmentContent:
    def __init__(self):
        pass

    async def ado_augment(self, query, entities):
        """利用实体信息增加原来的字符串的信息"""
        query_lower = query.lower()
        augment_dict = {}
        if "full_text" in entities.keys() and "vertexs" in entities["full_text"].keys():
            for entity in entities["full_text"]["vertexs"]:
                all_names = [entity["default_property"]["v"]]
                for concept in entity["properties"]:
                    for prop in concept["props"]:
                        if prop["name"] == "alias":
                            if len(prop["value"].strip()) != 0:
                                all_names.extend(prop["value"].split(";"))
                all_names = sorted(all_names, key=lambda x: len(x), reverse=True)
                for name in all_names:
                    if name.lower() in query_lower:
                        all_names.remove(name)
                        if len(all_names) > 1:
                            augment_dict[name] = name + "(" + "、".join(all_names) + ")"
                        elif len(all_names) == 1:
                            augment_dict[name] = name + "(" + all_names[0] + ")"
                        else:
                            augment_dict[name] = name
                        break
            for key, value in augment_dict.items():
                start_index = query.lower().find(key.lower())
                query = query.replace(
                    query[start_index : start_index + len(key)], value
                )
        return query
