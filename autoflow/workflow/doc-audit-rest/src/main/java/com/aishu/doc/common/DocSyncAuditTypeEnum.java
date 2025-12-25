package com.aishu.doc.common;

/**
 * 文档共享权限枚举
 * @author ouandyang
 * @date 2021/8/26
 */
public enum DocSyncAuditTypeEnum {
    SYNC("sync", "同步"),
    COPY("copy", "拷贝"),
    MOVE("move", "移动");

    private final String code;
    private final String name;

    DocSyncAuditTypeEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    /**
     * @description 根据 审核模式编码 获取 审核模式名称
     * @author ouandyang
     * @param  code 审核模式编码
     * @updateTime 2021/8/26
     */
    public static String getNameByCode(String code) {
        for (DocSyncAuditTypeEnum item : DocSyncAuditTypeEnum.values()) {
            if (String.valueOf(item.getCode()).equals(code)) {
                return item.getName();
            }
        }
        return null;
    }
}
