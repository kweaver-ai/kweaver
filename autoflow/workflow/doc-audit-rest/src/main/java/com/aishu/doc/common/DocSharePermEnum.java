package com.aishu.doc.common;

/**
 * 文档共享权限枚举
 * @author ouandyang
 * @date 2021年4月20日
 */
public enum DocSharePermEnum {
    DISPLAY("display", 1, "显示"),
    PREVIEW("preview", 2, "预览"),
    DOWNLOAD("download", 4, "下载"),
    CREATE("create", 8, "新建"),
    MODIFY("modify", 16, "修改"),
    DELETE("delete", 32, "删除"),
    CACHE("cache", 64, "缓存");

    private final String code;

    private final int value;

    private final String remark;

    DocSharePermEnum(String code, int value, String remark) {
        this.code = code;
        this.value = value;
        this.remark = remark;
    }

    public String getCode() {
        return code;
    }

    public int getValue() {
        return value;
    }

    public String getRemark() { return remark; }
}
