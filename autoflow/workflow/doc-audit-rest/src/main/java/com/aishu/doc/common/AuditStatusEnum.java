package com.aishu.doc.common;

/**
 * 审核状态枚举
 * @author ouandyang
 * @date 2021/6月/日
 */
public enum AuditStatusEnum {
    /**
     * 审核中
     */
    PENDING("pending", 1),
    /**
     * 已拒绝
     */
    REJECT("reject", 2),
    /**
     * 已通过
     */
    PASS("pass", 3),
    /**
     * 自动审核通过
     */
    AVOID("avoid", 4),
    /**
     * 作废（作废数据不显示，如删除文档触发作废申请、重复申请）
     */
    CANCEL("cancel", 5),
    /**
     * 发起失败
     */
    FAILED("failed", 6),
    /**
     * 转审
     * author siyu.chen
     */
    TRANSFER("transfer", 7),
    /**
     * 转审
     * author siyu.chen
     */
    SENDBACK("sendback", 8),
    /**
     * 重新发起, 审核重新发起不能删除原记录智能添加一个删除状态
     */
    SOFTDELETE("delete", 9),
    /**
     * 撤销
     */
    UNDONE("undone", 70),
    /**
     * 已通过（审核已通过、审核中）
     */
    DONEPASS("donepass", 80);

    private final String code;

    private final int value;

    AuditStatusEnum(String code, int value) {
        this.code = code;
        this.value = value;
    }

    public String getCode() {
        return code;
    }

    public int getValue() {
        return value;
    }

    /**
     * @description 根据code获取value
     * @author ouandyang
     */
    public static Integer getValueByCode(String code) {
        for (AuditStatusEnum item : AuditStatusEnum.values()) {
            if (String.valueOf(item.getCode()).equals(code)) {
                return item.getValue();
            }
        }
        return null;
    }

    /**
     * @description 根据code获取value
     * @author ouandyang
     */
    public static String getCodeByValue(Integer value) {
        for (AuditStatusEnum item : AuditStatusEnum.values()) {
            if (item.getValue() == value) {
                return item.getCode();
            }
        }
        return null;
    }
}
