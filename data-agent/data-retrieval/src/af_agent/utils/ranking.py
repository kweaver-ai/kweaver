# Date: 2025-09-03
# Author: xavier.chen@aishu.cn
# Description: 排序相关工具
#
# 采用多路融合策略进行召回，核心是用BM25和向量召回的分数进行融合，但是两个值量纲不一样，所以需要进行融合
# 融合方式支持两种：
# 1. z-score，(得分 - 均值) / 中位数, 再通过加权方式进行融合
# 2. RRF，根据得分排名进行融合 E[1/(k+rank)], 相当于排名贡献度
# 
# 解决 BM25 召回的问题：例如文档库中可能存在长短文本的情况，通过调和算法来进行融合
# 1. 分别短文本召回算法 Okapi 与 BM25L 值
# 2. 计算文档长度归一化，根据文档长度归一化计算权重, 越长的文本惩罚力度越大，避免更多的命中导致得分过高
#
# 其他处理
# 1. 向量得分归一化因为余弦相似度的范围是 -1.0~1.0, 所以需要进行归一化
# 2. 停用词处理，因为BM25召回的文本可能存在停用词，所以需要进行停用词处理
# 3. 分词处理，分词的同时可选保留 unigram，bigram，skip-bigram

from typing import Dict, List, Tuple, Optional
import time
import asyncio
from rank_bm25 import BM25Okapi, BM25L
import numpy as np, re
import concurrent.futures
import jieba

from af_agent.utils.embeddings import BaseEmbeddingsService
from af_agent.logs.logger import logger


CN_STOPWORDS = {
    "一", "一下", "一些", "一切", "一方面", "一旦", "一来", "一样", "一般", "一边", "一面",
    "上", "上下", "不", "不仅", "不但", "不光", "不单", "不只", "不如", "不得", "不怕", "不论", "不过",
    "与", "与其", "与否", "与此同时",
    "且", "两者", "个", "临", "为", "为了", "为什么", "为何", "为止", "为此", "为着", "什么",
    "乃", "乃至", "么", "之", "之一", "之所以", "之类", "乌乎", "乎", "乘", "也", "也好", "也是", "也罢",
    "了", "二", "于", "于是", "于是乎", "云云", "从", "从而",
    "他", "他们", "他人", "以", "以上", "以下", "以为", "以便", "以免", "以及", "以故", "以期", "以来", "以至", "以至于", "以致",
    "们", "任", "任何", "任凭",
    "但", "但是", "何", "何况", "何处", "何时",
    "作为", "你", "你们", "使", "使得",
    "例如", "依", "依据", "依照",
    "俺", "俺们",
    "倘", "倘使", "倘或", "倘然", "倘若", "借", "假使", "假如", "假若",
    "像", "儿", "先不先", "光", "光是", "全体", "全部", "兮",
    "关于", "其", "其一", "其中", "其二", "其他", "其它", "其余", "其它", "其次", "具体地说", "具体说来",
    "兼之", "内", "再", "再其次", "再则", "再有", "再者", "再者说", "再说",
    "冒", "冲", "况且", "几", "几时",
    "凭", "凭借", "则", "则甚", "别", "别人", "别处", "别是", "别的", "别管", "别说",
    "到", "前后", "前此", "前者", "加之", "加以",
    "即", "即令", "即使", "即便", "即如", "即或", "即若", "却不", "又", "又及",
    "及", "及其", "及时", "及至",
    "双方", "反之", "反而", "反过来", "反过来说", "受到", "后", "后者",
    "吗", "嘛", "嘻", "嘿", "因", "因为", "因此", "因而",
    "在", "在下", "地", "多", "多么",
    "多少", "大", "大家", "她", "她们", "好", "如", "如上", "如上所述", "如下", "如何", "如其", "如同", "如是", "如果", "如此", "如若",
    "宁", "宁可", "宁愿", "宁肯",
    "它", "它们", "对", "对于", "对待", "对方", "对比", "将", "小", "尔", "尔后", "尔尔", "尚且", "就", "就是", "就是说",
    "尽", "尽管", "尽管如此", "岂但",
    "己", "已", "已矣", "巴", "巴巴", "并", "并且", "并非",
    "很", "很多", "後来", "後面", "得", "得了", "得出", "怎", "怎么", "怎么办", "怎么样", "怎样", "怎奈", "怎能", "怎麼", "我", "我们",
    "或", "或则", "或是", "或曰", "或者",
    "所以", "所以然", "所在", "所幸", "所有", "才", "才能", "打", "把", "抑或", "拿", "故", "故此", "故而",
    "旁人", "无", "无宁", "无法", "无论", "既", "既往", "既是", "既然",
    "时候", "是", "是以", "是否", "显然", "显而易见", "普遍", "普遍地",
    "曾", "替", "替代", "最", "有", "有些", "有关", "有及", "有时", "有的", "望", "朝", "末", "本", "本着", "来", "来着", "来自",
    "来说", "极了", "果然", "果真", "某", "某个", "某些", "某某",
    "根据", "欤", "正值", "正如", "正巧", "正是", "此", "此中", "此后", "此地", "此处", "此外", "此时", "此次", "此间",
    "毋宁", "每", "每当", "比", "比及", "比如", "比方",
    "沿", "沿着", "漫说", "焉", "然则", "然后", "然而", "照", "照着", "甚么", "甚而", "甚至", "甚至于", "用", "由", "由于", "由是", "由此",
    "略为", "略微", "的", "的话", "的话说", "而言", "能", "能否", "腾", "自", "自个儿", "自从", "自各儿", "自后", "自家", "自己", "自打", "自身",
    "至", "至于", "至今", "至若", "致", "般的", "若", "若夫", "若是", "若果", "若非", "莫若",
    "虽", "虽则", "虽然", "虽说", "被", "要", "要不", "要不然", "要不是", "要么", "要是", "要求",
    "让", "许多", "论", "设", "设或", "设若", "该", "诸", "诸位", "谁", "谁人", "谁料", "谁知",
    "赶", "起", "起见", "趁", "趁着", "越是", "跟", "较", "较之", "边", "过", "还", "还是", "还有", "还要", "这一", "这个", "这么", "这么些", "这么样",
    "这么点儿", "这些", "这会儿", "这儿", "这就是说", "这时", "这样", "这次", "这种", "这般", "这边", "这里", "进而", "连", "连同", "逐步", "通过", "遵照",
    "那", "那个", "那么", "那么些", "那么样", "那些", "那会儿", "那里", "那时", "那末", "那样", "那般", "那边",
    "都", "鄙人", "鉴于", "针对", "阿", "除", "除了", "除外", "除开", "除此之外", "除非",
    "随", "随后", "随时", "随着", "难道", "难得", "难怪", "难说", "非但", "非徒", "非特", "非独", "非论", "靠",
    "顺", "顺着", "首先", "高低", "是不是"
}


def skip_bigrams(s: str, skip: int = 1) -> List[str]:
    """连续 bigram + 跳字 bigram（skip=1 生成家电、用器等）"""
    s = re.sub(r"\s+", "", s)
    grams = [s[i:i+2] for i in range(len(s)-1)]  # 连续
    if skip >= 1 and len(s) >= 3:
        grams += [s[i] + s[i+2] for i in range(len(s)-2)]  # 跳1
    # 如需更激进，可再加跳2： s[i]+s[i+3]（注意爆炸）
    return grams

# 分词
def tokenize(
    text: str,
    keep_unigram: bool = True,
    use_bigram: bool = False,
    use_skip_bigram: bool = False,
    use_stop_words: bool = True
):
    """
    中英文混排分词：
    - 中文：jieba 搜索模式
    - 英文/数字：按词，转小写
    """
    text = text.strip()
    tokens = []
    # 匹配：中文字符 / 英文数字串
    parts = re.findall(r"[\u4e00-\u9fff]+|[A-Za-z0-9]+", text)
    for p in parts:
        if re.match(r"[\u4e00-\u9fff]", p):
            # 分词
            words = list(jieba.cut_for_search(p))
            
            # unigram
            unigrams = list(p) if keep_unigram else []

            # bigram/skip-bigram
            grams = []
            if use_bigram or use_skip_bigram:
                # 连续 bigram
                if use_bigram and len(p) > 1:
                    grams += [p[i:i+2] for i in range(len(p)-1)]
                # 跳字 bigram（关键：能得到 “家电”）
                if use_skip_bigram and len(p) > 2:
                    grams += [p[i] + p[i+2] for i in range(len(p)-2)]
                    
            words_list = list(dict.fromkeys(words + grams + unigrams))
            if use_stop_words:
                words_list = [word for word in words_list if word not in CN_STOPWORDS]
            tokens.extend(words_list)
        else:
            tokens.append(p.lower())
    return tokens

# BM25 索引类
class KVAdaptiveBM25:
    """
    k-v 结构 BM25 索引:
    corpus_kv: {doc_id: text}
    支持:
      - "okapi"    : BM25Okapi
      - "bm25l"    : BM25L
      - "adaptive" : Okapi 与 BM25L 按文档长度加权融合
    """
    def __init__(
            self,
            k1=1.5,
            b=0.75,
            delta=0.5,
            tokenizer=tokenize,
            force_retrieval_keys: List[str] = [],
            use_stop_words: bool = True
        ):
        self.k1, self.b, self.delta = k1, b, delta
        self.tokenizer = tokenizer
        self.keys: List[str] = []
        self.texts: List[str] = []
        self.tokens: List[List[str]] = []
        self.ok: Optional[BM25Okapi] = None
        self.l_: Optional[BM25L] = None
        self.len_norm: Optional[np.ndarray] = None
        self.force_retrieval_keys = force_retrieval_keys
        self.use_stop_words = use_stop_words

    def build(self, corpus_kv: Dict[str, str]):
        start_time = time.time()
        self.keys = list(corpus_kv.keys())
        self.texts = [corpus_kv[k] for k in self.keys]
        self.tokens = [self.tokenizer(t, use_stop_words=self.use_stop_words) for t in self.texts]

        # 建立两套 BM25 索引
        self.ok = BM25Okapi(self.tokens, k1=self.k1, b=self.b)
        self.l_ = BM25L(self.tokens, k1=self.k1, b=self.b, delta=self.delta)

        # 文档长度归一化（用于 adaptive）
        lens = np.array([len(ts) for ts in self.tokens], dtype=float)
        lo, hi = np.quantile(lens, [0.05, 0.95])
        self.len_norm = np.clip((lens - lo) / max(hi - lo, 1.0), 0, 1)
        end_time = time.time()
        logger.info(f"KVAdaptiveBM25 build time: {end_time - start_time} seconds")

    async def abuild(self, corpus_kv: Dict[str, str]):
        """异步版本的 build 方法"""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.build, corpus_kv)

    def search(self, query: str, topk=10, mode="okapi") -> List[Tuple[str, float]]:
        start_time = time.time()
        q = self.tokenizer(query)

        if mode == "okapi":
            scores = self.ok.get_scores(q)
        elif mode == "bm25l":
            scores = self.l_.get_scores(q)
        elif mode == "adaptive":
            s_ok = self.ok.get_scores(q)
            s_l  = self.l_.get_scores(q)
            w = self.len_norm
            scores = (1 - w) * s_ok + w * s_l
        else:
            raise ValueError("mode must be one of {'okapi','bm25l','adaptive'}")

        # 让必须召回的排在最前面，避免重复召回
        for idx, doc_id in enumerate(self.keys):
            if doc_id in self.keys and doc_id in self.force_retrieval_keys:
                scores[idx] = max(scores) + 1.0

        if topk <= 0:
            topk = len(scores)
        else:
            topk = min(topk, len(scores))

        idx = topk_indices(scores, topk)
        end_time = time.time()
        logger.info(f"KVAdaptiveBM25 search time: {end_time - start_time} seconds")
        return [(self.keys[i], float(scores[i])) for i in idx]

    async def asearch(self, query: str, topk=10, mode="okapi") -> List[Tuple[str, float]]:
        """异步版本的 search 方法"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.search, query, topk, mode)


def cosine_similarity(vec1, vec2, eps=1e-9):
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (max(norm_vec1 * norm_vec2, eps))


def topk_indices(scores, k):
    """
    返回：按分数从高到低排好序的前 k 个下标
    处理点：一维化、NaN 置底、k 边界、稳定排序
    """
    s = np.asarray(scores, dtype=np.float64).reshape(-1)     # 一维 + 浮点
    s = np.nan_to_num(s, nan=-1e18, posinf=1e18, neginf=-1e18)

    N = s.size
    if N == 0 or k <= 0:
        return np.empty((0,), dtype=int)
    k = min(k, N)

    if k == N:
        # 直接全量排序（稳定）
        return np.argsort(s, kind="stable")[::-1]

    # 先选出前 k 的“集合”，再在集合内降序排（稳定）
    idx_part = np.argpartition(s, -k)[-k:]
    idx_sorted = idx_part[np.argsort(s[idx_part], kind="stable")[::-1]]
    return idx_sorted

class VectorIndex:
    def __init__(
            self, 
            embedding_service: BaseEmbeddingsService,
            force_retrieval_keys: List[str] = [],
            similarity_func: callable = cosine_similarity,
            batch_size: int = 64
        ):
        self.embedding_service = embedding_service
        self.force_retrieval_keys = force_retrieval_keys
        self.batch_size = batch_size
        self.similarity_func = similarity_func

    def build(self, corpus_kv: Dict[str, str]):
        start_time = time.time()
        self._doc_ids = list(corpus_kv.keys())
        self._doc_texts = [corpus_kv[k] for k in self._doc_ids]
        self._doc_vecs = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            start_time = time.time()
            futures = []
            for i in range(0, len(self._doc_texts), self.batch_size):
                batch_texts = self._doc_texts[i:i+self.batch_size]
                batch_ids = self._doc_ids[i:i+self.batch_size]
                if batch_texts:  # 确保批次不为空
                    futures.append(
                        executor.submit(
                            self.embedding_service.embed_texts_with_idx,
                            batch_texts,
                            batch_ids
                        )
                    )

            for future in concurrent.futures.as_completed(futures):
                doc_vecs = future.result()
                for doc_id, doc_vec in doc_vecs:
                    self._doc_vecs.append((doc_id, doc_vec))
            
            end_time = time.time()
            logger.info(f"VectorIndex build time: {end_time - start_time} seconds")

    async def abuild(self, corpus_kv: Dict[str, str]):
        """异步版本的 build 方法"""
        start_time = time.time()
        self._doc_ids = list(corpus_kv.keys())
        self._doc_texts = [corpus_kv[k] for k in self._doc_ids]
        self._doc_vecs = []

        # 并行处理批次以提高性能
        batch_size = self.batch_size
        tasks = []
        for i in range(0, len(self._doc_texts), batch_size):
            batch_texts = self._doc_texts[i:i+batch_size]
            batch_ids = self._doc_ids[i:i+batch_size]
            if batch_texts:  # 确保批次不为空
                task = self.embedding_service.aembed_texts_with_idx(batch_texts, batch_ids)
                tasks.append(task)

        # 并行执行所有批次
        if tasks:
            batch_results = await asyncio.gather(*tasks)
            # 收集所有结果
            for doc_vecs in batch_results:
                for doc_id, doc_vec in doc_vecs:
                    self._doc_vecs.append((doc_id, doc_vec))

        end_time = time.time()
        logger.info(f"VectorIndex abuild time: {end_time - start_time} seconds")

    def search(self, query: str, topk: int = 10):
        start_time = time.time()

        # 出错返回空
        q_vecs = self.embedding_service.embed_texts([query])
        if len(q_vecs) == 0:
            return []

        q_vec = q_vecs[0]
        scores = np.ndarray(len(self._doc_vecs))

        for idx, (doc_id, doc_vec) in enumerate(self._doc_vecs):
            if doc_id in self.force_retrieval_keys:
                scores[idx] = 1.0
            else:
                scores[idx] = self.similarity_func(q_vec, doc_vec)

        if topk <= 0:
            topk = len(scores)
        else:
            topk = min(topk, len(scores))

        idx = topk_indices(scores, topk)
        end_time = time.time()
        logger.info(f"VectorIndex search time: {end_time - start_time} seconds")
        return [(self._doc_vecs[i][0], float(scores[i])) for i in idx]

    async def asearch(self, query: str, topk: int = 10):
        """异步版本的 search 方法"""
        start_time = time.time()

        # 使用异步嵌入服务
        q_vecs = await self.embedding_service.aembed_texts([query])
        if len(q_vecs) == 0:
            return []

        q_vec = q_vecs[0]
        scores = np.ndarray(len(self._doc_vecs))

        for idx, (doc_id, doc_vec) in enumerate(self._doc_vecs):
            if doc_id in self.force_retrieval_keys:
                scores[idx] = 1.0
            else:
                scores[idx] = self.similarity_func(q_vec, doc_vec)

        if topk <= 0:
            topk = len(scores)
        else:
            topk = min(topk, len(scores))

        idx = topk_indices(scores, topk)
        end_time = time.time()
        logger.info(f"VectorIndex asearch time: {end_time - start_time} seconds")
        return [(self._doc_vecs[i][0], float(scores[i])) for i in idx]


#  工具：z-score（含稳健版可选）
def zscore(
        values: List[Tuple[str, float]],
        robust: bool = True,
        clip_pct: float = 0.0,
        eps: float = 1e-9) -> Dict[str, float]:
    """
    对同一通道、同一查询的一批候选做 z-score。
    values: {doc_id: raw_score}
    robust=True 用 median/MAD，抗极端值；False 用均值/标准差。
    clip_pct>0 会按分位数截尾（如 0.01 表示两端各裁 1%）。
    """
    if not values:
        return {}
    ids, arr = [v[0] for v in values], np.array([v[1] for v in values], dtype=float)

    if clip_pct > 0:
        lo, hi = np.percentile(arr, [100*clip_pct, 100*(1-clip_pct)])
        arr = np.clip(arr, lo, hi)

    # 1.4268 是稳健 z-score 的中位值绝对偏差
    if robust:
        med = np.median(arr)
        mad = np.median(np.abs(arr - med))
        denom = 1.4826 * (mad if mad > 0 else eps)
        z = (arr - med) / denom
    else:
        mu, sigma = arr.mean(), arr.std()
        z = (arr - mu) / (sigma if sigma > 0 else eps)

    return {i: float(v) for i, v in zip(ids, z)}

# ---------- 融合一：加权 z-score ----------
def fuse_weighted_z(
    bm25_scores: List[Tuple[str, float]],
    vec_scores: List[Tuple[str, float]],
    w_bm25: float = 0.5,
    w_vec: float = 0.5,
    missing_fill: float = -10.0,
) -> List[Tuple[str, float, float, float]]:
    """
    输入：两路原始分数（同一查询）
      bm25_scores/vec_scores: {doc_id: raw_score}
    输出：[(doc_id, fused, z_bm25, z_vec)] 按 fused 降序
    """
    # 分别做 z-score（这里默认用稳健 z）
    z_bm25 = zscore(bm25_scores, robust=True)
    z_vec  = zscore(vec_scores,  robust=True)

    # 合并文档集合
    all_ids = set(z_bm25) | set(z_vec)

    fused_list = []
    for did in all_ids:
        zb = z_bm25.get(did, missing_fill)
        zv = z_vec.get(did,  missing_fill)
        fused = w_bm25 * zb + w_vec * zv
        fused_list.append((did, fused, zb, zv))

    fused_list.sort(key=lambda x: x[1], reverse=True)
    return fused_list


# ---------- 融合二：RRF ----------
# bm25_score 和 vec_score 都已经排序好的
def fuse_rrf(
    bm25_scores: List[Tuple[str, float]],
    vec_scores: List[Tuple[str, float]],
    k: int = 60
) -> List[Tuple[str, float, int, int]]:
    """
    RRF：只看名次，不看原始分值。越鲁棒、零调参。
    输出：[(doc_id, rrf_score, rank_bm25, rank_vec)]
    """
    r_b = {}
    for idx, (did, _) in enumerate(bm25_scores):
        r_b[did] = idx + 1
    r_v = {}
    for idx, (did, _) in enumerate(vec_scores):
        r_v[did] = idx + 1

    all_ids = set(r_b) | set(r_v)
    out = []
    for did in all_ids:
        # rb = r_b.get(did, 10**9)  # 未出现给个大名次
        # rv = r_v.get(did, 10**9)
        rb = r_b.get(did, 1000)
        rv = r_v.get(did, 1000)
        rrf = 1.0/(k + rb) + 1.0/(k + rv)
        out.append((did, rrf, rb if rb<1000 else -1, rv if rv<1000 else -1))

    out.sort(key=lambda x: x[1], reverse=True)
    return out


class HybridRetriever:
    def __init__(
            self,
            emb_service: BaseEmbeddingsService,
            corpus_kv: Dict[str, str],
            force_retrieval_keys: List[str] = []
        ):
        self.bm25_idx = KVAdaptiveBM25(force_retrieval_keys=force_retrieval_keys)
        self.vec_idx = VectorIndex(emb_service, force_retrieval_keys=force_retrieval_keys)
        self.fuse_func = fuse_rrf
        self.corpus_kv = corpus_kv
        self.force_retrieval_keys = force_retrieval_keys

       
    def build(self):
        start_time = time.time()
        self.bm25_idx.build(self.corpus_kv)
        self.vec_idx.build(self.corpus_kv)
        end_time = time.time()
        logger.info(f"HybridRetriever build time: {end_time - start_time} seconds")

    async def abuild(self):
        """异步版本的 build 方法"""
        start_time = time.time()
        await self.bm25_idx.abuild(self.corpus_kv)
        await self.vec_idx.abuild(self.corpus_kv)
        end_time = time.time()
        logger.info(f"HybridRetriever abuild time: {end_time - start_time} seconds")

    def search(self, query: str, topk: int = 10, bm25mode="adaptive") -> Tuple[List[Tuple[str, float, int, int]]]:
        start_time = time.time()
        bm25_scores = self.bm25_idx.search(query, topk * 2, mode=bm25mode)
        vec_scores = self.vec_idx.search(query, topk * 2)

        if len(vec_scores) == 0:
            vec_scores = [(doc_id, 0.0) for doc_id, _ in bm25_scores]

        results = self.fuse_func(bm25_scores, vec_scores)
        if topk <= 0:
            topk = len(results)
        else:
            topk = min(topk, len(results))

        logger.info(f"Search Results: {results}")
        end_time = time.time()
        logger.info(f"HybridRetriever search time: {end_time - start_time} seconds")
        return results[:topk]

    async def asearch(self, query: str, topk: int = 10, bm25mode="adaptive") -> Tuple[List[Tuple[str, float, int, int]]]:
        """异步版本的 search 方法"""
        start_time = time.time()
        bm25_scores = await self.bm25_idx.asearch(query, topk * 2, mode=bm25mode)
        vec_scores = await self.vec_idx.asearch(query, topk * 2)

        if len(vec_scores) == 0:
            vec_scores = [(doc_id, 0.0) for doc_id, _ in bm25_scores]

        results = self.fuse_func(bm25_scores, vec_scores)
        if topk <= 0:
            topk = len(results)
        else:
            topk = min(topk, len(results))

        logger.info(f"Async Search Results: {results}")
        end_time = time.time()
        logger.info(f"HybridRetriever asearch time: {end_time - start_time} seconds")
        return results[:topk]


if __name__ == "__main__":
    corpus_kv = {
        "R1": "退货超过30天需要经理审批。",
        "R2": "生鲜商品24小时内可凭购物凭证退货。",
        "R3": "家用电器7天内无理由退货，需保持商品完好。",
        "R4": "线上订单超过15天仅换不退，需通过在线客服申请。",
        "R5": "定制商品不支持退货，除非存在质量问题。",
        "R6": "促销活动商品退货需扣除相应优惠金额。",
        "R7": "跨境商品退货需支付国际运费和关税。",
        "R8": "二手商品不提供退货服务，请仔细检查后购买。",
        "R9": "礼品卡一经售出，概不退换。",
        "R10": "数码产品拆封后非质量问题不予退货。"
    }
    # idx = KVAdaptiveBM25(force_retrieval_keys=["R1"])
    # idx.build(corpus_kv)

    # q = "购买35天后想退货怎么办 return policy 30 days"
    # print("== Okapi ==")
    # for k, s in idx.search(q, topk=3, mode="okapi"):
    #     print(k, s)
    # print("== Adaptive ==")
    # for k, s in idx.search(q, topk=3, mode="adaptive"):
    #     print(k, s)
    from af_agent.utils.embeddings import EmbeddingServiceFactory
    
    embedding = EmbeddingServiceFactory(
        embedding_type="model_factory",
        user_id="450dd110-5bba-11f0-b8d9-1688e6ea28e2",
        timeout=5,
    ).get_service()

    # 同步示例
    idx = HybridRetriever(emb_service=embedding, corpus_kv=corpus_kv, force_retrieval_keys=["R1"])
    idx.build()
    q = "数码和家电产品的 return 策略"
    print("=== 同步搜索结果 ===")
    for k, s, rb, rv in idx.search(q, topk=3):
        print(k, s, rb, rv)

    # 异步示例
    async def async_example():
        async_idx = HybridRetriever(emb_service=embedding, corpus_kv=corpus_kv, force_retrieval_keys=["R1"])
        await async_idx.abuild()
        q = "数码和家电产品的 return 策略"
        print("\n=== 异步搜索结果 ===")
        results = await async_idx.asearch(q, topk=3)
        for k, s, rb, rv in results:
            print(k, s, rb, rv)

    # 运行异步示例
    asyncio.run(async_example())