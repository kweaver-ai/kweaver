import os
import time
from typing import Optional

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span


class ACNode(object):
    def __init__(self):
        self.children = {}  # 子节点
        self.fail = None  # 失败指针
        self.is_end = False  # 是否是单词结尾
        self.word = None  # 存储完整的敏感词


class ACFilter(object):
    def __init__(self):
        self.root = ACNode()

    def add_word(self, word):
        """添加敏感词"""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = ACNode()
            node = node.children[char]
        node.is_end = True
        node.word = word

    def build_fail_pointer(self):
        """构建失败指针"""
        queue = []
        # 将第一层节点的失败指针指向root
        for child in self.root.children.values():
            child.fail = self.root
            queue.append(child)

        while queue:
            current = queue.pop(0)
            # 遍历当前节点的所有子节点
            for char, child in current.children.items():
                fail = current.fail
                # 寻找失败指针
                while fail and char not in fail.children:
                    fail = fail.fail
                child.fail = fail.children[char] if fail else self.root
                queue.append(child)

    def search(self, text):
        """查找敏感词"""
        result = []
        node = self.root
        for i, char in enumerate(text):
            while node is not self.root and char not in node.children:
                node = node.fail
            if char in node.children:
                node = node.children[char]
            temp = node
            while temp is not self.root:
                if temp.is_end:
                    result.append((i - len(temp.word) + 1, temp.word))
                temp = temp.fail
        return result


sensitive_detector: Optional[ACFilter] = None


@internal_span()
def check_sensitive_word(text, span: Span = None) -> bool:
    """检测文本是否包含敏感词. True: 包含敏感词，False: 不包含敏感词"""
    if not Config.document.enable_sensitive_word_detection:
        # StandLogger.info_log("敏感词检测未开启，无法检测敏感词")
        return False
    global sensitive_detector
    if sensitive_detector is None:
        StandLogger.info_log("敏感词检测器未初始化，无法检测敏感词")
        return False
    result = sensitive_detector.search(text)
    if result:
        StandLogger.info_log(f"检测到的敏感词:{result}")
        # for pos, word in result:
        #     StandLogger.info_log(f"位置: {pos}, 敏感词: {word}")
        return True
    else:
        # StandLogger.info_log("没有检测到敏感词")
        return False


def build_sensitive_detector():
    global sensitive_detector
    if not Config.document.enable_sensitive_word_detection:
        # StandLogger.info_log("敏感词检测未开启，无法构建敏感词检测器")
        return
    if sensitive_detector is not None:
        return
    sensitive_detector = ACFilter()
    # 添加敏感词
    t1 = time.time()

    # 使用 Config.app.app_root 统一处理路径（已支持 PyInstaller 环境）
    sensitive_words_file = os.path.join(
        Config.app.app_root, "resources/data/sensitive_words.txt"
    )

    with open(sensitive_words_file, encoding="utf8") as f:
        sensitive_words = f.read().strip().split(",")
        StandLogger.info_log("敏感词数量为:{}".format(len(sensitive_words)))
    for word in sensitive_words:
        sensitive_detector.add_word(word)
    StandLogger.info_log("构造AC树完成，耗时{}秒".format(time.time() - t1))

    # 构建失败指针
    sensitive_detector.build_fail_pointer()
