package com.aishu.wf.core.common.util;

/**
 * 流程常量
 *
 * @author Liuchu
 * @since 2021-3-30 18:02:47
 */
public class WorkflowConstants {
    /**
     * 超级管理员角色ID（不变）
     **/
    public static final String SUPER_ADMIN_ROLE = "7dcfcc9c-ad02-11e8-aa06-000c29358ad6";
    /**
     * 安全管理员角色ID（不变）
     **/
    public static final String SECURITY_ADMIN_ROLE = "d8998f72-ad03-11e8-aa06-000c29358ad6";
    /**
     * 组织管理员角色ID（不变）
     **/
    public static final String ORGANIZATION_ADMIN_ROLE = "e63e1c88-ad03-11e8-aa06-000c29358ad6";

    /**
     * 接入消息中心系统角色ID
     */
    public static final String ZERO_ROLE = "00000000-0000-0000-0000-000000000000";

    /**
     * 审核状态-待审核
     **/
    public static final String AUDIT_STATUS_DSH = "pending";
    /**
     * 审核状态-已审核
     **/
    public static final String AUDIT_STATUS_YSH = "end";
    /**
     * 审核状态-已作废
     **/
    public static final String AUDIT_STATUS_YZF = "cancel";
    /**
     * 流程日志类型-文本监控（text）
     */
    public static final String PROC_LOGS_TEXT = "text";
    /**
     * 流程日志类型-图像监控（image）
     */
    public static final String PROC_LOGS_IMAGE = "image";
    /**
     * 查询类型-我的申请
     **/
    public final static String TYPE_APPLY = "apply";
    /**
     * 查询类型-我的待办
     **/
    public final static String TYPE_TASK = "task";
    /**
     * 查询类型-我的已办
     **/
    public final static String TYPE_HISTORY = "history";
    /**
     * 查询类型-我的审核
     **/
    public final static String TYPE_AUDIT = "audit";
    /**
     * 流程类型-文档共享审核
     **/
    public static final String WORKFLOW_TYPE_SHARE = "doc_share";
    /**
     * 流程类型-文档同步审核
     **/
    public static final String WORKFLOW_TYPE_SYNC = "doc_sync";
    /**
     * 流程类型-文档流转审核
     **/
    public static final String WORKFLOW_TYPE_FLOW = "doc_flow";

    /**
     * 流程类型-任意审核arbitrarily
     **/
    public static final String WORKFLOW_TYPE_ARBITRARILY = "doc_arbitrarily";
    /**
     * 流程类型-加签
     **/
    public static final String WORKFLOW_TYPE_COUNTERSIGN = "counter_sign";
    /**
     * 流程类型-转审
     **/
    public static final String WORKFLOW_TYPE_TRANSFER = "transfer";
    /**
     * 流程类型-撤销
     **/
    public static final String WORKFLOW_TYPE_REVOCATION = "revocation";
    /**
     * 流程变量-审核结果
     **/
    public static final String WORKFLOW_AUDIT_RESULT = "auditResult";
    /**
     * 审核结果-通过
     **/
    public static final String AUDIT_RESULT_PASS = "pass";
    /**
     * 审核结果-拒绝
     **/
    public static final String AUDIT_RESULT_REJECT = "reject";
    /**
     * 审核结果-退回
     **/
    public static final String AUDIT_RESULT_SENDBACK = "sendback";
    /**
     * 审核结果-免审核
     **/
    public static final String AUDIT_RESULT_AVOID = "avoid";
    /**
     * 消息服务消息发送类型-执行结果发送
     **/
    public static final String MSG_SEND_TYPE_RESULT = "result";
    /**
     * 消息服务消息发送类型-审核异常发送
     **/
    public static final String MSG_SEND_TYPE_ERROR = "error";
    /**
     * 消息服务消息发送类型-自动审核发送
     **/
    public static final String MSG_SEND_TYPE_AUTO = "auto";
    /**
     * 审核策略规则类型-角色
     **/
    public static final String RULE_TYPE_ROLE = "role";
    /**
     * 未匹配到部门审核员类型-自动通过
     **/
    public static final String AUTO_PASS = "auto_pass";
    /**
     * 未匹配到部门审核员类型-自动拒绝
     **/
    public static final String AUTO_REJECT = "auto_reject";

    /**
     * 文档所有者审核-被申请文档所有者(配置权限)
     */
    public static final String DOC_CONFPERM_AUDIT = "as_doc_confperm_audit";

    /**
     * 文档所有者审核-被申请文档所有者(配置权限和继承权限)
     */
    public static final String DOC_INHCONFPERM_AUDIT = "as_doc_inhconfperm_audit";

    /**
     * 文档所有者审核-被申请文档所在目录所有者(配置权限和继承权限)
     */
    public static final String BELONGDIR_INHCONFPERM_AUDIT = "as_belongdir_inhconfperm_audit";

    /**
     * 共享审核流程
     */
    public enum SHARE_PROCESS {
        RENAME("Process_SHARE001", "实名共享审核工作流"),
        ANONYMITY("Process_SHARE002", "匿名共享审核工作流");

        private final String value;
        private final String name;

        private SHARE_PROCESS(String value, String name) {
            this.value = value;
            this.name = name;
        }

        public String getValue() {
            return this.value;
        }

        public static String getName(String procDefId) {
            if (procDefId.contains("Process_SHARE001")) {
                return SHARE_PROCESS.RENAME.name;
            } else if (procDefId.contains("Process_SHARE002")) {
                return SHARE_PROCESS.ANONYMITY.name;
            }
            return null;
        }
    }

    /**
     * 审核模式
     */
    public enum AUDIT_MODEL {
        TJSH("tjsh", "同级审核"),
        ZJSH("zjsh", "依次审核"),
        HQSH("hqsh", "会签审核");

        private final String value;
        private final String name;

        private AUDIT_MODEL(String value, String name) {
            this.value = value;
            this.name = name;
        }

        public String getValue() {
            return this.value;
        }

        public static String getName(String value) {
            for (AUDIT_MODEL c : AUDIT_MODEL.values()) {
                if (c.getValue().equals(value)) {
                    return c.name;
                }
            }
            return null;
        }
    }

    /**
     * 策略类型
     */
    public enum STRATEGY_TYPE {
        NAMED_AUDITOR("named_auditor", "指定用户审核"),
        DEPT_AUDITOR("dept_auditor", "部门审核员"),
        MULTILEVEL("multilevel", "连续多级部门审核"),
        EXCUTING_AUDITOR("excuting_auditor", "执行流程时动态指定审核员"),
        PREDEFINED_AUDITOR("predefined_auditor", "预定义审核员"),
        MANAGER("manager", "上级审核员"),
        KC_ADMIN("kc_admin", "知识管理审核员");

        private final String value;
        private final String name;

        private STRATEGY_TYPE(String value, String name) {
            this.value = value;
            this.name = name;
        }

        public String getValue() {
            return this.value;
        }

        public static String getName(String value) {
            for (STRATEGY_TYPE c : STRATEGY_TYPE.values()) {
                if (c.getValue().equals(value)) {
                    return c.name;
                }
            }
            return null;
        }
    }

    /**
     * 匹配级别类型
     */
    public enum LEVEL_TYPE {
        directlyLevel("directlyLevel", -1, "直属部门"),
        belongUp1("belongUp1", 1, "直属部门向上一级"),
        belongUp2("belongUp2", 2, "直属部门向上二级"),
        belongUp3("belongUp3", 3, "直属部门向上三级"),
        belongUp4("belongUp4", 4, "直属部门向上四级"),
        belongUp5("belongUp5", 5, "直属部门向上五级"),
        belongUp6("belongUp6", 6, "直属部门向上六级"),
        belongUp7("belongUp7", 7, "直属部门向上七级"),
        belongUp8("belongUp8", 8, "直属部门向上八级"),
        belongUp9("belongUp9", 9, "直属部门向上九级"),
        belongUp10("belongUp10", 10, "直属部门向上十级"),
        highestLevel("highestLevel", 0, "最高级部门审核员"),
        highestDown1("highestDown1", 1, "最高级部门向下一级"),
        highestDown2("highestDown2", 2, "最高级部门向下二级"),
        highestDown3("highestDown3", 3, "最高级部门向下三级"),
        highestDown4("highestDown4", 4, "最高级部门向下四级"),
        highestDown5("highestDown5", 5, "最高级部门向下五级"),
        highestDown6("highestDown6", 6, "最高级部门向下六级"),
        highestDown7("highestDown7", 7, "最高级部门向下七级"),
        highestDown8("highestDown8", 8, "最高级部门向下八级"),
        highestDown9("highestDown9", 9, "最高级部门向下九级"),
        highestDown10("highestDown10", 10, "最高级部门向下十级"),;

        private final String value;
        private final int level;
        private final String name;

        private LEVEL_TYPE(String value, int level, String name) {
            this.value = value;
            this.level = level;
            this.name = name;
        }

        public String getValue() {
            return this.value;
        }

        public String getName() {
            return this.name;
        }

        public int getLevel() {
            return this.level;
        }

        public boolean isHighestLevel() {
            return this.value.contains("highestLevel");
        }

        public boolean isDirectlyLevel() {
            return this.value.contains("directlyLevel");
        }

        public boolean isBelongUp() {
            return this.value.contains("belongUp");
        }

        public boolean isHighestDown() {
            return this.value.contains("highestDown");
        }

        public static LEVEL_TYPE getLevelType(String value) {
            for (LEVEL_TYPE c : LEVEL_TYPE.values()) {
                if (c.getValue().equals(value)) {
                    return c;
                }
            }
            return null;
        }
    }

    /**
     * 流程分类
     */
    public enum PROCESS_CATEGORY {
        SYNC("sync", "doc_sync"),
        FLOW("flow", "doc_flow");

        private final String auditType;
        private final String category;

        private PROCESS_CATEGORY(String auditType, String category) {
            this.auditType = auditType;
            this.category = category;
        }

        public String getAuditType() {
            return this.auditType;
        }

        public String getCategory() {
            return this.category;
        }

        public static String getCategory(String auditType) {
            for (PROCESS_CATEGORY c : PROCESS_CATEGORY.values()) {
                if (c.getAuditType().equals(auditType)) {
                    return c.getCategory();
                }
            }
            return auditType;
        }

        public static String getAuditType(String category) {
            for (PROCESS_CATEGORY c : PROCESS_CATEGORY.values()) {
                if (c.getCategory().equals(category)) {
                    return c.getAuditType();
                }
            }
            return category;
        }
    }
}
