from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.cites.cite_snippet import Snippet, Snippets
from app.logic.retriever.AS_doc.helper.cite_helper import divide_to_name_and_content


class CitesProcess:
    def __init__(self, advanced_config: dict = None):
        if advanced_config is None:
            advanced_config = {}
        self.max_slice_per_cite = advanced_config.get("max_slice_per_cite", 16)

    async def ado_cites_process(self, retrival_config: RetrieverBlock):
        for data_source, ranked_slices in retrival_config.rank_accurate_slices.items():
            snippets = Snippets(max_slice_per_cite=self.max_slice_per_cite)
            user_query_accurate_ranking_data_merge = ranked_slices

            for idx, row in user_query_accurate_ranking_data_merge.iterrows():
                object_id = row["belong_doc_id"].split("/")[-1]
                if snippets.has_snippet(
                    snippet_id=object_id
                ):  # snippet_id等于object_id
                    snippet = snippets.get_snippet(snippet_id=object_id)
                else:
                    snippet = Snippet(
                        object_id, max_slice_per_cite=self.max_slice_per_cite
                    )
                    snippet.doc_id = row["belong_doc_id"]
                    snippet.doc_name = row["belong_doc_name"]
                    snippet.ext_type = row["belong_doc_ext_type"]
                    snippet.parent_path = row["belong_doc_parent_path"]
                    snippet.size = row["belong_doc_size"]
                    snippet.doc_lib_type = row["doc_lib_type"]
                    snippets.add_snippet(snippet_id=object_id, snippet=snippet)
                snippet.add_content(
                    sequence_number=row["segment_id"],
                    content=divide_to_name_and_content(row["raw_text"])[-1],
                    slice_id=row["uuid"],
                    slice_embedding=row["embedding"],
                    page=row["pages"],
                    score=row["merge_score"],
                )
            retrival_config.snippets_slices[data_source] = snippets
            cites = snippets.generate_cites()
            retrival_config.cites_slices[data_source] = cites

        return retrival_config
