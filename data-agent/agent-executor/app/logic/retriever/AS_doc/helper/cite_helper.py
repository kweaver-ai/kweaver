from typing import List, Optional
from pydantic import BaseModel, Field


def divide_to_name_and_content(combine_text: str, combine_sign: str = "/|"):
    _texts = combine_text.split(combine_sign)
    if len(_texts) == 1:
        return "", combine_text
    else:
        filename = _texts[0].strip()
        return filename, combine_text.replace(f"{filename} {combine_sign} ", "")


class CiteBase(BaseModel):
    doc_lib_type: str = Field(..., message="文档源类型", description="文档源类型")
    object_id: str = Field(
        ..., message="文档的object id", description="文档的object id"
    )
    doc_name: str = Field(..., message="文档名称", description="文档名称")
    ext_type: str = Field(..., message="文档扩展名", description="文档扩展名")
    parent_path: str = Field(
        ..., message="文档的 parent path", description="文档的 parent path"
    )
    size: int = Field(..., message="文档大小", description="文档大小")
    doc_id: str = Field(..., message="文档的gns地址", description="文档的gns地址")
    content: str = Field(..., message="文档内容", description="文档内容")
    retrieve_source_type: str = Field(..., message="检索来源", description="检索来源")


class CiteSliceModel(BaseModel):
    score: float = Field(..., message="文档相似度", description="文档相似度")
    id: str = Field(..., message="文档切片ID", description="文档切片ID")
    no: int = Field(..., message="文档切片序号", description="文档切片序号")
    content: str = Field(..., message="文档切片内容", description="文档切片内容")
    embedding: List[float] = Field(
        ..., message="文档切片向量", description="文档切片向量"
    )
    pages: List[int] = Field(
        ..., message="文档切片所在页码", description="文档切片所在页码"
    )


class CiteModel(CiteBase):
    embedding: Optional[List[float]] = Field(
        [], message="cite文本向量", description="cite文本向量"
    )
    slices: List[CiteSliceModel] = Field(
        [], messages="引用包含的切片信息", description="引用包含的切片信息"
    )

    def get_slice_by_index(self, index: int) -> CiteSliceModel:
        return self.slices[index]

    def get_slice_id_by_index(self, index: int) -> str:
        return self.slices[index].id

    def get_slice_embeddings(self):
        embeddings = []
        for item in self.slices:
            embeddings.append(item.embedding)


def fine_index(slice_list, cur_slice):
    for index in range(len(slice_list)):
        if slice_list[index].no == cur_slice.no:
            return index


def connect_consecutive_numbers(slice_list, max_slice_per_cite):
    result = []
    sequence = []
    start_positions = {}
    slice_list_sorted = sorted(slice_list, key=lambda x: x.no)
    for cur_slice in slice_list_sorted:
        if not sequence or cur_slice.no == sequence[-1].no + 1:
            if not sequence:
                start_positions[cur_slice.no] = fine_index(slice_list, cur_slice)
                sequence.append(cur_slice)
            else:
                if fine_index(slice_list, cur_slice) < fine_index(
                    slice_list, sequence[0]
                ):
                    result.append(sequence)
                    sequence = [cur_slice]
                    start_positions[cur_slice.no] = fine_index(slice_list, cur_slice)
                else:
                    sequence.append(cur_slice)
        else:
            result.append(sequence)
            sequence = [cur_slice]
            start_positions[cur_slice.no] = fine_index(slice_list, cur_slice)

    if sequence:
        result.append(sequence)

    result_sorted = sorted(result, key=lambda x: start_positions[x[0].no])
    # flattened_result = [item for sublist in result_sorted for item in sublist]
    flattened_result = []
    for sublist in result_sorted:
        for item in sublist:
            flattened_result.append(item)
        if len(flattened_result) >= max_slice_per_cite:
            break

    return flattened_result
