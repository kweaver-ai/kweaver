package com.aishu.wf.core.common.util;

import org.apache.thrift.annotation.Nullable;

/**
 * 操作日志常量
 *
 * @author Liuchu
 * @since 2021-3-31 18:01:40
 */
public class OperationLogConstants {
    /**
     * 第三方审核配置操作日志
     */
    public final static String THIRD_AUDIT_LOG = "third_audit_log";
    /**
     * 新建流程定义操作日志
     */
    public final static String ADD_PROCESS_DEFINITION_LOG = "add_process_definition_log";
    /**
     * 更新流程定义操作日志
     */
    public final static String UPDATE_PROCESS_DEFINITION_LOG = "update_process_definition_log";
    /**
     * 复制流程定义操作日志
     */
    public final static String COPY_PROCESS_DEFINITION_LOG = "copy_process_definition_log";
    /**
     * 删除流程定义操作日志
     */
    public final static String DELETE_PROCESS_DEFINITION_LOG = "delete_process_definition_log";
    /**
     * 新建审核策略操作日志
     */
    public final static String ADD_SHARE_STRATEGY_LOG = "add_share_strategy_log";
    /**
     * 更新审核策略操作日志
     */
    public final static String UPDATE_SHARE_STRATEGY_LOG = "update_share_strategy_log";
    /**
     * 删除审核策略操作日志
     */
    public final static String DELETE_SHARE_STRATEGY_LOG = "delete_share_strategy_log";
    /**
     * 新建部门审核员规则操作日志
     */
    public final static String ADD_DEPT_AUDITOR_RULE_LOG = "add_dept_auditor_rule_log";
    /**
     * 更新部门审核员规则操作日志
     */
    public final static String UPDATE_DEPT_AUDITOR_RULE_LOG = "update_dept_auditor_rule_log";
    /**
     * 删除部门审核员规则操作日志
     */
    public final static String DELETE_DEPT_AUDITOR_RULE_LOG = "delete_dept_auditor_rule_log";
    /**
     * 流程任务重新分配审核员操作日志
     */
    public final static String TASK_ASSIGNMENT_LOG = "task_assignment_log";
    /**
     * 流程实例作废操作日志
     */
    public final static String INSTANCE_CANCEL_LOG = "instance_cancel_log";
    /**
     * 增加免审核部门操作日志
     */
    public final static String ADD_FREE_AUDIT_DEPT_LOG = "add_free_audit_dept_log";
    /**
     * 删除免审核部门操作日志
     */
    public final static String DELETE_FREE_AUDIT_DEPT_LOG = "delete_free_audit_dept_log";
    /**
     * 文档审核日志
     */
    public final static String DOC_AUDIT_LOG = "doc_audit_log";

    /**
     * 文档审核日志-发起
     */
    public final static String DOC_AUDIT_ADD_LOG = "doc_audit_add_log";

    /**
     * 文档审核日志-审核
     */
    public final static String DOC_AUDIT_UPDATE_LOG = "doc_audit_update_log";

    /**
     * 文档审核日志-审核结束
     */
    public final static String DOC_AUDIT_END_LOG = "doc_audit_end_log";

    /**
     * 文档审核日志-撤销
     */
    public final static String DOC_AUDIT_UNDONE_LOG = "doc_audit_undone_log";

    /**
     * 审核加签日志
     */
    public final static String COUNTERSIGN_LOG = "countersign_log";

    /**
     * 审核转审日志
     */
    public final static String Transfer_LOG = "transfer_log";

    /**
     * 审核退回日志
     */
    public final static String SENDBACK_LOG = "sendback_log";

    /**
     * 审核重新提交日志
     */
    public final static String RESUBMIT_LOG = "resubmit_log";

    /**
     * 日志级别
     */
    public enum LogLevel {
        NCT_LL_NULL(-1),
        NCT_LL_ALL(0),
        NCT_LL_INFO(1),
        NCT_LL_WARN(2);

        private final int value;

        private LogLevel(int value) {
            this.value = value;
        }

        public int getValue() {
            return this.value;
        }

        @Nullable
        public static LogLevel findByValue(int value) {
            switch(value) {
                case 0:
                    return NCT_LL_ALL;
                case 1:
                    return NCT_LL_INFO;
                case 2:
                    return NCT_LL_WARN;
                default:
                    return null;
            }
        }
    }

}
