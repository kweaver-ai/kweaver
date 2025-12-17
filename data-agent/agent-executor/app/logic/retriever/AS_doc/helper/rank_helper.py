import numpy as np
import threading
import multiprocessing
from typing import List, Dict, Set, Tuple
import jieba.posseg as pseg
import jieba
import re
import string
import math
from app.common.config import Config


def raw_text_norm(text: str) -> bool:
    text = text.strip()
    text = text.replace(" ", "")
    return text


class TPSingleton:
    _instance_lock = threading.Lock()
    _process_lock = multiprocessing.Lock()
    _instance = None

    def __new__(cls, *args, **kwargs):
        with cls._process_lock, cls._instance_lock:
            if not cls._instance:
                __instance = super().__new__(cls, *args, **kwargs)
                cls._instance = __instance

        return cls._instance


class TokenAdapter(TPSingleton):
    stop_words: Set = set()

    def __init__(self):
        if len(self.stop_words) == 0:
            # logger.info("load stop words...")
            with open(Config.document.stop_words_file, "r", encoding="utf-8") as f:
                for line in f:
                    self.stop_words.add(line.strip())

    def cut(
        self, text: str, return_pst: bool = True, dup: bool = True
    ) -> List[Dict[str, str]]:
        words = []
        if return_pst:
            _mapping = []

            for item in pseg.cut(text["origin_query"]):
                if item.word not in _mapping:
                    words.append({"word": item.word, "flag": item.flag})
                _mapping.append(item.word)
        else:
            _mapping = []

            for item in jieba.cut(text):
                if item not in _mapping:
                    words.append({"word": item})
                _mapping.append(item)

        return words

    def is_stop_word(self, word: str) -> bool:
        if word in self.stop_words:
            return True
        return False


class TokenScorer:
    def __init__(self, acc_ranking_score_threshold) -> None:
        self.core = TokenAdapter()
        self.acc_ranking_score_threshold = acc_ranking_score_threshold

    def divide_chars(
        self, words: List[Dict[str, str]]
    ) -> Tuple[List[Tuple[int, str]], List[Tuple[int, str]]]:
        english_words = []
        chinese_words = []

        for idx, pair in enumerate(words):
            word = pair["word"].strip()

            if not word:
                continue

            if word in string.punctuation:
                continue
            if re.match(r"^[\u4e00-\u9fa5]+$", word):
                chinese_words.append((idx, word))
            else:
                if all(
                    "\uff01" <= c <= "\uff61"
                    or "\u2018" <= c <= "\u201f"
                    or "\u3001" <= c <= "\u301f"
                    for c in word
                ):
                    continue

                english_words.append((idx, word))

        return english_words, chinese_words

    def do(self, context: str, query_string: str, row_score=None) -> List[str]:
        if row_score:
            if math.isnan(row_score):  # 关键字检索和向量检索全都命中的全部保留
                return 1.0, 1.0
            if (
                self.acc_ranking_score_threshold <= row_score < 1.0
            ):  # 得分较高的不进行accuracy_ranking
                return row_score, 1.0

        # step 1: 分词，保留词性
        query_words = self.core.cut(query_string, return_pst=True, dup=True)

        self.query_words = query_words

        # step 2: 去停用词
        query_pairs_after_stopwords = [
            pair for pair in query_words if not self.core.is_stop_word(pair["word"])
        ]
        self.query_pairs_after_stopwords = query_pairs_after_stopwords

        scores, weighted_scores, filter_list = [], [], []

        # step 3: 保留特定词性的词
        for pair in query_pairs_after_stopwords:
            # extra_stop_words = ["是", "有", "会"]
            # if pair["word"] in extra_stop_words:
            #     continue
            if pair["flag"].startswith("v") and len(pair["word"]) == 1:
                continue
            if (
                pair["flag"].startswith("n")
                or pair["flag"].startswith("eng")
                or pair["flag"].startswith("v")
                or pair["flag"].startswith("t")
                or "l" in pair["flag"]
                or pair["flag"].startswith("m")
            ):
                filter_list.append(pair)

        self.filter_list = filter_list
        # logger.debug(self.filter_list)

        context_words = self.core.cut(context, False, True)
        english_words_set, chinese_words_set = self.divide_chars(context_words)
        chinese_word_list = [item[1].upper() for item in chinese_words_set]
        english_number_word_list = [item[1].upper() for item in english_words_set]

        for idx, pair in enumerate(filter_list):
            _flag, _word = pair["flag"], pair["word"]
            if (
                _word.upper() in chinese_word_list
                or _word.upper() in english_number_word_list
            ):
                if _flag.startswith("n"):
                    if _flag.startswith("nr"):
                        weighted_scores.append(2)  # 人名
                    elif _flag.startswith("ns"):
                        weighted_scores.append(2)  # 地名
                    elif (
                        _flag.startswith("nt")
                        or _flag.startswith("nz")
                        or _flag.startswith("nl")
                    ):  # 组织团体名: nt, 其他专有名词: nz, 惯用名词: nl
                        weighted_scores.append(1.8)
                    else:
                        weighted_scores.append(1.6)
                    scores.append(1)
                elif _flag.startswith("eng") or _flag.startswith("v"):
                    weighted_scores.append(1.5 if _flag.startswith("eng") else 1)
                    scores.append(1)
                elif (
                    _flag.startswith("t") or "l" in _flag or _flag.startswith("m")
                ):  # t：时间
                    weighted_scores.append(1.8)
                    scores.append(1)
                else:
                    weighted_scores.append(1)
                    scores.append(1)

        # TODO 设计一个函数，此函数可以计算加权得分，
        # 要求：
        # 1. 得分与词性有关
        # 2. 得分与命中的词的数量正相关
        # 3. 得分与命中的词的词性种类数量正相关
        # 4. 每种词性的权重与query中该词性词语出现的频率负相关（惩罚项）
        score = (
            np.sum(np.array(scores) > 0) / len(filter_list)
            if len(filter_list) != 0
            else 0.0
        )
        weighted_score = (
            np.sum(np.array(weighted_scores)) / len(filter_list)
            if len(filter_list) != 0
            else 0.0
        )
        self.score = score
        self.weighted_score = weighted_score
        return score, weighted_score

    def sigmoid(self, x):
        return 1.0 / (1 + np.exp(-x) ** 0.2)
