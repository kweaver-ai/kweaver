from app.common.structs import RetrieverBlock


class FAQFormatOut:
    def __init__(self) -> None:
        pass

    async def ado_format_out(self, retrival_config: RetrieverBlock):
        faq_format_out = []
        for cur_qas in retrival_config.faq_rank_qas:
            cur_res = cur_qas
            cur_qas = cur_qas["meta"]
            cur_answer = ""
            cur_answer += "、".join(cur_qas["title"]) + "\n"
            for unit_answer in cur_qas["content"]:
                if unit_answer["type"] == "text":
                    cur_answer += unit_answer["content"]
                elif unit_answer["type"] == "image":
                    for image_content_type, image_content in unit_answer[
                        "details"
                    ].items():
                        if len(image_content.strip()) <= 2 or (
                            image_content_type == "image"
                            and image_content.strip() == cur_qas["title"].strip()
                        ):
                            pass
                        else:
                            cur_answer += image_content + "\n"
            cur_res["content"] = cur_answer
            cur_res["retrieve_source_type"] = "FAQ"
            faq_format_out.append(cur_res)
        retrival_config.faq_format_out_qas = faq_format_out
        return retrival_config
