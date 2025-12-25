package com.aishu.doc.common;

import java.util.Arrays;
import java.util.List;

import com.aishu.wf.core.doc.common.DocConstants;

public enum TaskTypeEnum {
    /**
     * 共享给指定用户申请
     */
    TASKTYPE_PERM("共享给指定用户", "共用給指定使用者", "sharing with users"),
    /**
     * 共享给指定用户申请涉密模式
     */
    TASKTYPE_PERM_SECRET("内部授权", "內部授權", "sharing with users"),
    /**
     * 共享给任意用户申请
     */
    TASKTYPE_ANONYMOUS("共享给任意用户", "共用給任意使用者", "sharing with anyone"),
    /**
     * 文档流转
     */
    TASKTYPE_FLOW("文档流转", "文件流轉", "Doc Relay"),
    /**
     * 文档域同步
     */
    TASKTYPE_SYNC("文档域同步", "文件網域同步", "Doc Domain Sync"),
    /**
     * 定密申请
     */
    TASKTYPE_SECURITY("定密", "定密", "security setting");

    private final String zhCN;
    private final String zhTW;
    private final String enUS;
    protected final static String LANG_ZH_CN = "zh_CN";
    protected final static String LANG_ZH_TW = "zh_TW";
    protected final static String LANG_EN_US = "en_US";

    TaskTypeEnum(String zhCN, String zhTW, String enUS) {
        this.zhCN = zhCN;
        this.zhTW = zhTW;
        this.enUS = enUS;
    }

    public String getZhCN() {
        return zhCN;
    }

    public String getZhTW() {
        return zhTW;
    }

    public String getEnUS() {
        return enUS;
    }

    public String get(String language) {
        if (LANG_ZH_TW.equals(language)) {
            return zhTW;
        } else if (LANG_EN_US.equals(language)) {
            return enUS;
        } else {
            return zhCN;
        }
    }

    public static String getzh_CN() {
        return LANG_ZH_CN;
    }

    private static String getTaskTypeName(String bizType, String language) {
        if (bizType.equals(DocConstants.BIZ_TYPE_FLOW)) {
            return TaskTypeEnum.TASKTYPE_FLOW.get(language);
        } else if (bizType.equals(DocConstants.BIZ_TYPE_SYNC)) {
            return TaskTypeEnum.TASKTYPE_SYNC.get(language);
        } else if (bizType.equals(DocConstants.BIZ_TYPE_ANONYMITY_SHARE)) {
            return TaskTypeEnum.TASKTYPE_ANONYMOUS.get(language);
        } else if (bizType.equals(DocConstants.BIZ_TYPE_REALNAME_SHARE) ||
                bizType.equals(DocConstants.SHARED_LINK_PERM) ||
                bizType.equals(DocConstants.CHANGE_OWNER) ||
                bizType.equals(DocConstants.CHANGE_INHERIT)) {
            return TaskTypeEnum.TASKTYPE_PERM.get(language);
        } else {
            return TaskTypeEnum.TASKTYPE_SECURITY.get(language);
        }
    }

    /**
     * @description 获取审核类型多语言资源
     * @author siyu.chen
     * @updateTime 2023/11/23
     */
    public static String getTaskTypeName(String bizType, String language, Boolean isSecret) {
        List<String> docShareTypes = Arrays.asList("perm", "owner", "inherit", "realname");
        // 涉密模式下实名共享名词替换
        return isSecret && docShareTypes.contains(bizType)? TaskTypeEnum.TASKTYPE_PERM_SECRET.get(language) : getTaskTypeName(bizType, language);
    }
}
