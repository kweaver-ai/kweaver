from typing import List, Dict

import pandas as pd

from app.logic.retriever.AS_doc.helper.constant import RetrieveSourceType
from app.logic.retriever.AS_doc.helper.cite_helper import (
    connect_consecutive_numbers,
    CiteModel,
    CiteBase,
    CiteSliceModel,
)


class BaseSnippet:
    pass


class BaseSnippets:
    pass


class Snippet:
    def __init__(self, object_id: str, **kwargs):
        self.object_id: str = object_id
        self.doc_name: str = ""
        self.ext_type: str = ""
        self.parent_path: str = ""
        self.size: int = 0
        self.doc_id: str = ""
        self.doc_lib_type = ""
        self.scores = []
        self.slice_ids: List[str] = []
        self.slice_embeddings: List[List[float]] = []
        self.contents: List[str] = []
        self.content_sequence_numbers: List[int] = []
        self.pages: List[List] = []
        self.extra_slice_ids: List[str] = []
        self.extra_contents: List[str] = []
        self.extra_content_sequence_numbers: List[int] = []
        self.extra_slice_embeddings: List[List[float]] = []
        self.extra_pages: List[List] = []
        self.retrieve_source_type: RetrieveSourceType = RetrieveSourceType.DOC_LIB
        self.strategy_id = "00001"  # 需要迁移（Young）
        self.has_doc_id = False
        self.max_slice_per_cite: int = kwargs.get("max_slice_per_cite", 16)

    def add_content(
        self,
        sequence_number: int,
        content: str,
        slice_id: str,
        slice_embedding: List[float],
        page: List[int],
        score: float,
    ):
        if sequence_number not in self.content_sequence_numbers:
            self.scores.append(score)
            self.content_sequence_numbers.append(sequence_number)
            self.contents.append(content)
            self.slice_ids.append(slice_id)
            self.pages.append(page)
            self.slice_embeddings.append(slice_embedding)

    # XXX 未使用
    def add_extra_content(
        self,
        sequence_number: int,
        content: str,
        slice_id: str,
        slice_embedding: List[float],
        page: List[int],
    ):
        if sequence_number not in self.extra_content_sequence_numbers:
            self.extra_content_sequence_numbers.append(sequence_number)
            self.extra_contents.append(content)
            self.extra_slice_ids.append(slice_id)
            self.extra_slice_embeddings.append(slice_embedding)
            self.extra_pages.append(page)

    def get_slices(self, top_k: int = 5) -> List[CiteSliceModel]:
        scores = []
        slice_ids = []
        slice_embeddings = []
        contents = []
        content_sequence_numbers = []
        pages = []

        scores.extend(self.scores)
        slice_ids.extend(self.slice_ids)
        contents.extend(self.contents)
        content_sequence_numbers.extend(self.content_sequence_numbers)
        slice_embeddings.extend(self.slice_embeddings)
        pages.extend(self.pages)

        if len(self.extra_slice_ids) != 0:
            slice_ids.extend(self.extra_slice_ids)
        if len(self.extra_slice_embeddings) != 0:
            slice_embeddings.extend(self.extra_slice_embeddings)
        if len(self.extra_contents) != 0:
            contents.extend(self.extra_contents)
            content_sequence_numbers.extend(self.extra_content_sequence_numbers)
        if len(self.extra_pages) != 0:
            pages.extend(self.extra_pages)

        if self.has_doc_id:  # 针对单个文档的处理，客户端侧边栏
            self.scores = self.scores[:top_k]
            slice_embeddings = slice_embeddings[:top_k]
            slice_contents = contents[:top_k]
            slice_ids = slice_ids[:top_k]
            slice_nos = content_sequence_numbers[:top_k]
            slice_pages = pages[:top_k]
            slice_list = []
        else:
            slice_scores = scores
            slice_embeddings = slice_embeddings
            slice_contents = contents
            slice_ids = slice_ids
            slice_nos = content_sequence_numbers
            slice_pages = pages
            slice_list = []

        if len(slice_nos) > top_k:  # slice_nos就是segment_id
            remove_times = len(slice_nos) - top_k
            i = 0

            slice_length = len(slice_nos)
            while i < remove_times:
                cur_slice_segment_id = slice_nos[slice_length - 1 - i]
                if (cur_slice_segment_id - 1 not in slice_nos) and (
                    cur_slice_segment_id + 1 not in slice_nos
                ):
                    slice_nos.pop(slice_length - 1 - i)
                    slice_embeddings.pop(slice_length - 1 - i)
                    slice_contents.pop(slice_length - 1 - i)
                    slice_ids.pop(slice_length - 1 - i)
                    slice_pages.pop(slice_length - 1 - i)
                    slice_scores.pop(slice_length - 1 - i)
                else:
                    pass
                i += 1

        for i in range(len(slice_ids)):
            slice_score = slice_scores[i]

            if pd.isna(slice_score):
                slice_score = -100.0

            slice_id = slice_ids[i]
            slice_content = slice_contents[i]
            slice_no = slice_nos[i]
            slice_embedding = slice_embeddings[i]
            slice_page = slice_pages[i]

            cite_slice = CiteSliceModel(
                score=slice_score,
                id=slice_id,
                no=slice_no,
                content=slice_content,
                embedding=slice_embedding,
                pages=slice_page,
            )
            slice_list.append(cite_slice)

        slice_list_sorted = connect_consecutive_numbers(
            slice_list, self.max_slice_per_cite
        )
        # slice_list_sorted = sorted(slice_list, key=lambda x:x.no)
        # logger.debug([slice_item.no for slice_item in slice_list_sorted])
        return slice_list_sorted

    # XXX
    def get_content(self, top_k: int = 5) -> List[str]:
        slice_ids = []
        contents = []
        content_sequence_numbers = []
        slice_ids.extend(self.slice_ids)
        contents.extend(self.contents)
        content_sequence_numbers.extend(self.content_sequence_numbers)
        if len(self.extra_contents) != 0:
            contents.extend(self.extra_contents)
            content_sequence_numbers.extend(self.extra_content_sequence_numbers)
        # content = " ".join([raw_text for segment_id, raw_text in sorted(list(zip(content_sequence_numbers, contents))[:top_k], key=lambda x:x[0])])
        # print(content_sequence_numbers)
        content = [raw_text for raw_text in contents[:top_k]]
        # content = "\t".join([raw_text for segment_id, raw_text in sorted(list(zip(self.content_sequence_numbers, self.contents)), key=lambda x:x[0])])
        return content

    # XXX
    def get_slice_ids(self, top_k: int = 5):
        slice_ids = []
        slice_ids.extend(self.slice_ids)
        if len(self.extra_slice_ids) != 0:
            slice_ids.extend(self.extra_slice_ids)
        # slice_ids = [slice_id for segment_id, slice_id in sorted(list(zip(content_sequence_numbers, slice_ids))[:top_k], key=lambda x:x[0])]
        # slice_ids = [slice_id for segment_id, slice_id in sorted(list(zip(self.content_sequence_numbers, self.slice_ids)), key=lambda x:x[0])]
        slice_ids = slice_ids[:top_k]
        return slice_ids

    # XXX
    def get_slice_embeddings(self, top_k: int = 5):
        slice_embeddings = []
        slice_embeddings.extend(self.slice_embeddings)

        if len(self.extra_slice_embeddings) != 0:
            slice_embeddings.extend(self.extra_slice_embeddings)
        slice_embeddings = slice_embeddings[:top_k]
        return slice_embeddings

    def to_cite(self, top_k: int = 5) -> CiteModel:
        slices = self.get_slices(top_k)

        if not isinstance(self.parent_path, str):
            self.parent_path = ""

        if not isinstance(self.doc_lib_type, str):
            self.doc_lib_type = ""

        cite_base = CiteBase(
            doc_lib_type=self.doc_lib_type,
            object_id=self.object_id,
            doc_name=self.doc_name,
            ext_type=self.ext_type,
            parent_path=self.parent_path,
            size=self.size,
            doc_id=self.doc_id,
            content="\n".join([item.content for item in slices]) if slices else "",
            retrieve_source_type=self.retrieve_source_type.name,
        )

        cite = CiteModel(**cite_base.model_dump(), slices=slices)

        return cite


class Snippets:
    def __init__(self, **kwargs):
        self.mapping: Dict[str, Snippet] = {}  # key为object_id
        self.order_mapping: Dict[str, int] = {}  # key为object_id，顺序
        self.order_id: int = 0
        self.count: int = 0
        self.max_slice_per_cite: int = kwargs.get("max_slice_per_cite", 16)

    def has_snippet(self, snippet_id: str):
        if snippet_id not in self.mapping:
            return False
        return True

    def add_snippet(self, snippet_id: str, snippet: Snippet):
        if not self.has_snippet(snippet_id=snippet_id):
            self.mapping[snippet_id] = snippet
            self.order_mapping[snippet_id] = self.order_id
            self.order_id += 1
            self.count += 1
        else:
            snippet = self.mapping[snippet_id]

    def get_snippet(self, snippet_id: str):
        if not self.has_snippet(snippet_id=snippet_id):
            return None
        else:
            return self.mapping[snippet_id]

    def generate_cites(self) -> List[CiteModel]:
        cites = []
        for _, snippet_item in enumerate(
            [
                self.mapping[snipped_id]
                for snipped_id, order_id in sorted(
                    list(self.order_mapping.items()), key=lambda x: x[1]
                )
            ]
        ):
            cite = snippet_item.to_cite(top_k=self.max_slice_per_cite)
            cites.append(cite)

        return cites

    # 没有用到
    def generate_documents(self, cites: List[CiteModel] = None) -> List[Dict[str, str]]:
        if cites is None:
            cites = self.generate_cites()
        documents = []
        for idx, cite in enumerate(cites, 1):
            filename = cite.doc_name
            document_id = str(idx)
            raw_text = cite.content
            document = {
                "document_id": document_id,
                "filename": filename,
                "raw_text": raw_text,
            }
            documents.append(document)
        return documents

    def delete_snippet(self, snippet_id: str):
        if snippet_id in self.mapping:
            del self.mapping[snippet_id]
            del self.order_mapping[snippet_id]
            self.count -= 1

    def get_count(self):
        return self.count
