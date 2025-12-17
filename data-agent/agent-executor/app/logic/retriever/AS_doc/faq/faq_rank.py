import numpy as np
from app.common.structs import RetrieverBlock
from app.common.stand_log import StandLogger
from app.driven.external.rerank_client import RerankClient


class FAQRank:
    def __init__(self) -> None:
        self.rerank_client = RerankClient()

    async def ado_preprocess_qas(self, retrival_config: RetrieverBlock):
        self.faq_data = retrival_config.faq_retrival_qas
        self.all_questions = []
        self.all_questions_to_index = []
        for index, item in enumerate(self.faq_data):
            self.all_questions.extend(item["title"])
            self.all_questions_to_index.extend([index] * len(item["title"]))
        self.all_questions_answer = []
        self.all_questions_answer_to_index = []
        for index, qa in enumerate(self.faq_data):
            self.all_questions_answer.extend(qa["title"])
            self.all_questions_answer_to_index.extend([index] * len(qa["title"]))
            for answer in qa["content"]:
                if answer["type"] == "text":
                    self.all_questions_answer.append(answer["content"])
                    self.all_questions_answer_to_index.append(index)
                elif answer["type"] == "image":
                    for image_content_type, image_content in answer["details"].items():
                        if len(image_content.strip()) <= 2 or (
                            image_content_type == "image"
                            and image_content.strip() == qa["title"].strip()
                        ):
                            pass
                        else:
                            self.all_questions_answer.append(image_content)
                            self.all_questions_answer_to_index.append(index)

    async def ado_rank(self, retrival_config: RetrieverBlock):
        results = []
        await self.ado_preprocess_qas(retrival_config=retrival_config)
        if "augment_query" in retrival_config.input.keys():
            query = retrival_config.input["augment_query"]
        elif "rewrite_query" in retrival_config.input.keys():
            query = retrival_config.input["rewrite_query"]
        else:
            query = retrival_config.input["origin_query"]

        response_data = await self.rerank_client.ado_rerank(self.all_questions, query)
        StandLogger.info_log(f"response_data, {response_data}, {self.all_questions}")
        character_scores = await self.get_jaccard_distances(self.all_questions, query)
        response_data_1 = [
            (response_data[i] + character_scores[i]) / 2
            for i in range(len(response_data))
        ]
        StandLogger.info_log(
            f"response_data_1, {response_data_1}, {self.all_questions}"
        )

        index_dict = {}

        for idx, value in enumerate(self.all_questions_to_index):
            if value not in index_dict:
                index_dict[value] = []
            index_dict[value].append(idx)

        scores = []
        for key in sorted(index_dict.keys()):
            indices = index_dict[key]
            sum_value = sum(response_data_1[i] for i in indices)
            scores.append(sum_value)

        must_Q = await self.get_magic(scores)
        added_index = []
        StandLogger.info_log(f"must_Q, {must_Q}")
        StandLogger.info_log(
            f"self.all_questions_to_index, {self.all_questions_to_index}"
        )

        if 100 in character_scores:
            new_must_q = [self.all_questions_to_index[character_scores.index(100)]]

        else:
            new_must_q = [self.all_questions_to_index.index(item) for item in must_Q]

        StandLogger.info_log(f"must_Q:, {new_must_q}")
        if len(new_must_q) == 0:
            StandLogger.info_log(f"{response_data_1}")
        if len(new_must_q) != 0:
            for must_index in new_must_q:
                if self.all_questions_to_index[must_index] not in added_index:
                    cur_add_qa = {
                        "meta": self.faq_data[self.all_questions_to_index[must_index]],
                        "score": response_data_1[must_index],
                    }
                    results.append(cur_add_qa)
                    added_index.append(self.all_questions_to_index[must_index])
            if len(new_must_q) == 1:
                retrival_config.faq_find_answer = True
            retrival_config.faq_rank_qas = results
            return retrival_config

        response_data_2 = await self.rerank_client.ado_rerank(
            self.all_questions_answer, query
        )
        # print("response_data_2", response_data_2, self.all_questions_answer)
        zipped_pairs = list(zip(self.all_questions_answer_to_index, response_data_2))
        sorted_pairs = sorted(zipped_pairs, key=lambda x: x[1], reverse=True)
        self.all_questions_answer_to_index_sorted = [x[0] for x in sorted_pairs]
        for cur_index in self.all_questions_answer_to_index_sorted:
            if len(results) < 5 and cur_index not in added_index:
                cur_add_qa = {
                    "meta": self.faq_data[cur_index],
                    "score": response_data_2[cur_index],
                }
                results.append(cur_add_qa)
                added_index.append(cur_index)
        retrival_config.faq_rank_qas = results
        return retrival_config

    async def get_jaccard_distances(self, slices, question):
        scores = []
        question_set = set(question)
        for slice in slices:
            if question.strip().lower().replace(
                " ", ""
            ) == slice.strip().lower().replace(" ", ""):
                scores.append(100)
            else:
                slice_set = set(slice)
                intersection_set = slice_set & question_set
                percentage = (
                    len(intersection_set) / len(question_set)
                    if len(question_set) > 0
                    else 0
                )
                if percentage >= 0.8:
                    scores.append((percentage - 0.8) * 5)
                else:
                    scores.append(-1)
        return scores

    async def get_magic(self, scores):
        if len(scores) < 5 and max(scores) < 3:
            return []
        if len(scores) < 5 and max(scores) >= 3:
            return [scores.index(max(scores))]
        multiplier = 0.5
        arr = np.array(scores)
        q1 = np.percentile(arr, 25)
        q3 = np.percentile(arr, 75)
        iqr = q3 - q1
        upper_bound = q3 + multiplier * iqr

        outliners_indices = np.where((arr >= upper_bound))[0]
        return outliners_indices.tolist()
