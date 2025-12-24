/**
 * workflow审核状态
 */
export const enum WorkflowAuditStatus {
    /**
     * 审核中
     */
    Pending = 'pending',

    /**
     * 已通过
     */
    Pass = 'pass',

    /**
     * 已拒绝
     */
    Reject = 'reject',

    /**
     * 已撤销
     */
    Undone = 'undone',

    /**
     * 审核自动通过
     */
    Avoid = 'avoid',

    /**
     * 发起失败
     */
    Failed = 'failed',
}

/**
 * workflow审核界面的tab页
 */
export const enum AuditPageTarget {
    /**
     * 【我的申请】
     */
    applyPage = 'applyPage',

    /**
     * 【我的待办】
     */
    auditPage = 'auditPage',

    /**
     * 【我处理的】
     */
    donePage = 'donePage'
}