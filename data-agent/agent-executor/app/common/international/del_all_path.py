# -*-coding:utf-8-*-
# 删除国际化文件中的路径
import os


SRC_FILE1 = "./app/common/international/zh/LC_MESSAGES/messages.po"
TMP_FILE1 = "./app/common/international/zh/LC_MESSAGES/messages.tmp"

SRC_FILE2 = "./app/common/international/messages.pot"
TMP_FILE2 = "./app/common/international/messages.tmp"


# 删除国际化文件中的路径
def DelInternationalPath():
    # messages.po 文件处理
    fd_read = os.open(SRC_FILE1, os.O_RDONLY)
    fd_write = os.open(TMP_FILE1, os.O_RDWR | os.O_CREAT | os.O_TRUNC)

    with open(fd_read, "r") as file_read, open(fd_write, "w") as file_write:
        data = file_read.readline()
        while len(data) != 0:
            # 路径 以及 废弃翻译 不写入
            if "#: " not in data and "#~" not in data:
                file_write.write(data)
            data = file_read.readline()
    os.remove(SRC_FILE1)
    os.rename(TMP_FILE1, SRC_FILE1)

    # messages.pot 文件处理
    fd_read = os.open(SRC_FILE2, os.O_RDONLY)
    fd_write = os.open(TMP_FILE2, os.O_RDWR | os.O_CREAT | os.O_TRUNC)

    with open(fd_read, "r") as file_read, open(fd_write, "w") as file_write:
        data = file_read.readline()
        while len(data) != 0:
            # 路径不写入
            if "#: " not in data:
                file_write.write(data)
            data = file_read.readline()
    os.remove(SRC_FILE2)
    os.rename(TMP_FILE2, SRC_FILE2)
