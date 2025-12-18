package com.aishu.doc.msg.model;

/**
 * 流程消息类型枚举类
 *
 * @author liuchu
 * @since 2021-4-21 10:41:04
 */
public enum ProcessMsgTypeEnum {
    /**
     * 开启共享消息（未使用）
     */
    SHARE_OPEN("share_open",1),
    /**
     * 关闭共享消息（未使用）
     */
    SHARE_CLOSE("share_close",2),
    /**
     * 设置所有者消息（未使用）
     */
    OWNER_SET("owner_set",3),
    /**
     * 取消所有者消息（未使用）
     */
    OWNER_UNSET("owner_unset",4),
    /**
     * 开启共享申请消息
     */
    APPLY_SHARE_OPEN("apply_share_open",5),
    /**
     * 取消共享申请消息
     */
    APPLY_SHARE_CLOSE("apply_share_close",6),
    /**
     * 开启所有者申请消息
     */
    APPLY_OWNER_SET("apply_owner_set",7),
    /**
     * 取消所有者申请消息
     */
    APPLY_OWNER_UNSET("apply_owner_unset",8),
    /**
     * 开启匿名共享申请消息
     */
    APPLY_LINK_OPEN("apply_link_open",9),
    /**
     * 开启共享审核结果消息
     */
    APPROVE_SHARE_OPEN("approve_share_open",10),
    /**
     * 关闭共享审核结果消息
     */
    APPROVE_SHARE_CLOSE("approve_share_close",11),
    /**
     * 开启所有者审核结果消息
     */
    APPROVE_OWNER_SET("approve_owner_set",12),
    /**
     * 取消所有者审核结果消息
     */
    APPROVE_OWNER_UNSET("approve_owner_unset",13),
    /**
     * 开启匿名共享审核结果消息
     */
    APPROVE_LINK_OPEN("approve_link_open",14),
    /**
     * 设置密级申请消息
     */
    APPLY_CSF_LEVEL_SET("apply_csf_level_set",19),
    /**
     * 设置密级申请结果消息
     */
    APPROVE_CSF_LEVEL_SET("approve_csf_level_set",20),
    /**
     * 继承变更申请消息
     */
    APPLY_PERM_INHERIT("apply_perm_inherit",30),
    /**
     * 继承变更审核结果消息
     */
    APPROVE_PERM_INHERIT("approve_perm_inherit",31),
    /**
     * 开启文档同步申请消息
     */
    APPLY_SYNC_OPEN("apply_sync_open",32),
    /**
     * 开启文档同步审核结果消息
     */
    APPROVE_SYNC_OPEN("approve_sync_open",33),
    /**
     * 开启文档流转申请消息
     */
    APPLY_FLOW_OPEN("apply_flow_open",34),
    /**
     * 开启文档流转审核结果消息
     */
    APPROVE_FLOW_OPEN("approve_flow_open",35),

    /**
     * 开启任意审核申请消息
     */
    APPLY_AT_WILL_OPEN("apply_at_will_open",36),
    /**
     * 开启任意审核审核结果消息
     */
    APPROVE_AT_WILL_OPEN("approve_at_will_open",37),
    /**
     * 开启加签消息
     */
    COUNTER_SIGN_OPEN("counter_sign_open",38),
    /**
     * 开启转审消息
     */
    TRANSFER_OPEN("transfer_open",39),
    /**
     * 开启流程撤销消息
     */
    REVOCATION_OPEN("revocation_open",40),
    /**
     * 开启文档流转审核结果消息
     */
    APPROVE_FLOW_SENDBACK("approve_flow_sendback",41);






    private String name;
    private Integer value;

    ProcessMsgTypeEnum(String name, Integer value) {
        this.name = name;
        this.value = value;
    }

    public Integer getValue() {
        return value;
    }

    public static Integer getValueByName(String name) {
        ProcessMsgTypeEnum processMsgTypeEnum = valueOf(name.toUpperCase());
        return processMsgTypeEnum.getValue();
    }

    public static void main(String[] args) {
        Integer share_open = ProcessMsgTypeEnum.getValueByName("share_open");
        System.out.println(share_open);
    }
}
