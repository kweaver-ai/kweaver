from app.driven.ad.model_factory_service import model_factory_service
from app.driven.external.rerank_client import RerankClient
from app.resources.executors.graph_rag_block.task import Task


class PreProcessor:
    def __init__(self, inputs, props) -> None:
        self.props = props
        self.query = inputs["query"]
        # check fields, if none, set all concept
        self.output_fields = props["kg"][0].get("output_fields", [])
        self.data_source_field = props["kg"][0]["fields"]
        if not self.output_fields:
            self.output_fields = self.data_source_field

        self.reranker_client = RerankClient()

    async def get_useful_props(self, props, output_fields, emb_desc_config):
        data_sources_field = props["kg"][0]["fields"]
        kg_id = props["kg"][0]["kg_id"]

        entities = props["kg_ontology"][kg_id]["entity"]
        output_concept_map = {}
        all_entity_props = {}
        for entity in entities:
            all_entity_props[entity["name"]] = [
                prop["alias"] for prop in entity["properties"]
            ]
            output_concept_map[entity["name"]] = entity["alias"]

        useful_props = {}
        for ds_field in data_sources_field:
            index_props = list(emb_desc_config[kg_id][ds_field].keys())
            useful_props[ds_field] = index_props

        output_field_slices = []
        for o_field in output_fields:
            texts = []
            zh_name = output_concept_map[o_field]
            texts.append(f"该问题是在找{zh_name}({zh_name}信息有")
            if useful_props.get(o_field, []):
                texts.append("、".join(useful_props.get(o_field, [])))
                output_field_slices.append("".join(texts))
        return output_field_slices

    async def update_output_field(self, task: Task, emb_desc_config):
        if len(self.output_fields) > 1:
            output_field_slices = await self.get_useful_props(
                self.props, self.output_fields, emb_desc_config
            )
            if len(output_field_slices) > 1:
                scores = await self.reranker_client.ado_rerank(
                    output_field_slices, self.query
                )
                updated_output_field = self.output_fields[scores.index(max(scores))]
                # 找第2大的output_concept，由于现在reranker分类不准确，如果output_field分错类别了，很可能会导致没有答案，这一步可以进行容错
                second_largest_index = next(
                    (i for i, x in enumerate(scores) if x == sorted(set(scores))[-2]),
                    None,
                )
                updated_output_field_2th = self.output_fields[second_largest_index]
                task.set_attr("updated_output_field_2th", [updated_output_field_2th])

                task.set_attr("ori_output_field", self.output_fields)
                task.set_attr("updated_output_field", [updated_output_field])
                self.props["kg"][0]["output_fields"] = [
                    updated_output_field
                ]  # self.props中就叫做"output_fields"，有s，我们现在只是更新这个字段
            else:
                self.props["kg"][0]["output_fields"] = self.output_fields
        else:
            self.props["kg"][0]["output_fields"] = self.output_fields
        return self.props

    async def get_long_context_concepts(self):
        kg_id = self.props["kg"][0]["kg_id"]

        try:
            long_context_concepts = await model_factory_service.get_agent_config(kg_id)
            long_context_concepts = long_context_concepts["res"][0]["long_text_mark"]
        except:
            long_context_concepts = []

        if long_context_concepts:
            format_long_context_concepts = {}
            for item in long_context_concepts:
                format_long_context_concepts[item["entity_name"]] = item["retrieve_num"]
            return format_long_context_concepts
        else:
            return []
