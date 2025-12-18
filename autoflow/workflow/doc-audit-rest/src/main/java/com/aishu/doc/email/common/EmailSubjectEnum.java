package com.aishu.doc.email.common;

/**
 * @description 邮件标题枚举
 * @author ouandyang
 */
public enum EmailSubjectEnum {
    /**
     * 审核员邮件标题
     */
    AUDITOR(" 待办提醒", " 待辦提醒", "To-Do alert of Workflow for "),
    /**
     * 撤销申请发送给审核员邮件标题
     */
    REVOCATION_AUDITOR(" 撤销提醒", " 撤銷提醒", "Undone alert for "),
    /**
     * 失效申请发送给申请人邮件标题
     */
    CANCEL(" 失效提醒", " 失效提醒", "Expired alert for "),
    /**
     * 发起人邮件标题前缀
     */
    CREATOR_PREFIX("您发起的", "您發起的", "Your request"),
    /**
     * 发起人邮件标题后缀
     */
    CREATOR_SUFFIX("已经被审核", "已被簽核", " has been processed"),
    /**
     * 文档共享-审核员邮件标题
     */
    SHARE_AUDITOR("共享审核 待办提醒", "共用簽核 待辦提醒", "To-Do alert of Workflow for sharing"),
    /**
     * 文档共享-发起人邮件标题
     */
    SHARE_CREATOR("您发起的共享已经被审核", "您發起的共用已經被簽核", "Your request for sharing has been processed"),
    /**
     * 文档共享-撤销申请发送给审核员邮件标题
     */
    SHARE_REVOCATION_AUDITOR("共享审核 撤销提醒", "共用簽核 撤銷提醒", "Request for sharing Undone Alert"),
    /**
     * 文档同步-审核员邮件标题
     */
    SYNC_AUDITOR("文档域同步审核 待办提醒", "文件網域同步簽核 待辦提醒", "To-Do alert of Workflow for Doc Domain Sync"),
    /**
     * 文档同步-发起人邮件标题
     */
    SYNC_CREATOR("您发起的文档域同步已经被审核", "您發起的文件網域同步已被簽核", "Your request for Doc Domain Sync has been processed"),
    /**
     * 文档同步-撤销申请发送给审核员邮件标题
     */
    SYNC_REVOCATION_AUDITOR("文档域同步审核 撤销提醒", "文件網域同步簽核 撤銷提醒", "Request for Doc Domain Sync Undone Alert"),

    /**
     * 文档流转-邮件标题
     */
    FLOW_AUDITOR("文档流转审核 待办提醒", "文件流轉簽核 待辦提醒", "Workflow of Doc Relay To-do Alert"),

    /**
     * 文档流转-撤销申请发送给审核员邮件标题
     */
    FLOW_REVOCATION_AUDITOR("文档流转审核 撤销提醒", "文件流轉簽核 撤銷提醒", "Workflow of Doc Relay Cancel Alert"),

    /**
     * 文档流转-失效申请发送给申请人邮件标题
     */
    FLOW_CANCEL("文档流转申请 失效提醒", "文件流轉申請 失效提醒", "Expired alert for Doc Relay"),

    /**
     * 文档流转-发起人邮件标题
     */
    FLOW_CREATOR("您发起的文档流转已经被审核", "您發起的文件流轉已被簽核", "Your request has been processed"),
    /**
     * 催办邮件标题
     */
    REMINDER("【%s通知】[%s] 的[%s]申请催办", "【%s通知】[%s] 的[%s]申請催辦", "【%s Notification】Approval reminder apply for %s's %s"),

    /**
     * 转审邮件标题
     */
    TRANSFER("【%s通知】[%s] 的[%s]申请", "【%s通知】[%s] 的[%s]申请", "【%s Notification】Approval audit for %s's %s"),

    /**
     * 共享审核-有效期
     */
    NEVER_EXPIRE("永久有效", "永久有效", "Never Expire"),

    /*
     * AUTOMATION_CREATOR_SUBJECT 工作流发起审核邮件主题 
     */
    AUTOMATION_CREATOR_SUBJECT("您提交的工作流已经被审核", "您提交的工作流已被簽核", "Your requested flow has been approved"),
    
    /*
     * AUTOMATION_AUDITOR_SUBJECT 工作流审核员审核邮件主题 
     */
    AUTOMATION_AUDITOR_SUBJECT("有新的工作流待您审核", "有新的工作流待您簽核", "There is a new flow for you to approve"),
   
    /*
     * AUTOMATION_REVOCATION_SUBJECT 工作流审核撤销邮件主题 
     */
    AUTOMATION_REVOCATION_SUBJECT("工作流已撤销", "工作流已撤銷", "A flow has been withdrawn"),
   
    /*
     * SENDBACK_SUBJECT 审核退回邮件主题 
     */
    SENDBACK_SUBJECT("您的%s已退回", "您的%s已退回", "Your request for %s has been returned");

    private final String zhCN;
    private final String zhTW;
    private final String enUS;

    EmailSubjectEnum(String zhCN, String zhTW, String enUS) {
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
}
