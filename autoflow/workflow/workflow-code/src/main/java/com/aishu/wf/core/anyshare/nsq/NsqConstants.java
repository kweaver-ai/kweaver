package com.aishu.wf.core.anyshare.nsq;

import java.util.HashMap;
import java.util.Map;

/**
 * @description nsq消息常量类
 * @author ouandyang
 */
public class NsqConstants {
    /** NSQ默认消费通道 **/
    public static final String DEFAULT_CHANNEL = "WORKFLOW";

    /** 发起共享给指定用户的申请 **/
    public static final String CORE_AUDIT_SHARE_REALNAME_APPLY = "core.audit.share.realname.apply";
    /** 共享给指定用户的申请-审核通知 **/
    public static final String CORE_AUDIT_SHARE_REALNAME_NOTIFY = "core.audit.share.realname.notify";
    /** 共享给任意用户的申请 **/
    public static final String CORE_AUDIT_SHARE_ANONYMOUS_APPLY = "core.audit.share.anonymous.apply";
    /** 共享给任意用户的申请-审核通知 **/
    public static final String CORE_AUDIT_SHARE_ANONYMOUS_NOTIFY = "core.audit.share.anonymous.notify";
    /** 取消共享申请 **/
    public static final String CORE_AUDIT_SHARE_CANCEL = "core.audit.share.cancel";
    /** 发起文件同步申请 */
    public static final String WORKFLOW_SYNC_APPLY = "workflow.sync.apply";
    /** 文件同步审核通知 **/
    public static final String WORKFLOW_SYNC_NOTIFY = "workflow.sync.notify";
    /** 取消同步申请 **/
    public static final String CORE_AUDIT_SYNC_CANCEL = "core.audit.sync.cancel";
    /** 取消同步流程审核任务 **/
    public static final String WORKFLOW_SYNC_PROCESS_CANCEL = "workflow.sync.process.cancel";
    /** 删除同步流程 **/
    public static final String WORKFLOW_SYNC_PROCESS_DELETE = "workflow.sync.process.delete";
    /** 同步流程名称变更 **/
    public static final String WORKFLOW_SYNC_PROCESS_RENAME = "workflow.sync.process.rename";
    /** 记录管理控制台操作日志 **/
    public static final String WORKFLOW_EACP_LOG = "workflow.eacp.log";
    /** 记录管理控制台操作日志 **/
    public static final String WORKFLOW_AUDIT_OPERATION_LOG = "as.audit_log.log_operation";
    /** 记录管理控制台管理日志 **/
    public static final String WORKFLOW_AUDIT_MANAGEMENT_LOG = "as.audit_log.log_management";
    /** 记录消息服务 **/
    public static final String WORKFLOW_EACP_MSG = "workflow.eacp.msg";
    /** 审核相关消息事件 **/
    public static final String WORKFLOW_AUDIT_MSG = "workflow.audit.msg";
    /** 文件彻底删除 */
    public static final String CORE_FILE_DELETE = "core.file.delete";
    /** 文件删除 */
    public static final String CORE_FILE_REMOVE = "core.file.remove";
    /** 文档库删除 */
    public static final String CORE_DOCLIB_REMOVE = "core.doclib.remove";
    /** 文件移动 */
    public static final String CORE_FILE_MOVE = "core.file.move";
    /** 文件重命名 */
    public static final String CORE_FILE_RNNAME = "core.file.rename";
    /** 文件夹删除 */
    public static final String CORE_FOLDER_REMOVE = "core.folder.remove";
    /** 文件夹重命名 */
    public static final String CORE_FOLDER_RNNAME = "core.folder.rename";
    /** 文件夹移动 */
    public static final String CORE_FOLDER_MOVE = "core.folder.move";
    /** 用户删除 */
    public static final String CORE_USER_DELETE = "core.user.delete";
    /** 组织机构成员名称变更（用户，部门，联系人组） */
    public static final String CORE_ORG_NAME_MODIFY = "core.org.name.modify";
    /** 用户冻结 */
    public static final String CORE_USER_FREEZE = "core.user.freeze";
    /** 流程定义失效结果 */
    public static final String CORE_PROC_DEF_INVALID = "core.proc.def.invalid";
    /** 流程定义生效结果 */
    public static final String CORE_PROC_DEF_EFFECT = "core.proc.def.effect";
    /** 流程定义修改 **/
    public static final String CORE_PROC_DEF_MODIFY = "core.proc.def.modify";
    /** 发起文档同步申请 **/
    public static final String CORE_AUDIT_SYNC_APPLY = "core.audit.sync.apply";
    /** 文档同步审核通知 **/
    public static final String CORE_AUDIT_SYNC_NOTIFY = "core.audit.sync.notify";
    /** 发起文档流转申请 **/
    public static final String CORE_AUDIT_FLOW_APPLY = "core.audit.flow.apply";
    /** 文档流转审核通知 **/
    public static final String CORE_AUDIT_FLOW_NOTIFY = "core.audit.flow.notify";
    /** 文档流转流程作废审核通知 **/
    public static final String CORE_AUDIT_FLOW_RECEIVER = "core.audit.flow.cancel";

    /** 流程定义名称修改 **/
    public static final String CORE_PROC_NAME_REALNAME = "core.proc.name.modify";

    /** 审核信息变更 **/
    public static final String CORE_AUDIT_FLOW_MODIFY = "core.audit.flow.modify";


    /** 任意审核-内部审核异步API-发起审核申请（模块服务发起审核消息至NSQ , workflow从NSQ接收消息并驱动模块审核流程执行）**/
    public static final String WORKFLOW_AUDIT_APPLY= "workflow.audit.apply";
    /** 任意审核-内部审核异步API-模块后端更新审核内容（模块后端将审核内容变更的消息发送至NSQ , workflow从NSQ接收消息） **/
    public static final String WORKFLOW_AUDIT_UPDATE= "workflow.audit.update";
    /** 任意审核-内部审核异步API-取消（撤销）模块审核申请（模块逻辑发生变化变更，需要主动取消审核申请, 发送取消消息至NSQ , workflow从NSQ接收消息并撤销审核申请） **/
    public static final String WORKFLOW_AUDIT_CANCEL= "workflow.audit.cancel";
    /** 任意审核-内部审核异步API-删除审核流程（模块逻辑发生变化变更,需要删除对应的审核流程，发送取消消息 至NSQ , workflow从NSQ接收消息并删除审核流程）**/
    public static final String WORKFLOW_AUDIT_DELETE= "workflow.audit.delete";
    /** 任意审核-内部审核异步API-workflow匹配到审核员（topic中的audit_type为业务的审核申请类型，workflow匹配到审核员后将审核员消息发送至NSQ ,模块服务从NSQ接收消息并给该审核员配置权限等） **/
    public static final String WORKFLOW_AUDIT_AUDITOR= "workflow.audit.auditor";
    /** 任意审核-内部审核异步API-workflow通知审核结果（topic中的audit_type为业务的审核申请类型，workflow审核结束后,将审核结果消息发送至NSQ ,模块服务从NSQ接收消息并做对应的业务处理） **/
    public static final String WORKFLOW_AUDIT_RESULT= "workflow.audit.result";
    /** 任意审核-内部审核异步API-workflow审核流程被删除（topic中的audit_type为业务的审核申请类型） **/
    public static final String WORKFLOW_AUDIT_PROC_DELETE= "workflow.audit.proc.delete";


    /**
     * 消息发送NSQ
     * */
    public static final String CORE_NSQ_PREFIX = "work-flow/v1/";
    public static final String CORE_NSQ_APPLIED_SUFFIX = "-on-applied";
    public static final String CORE_NSQ_PROCESSED_SUFFIX = "-on-processed";
    /** 开启实名共享申请 **/
    public static final String CORE_APPLY_SHARE_OPEN = "work-flow/v1/share-with-users-on-applied";
    /** 关闭实名共享申请 **/
    public static final String CORE_APPLY_SHARE_CLOSE = "work-flow/v1/share-with-users-off-applied";
    /** 开启共享审核结果消息 **/
    public static final String CORE_APPROVE_SHARE_OPEN = "work-flow/v1/share-with-users-on-processed";
    /** 关闭共享审核结果消息 **/
    public static final String CORE_APPROVE_SHARE_CLOSE = "work-flow/v1/share-with-users-off-processed";
    /** 继承变更审核结果消息 **/
    public static final String CORE_APPROVE_PERM_INHERIT = "work-flow/v1/inherit-perm-processed";
    /** 继承变更申请消息 **/
    public static final String CORE_APPLY_PERM_INHERIT = "work-flow/v1/inherit-perm-applied";
    /** 开启所有者申请消息 **/
    public static final String CORE_APPLY_OWNER_SET = "work-flow/v1/set-owner-applied";
    /** 取消所有者申请消息 **/
    public static final String CORE_APPLY_OWNER_UNSET = "work-flow/v1/remove-owner-applied";
    /** 开启所有者审核结果消息 **/
    public static final String CORE_APPROVE_OWNER_SET = "work-flow/v1/set-owner-processed";
    /** 取消所有者审核结果消息 **/
    public static final String CORE_APPROVE_OWNER_UNSET = "work-flow/v1/remove-owner-processed";
    /** 开启匿名共享申请消息 **/
    public static final String CORE_APPLY_LINK_OPEN = "work-flow/v1/share-with-anyone-on-applied";
    /** 开启匿名共享审核结果消息 **/
    public static final String CORE_APPROVE_LINK_OPEN = "work-flow/v1/share-with-anyone-on-processed";

    /** 开启文档同步申请消息 **/
    public static final String SYNC_TO_AUDITOR_ = "work-flow/v1/sync-by-users-on-applied";
    /** 开启文档同步审核结果消息 **/
    public static final String SYNC_TO_APPLICANT_ = "work-flow/v1/sync-by-users-on-processed";
    /** 开启文档流转申请消息 **/
    public static final String FLOW_TO_AUDITOR_ = "work-flow/v1/doc-relay-on-applied";
    /** 开启文档流转审核结果消息 **/
    public static final String FLOW_TO_APPLICANT_ = "work-flow/v1/doc-relay-on-processed";
    /** 文档流转审核退回消息 **/
    public static final String FLOW_TO_APPLICANT_SENDBACK = "work-flow/v1/doc-relay-on-sendback";
    /** 开启加签消息 **/
    public static final String COUNTER_SIGN_TO_AUDITOR_ = "work-flow/v1/counter-sign-applied";
    /** 开启转审消息 **/
    public static final String TRANSFER_TO_AUDITOR_ = "work-flow/v1/transfer-applied";
    /** 开启撤销消息 **/
    public static final String TREVOCATION_TO_AUDITOR_ = "work-flow/v1/revocation-applied";

    public static final String THIRDPARTY_MESSAGE_PLUGIN_MESSAGE_PUSH = "thirdparty_message_plugin.message.push";

    /** 定时提醒 **/
    public static final String EXPIRED_REMINDER = "default.as.workflow.reminder";

    public static final String LINE_BREAK = "/r/n";

    public static Map<String,String> topicMap = new HashMap<>();

    static  {
        topicMap.put("apply_share_open",CORE_APPLY_SHARE_OPEN);
        topicMap.put("apply_share_close",CORE_APPLY_SHARE_CLOSE);
        topicMap.put("approve_share_open",CORE_APPROVE_SHARE_OPEN);
        topicMap.put("approve_share_close",CORE_APPROVE_SHARE_CLOSE);
        topicMap.put("approve_perm_inherit",CORE_APPROVE_PERM_INHERIT);
        topicMap.put("apply_perm_inherit",CORE_APPLY_PERM_INHERIT);
        topicMap.put("apply_owner_set",CORE_APPLY_OWNER_SET);
        topicMap.put("apply_owner_unset",CORE_APPLY_OWNER_UNSET);
        topicMap.put("approve_owner_set",CORE_APPROVE_OWNER_SET);
        topicMap.put("approve_owner_unset",CORE_APPROVE_OWNER_UNSET);
        topicMap.put("apply_link_open",CORE_APPLY_LINK_OPEN);
        topicMap.put("approve_link_open",CORE_APPROVE_LINK_OPEN);

        topicMap.put("apply_sync_open",SYNC_TO_AUDITOR_);
        topicMap.put("approve_sync_open",SYNC_TO_APPLICANT_);
        topicMap.put("apply_flow_open",FLOW_TO_AUDITOR_);
        topicMap.put("approve_flow_sendback",FLOW_TO_APPLICANT_SENDBACK);
        topicMap.put("approve_flow_open",FLOW_TO_APPLICANT_);
        topicMap.put("counter_sign_open",COUNTER_SIGN_TO_AUDITOR_);
        topicMap.put("transfer_open",TRANSFER_TO_AUDITOR_);
        topicMap.put("revocation_open",TREVOCATION_TO_AUDITOR_);
    }

    public enum PROCESS_MESSAGE {
        SYNC("sync", "sync-by-users"),
        FLOW("flow", "doc-relay-on");

        private final String bizType;
        private final String msgType;

        private PROCESS_MESSAGE(String bizType, String msgType) {
            this.bizType = bizType;
            this.msgType = msgType;
        }

        public String getBizType() {
            return this.bizType;
        }

        public String getMsgType() {
            return this.msgType;
        }

        public static String getMsgType(String bizType) {
            for (NsqConstants.PROCESS_MESSAGE c : NsqConstants.PROCESS_MESSAGE.values()) {
                if (c.getBizType().equals(bizType)) {
                    return c.getMsgType();
                }
            }
            return bizType;
        }
    }

    public enum AUDIT_NOTIFY_TOPIC {
        REALNAME("realname", CORE_AUDIT_SHARE_REALNAME_NOTIFY),
        ANONYMOUS("anonymous", CORE_AUDIT_SHARE_ANONYMOUS_NOTIFY),
        SYNC("sync", CORE_AUDIT_SYNC_NOTIFY);





        private final String name;
        private final String value;

        private AUDIT_NOTIFY_TOPIC(String name, String value) {
            this.name = name;
            this.value = value;
        }

        public String getName() { return this.name; }

        public static String getValue(String name) {
            for (AUDIT_NOTIFY_TOPIC item : AUDIT_NOTIFY_TOPIC.values()) {
                if (item.getName().equals(name)) {
                    return item.value;
                }
            }
            return null;
        }
    }

}
