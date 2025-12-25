package com.aishu.doc.msg.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;

import com.aishu.doc.audit.dao.DocAuditSendBackMessageDao;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.DocAuditMessageModel;
import com.aishu.doc.audit.model.DocAuditMessageReceiverModel;
import com.aishu.doc.audit.model.DocAuditSendBackModel;
import com.aishu.doc.audit.model.dto.DocAuditMessageWithReceiversDTO;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.DocAuditMessageService;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.TaskUtil;
import com.aishu.doc.common.listUtils;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.ProcessMessageOperation;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;

import org.activiti.engine.HistoryService;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.history.HistoricTaskInstanceQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

/**
 * @description 审核消息通知
 * @author hanj
 */
@Service
@Slf4j
public class DocAuditMsgNotice {

    /**
     * 维护消息类型映射
     */
    private final static Map<String, String> TYPE_MAPPING_MAP = Maps.newHashMap();

    static {
        /**
         * key意义：
         * <p>perm: 权限申请</p>
         * <p>auditor: 审核员</p>
         * <p>applicant: 申请者</p>
         * <p>visitor: 访问者</p>
         * <p>create: 新增操作</p>
         * <p>modify: 修改操作</p>
         * <p>delete: 删除操作</p>
         */
        // 权限共享
        TYPE_MAPPING_MAP.put("perm_to_auditor_create", "apply_share_open");
        TYPE_MAPPING_MAP.put("perm_to_auditor_modify", "apply_share_open");
        TYPE_MAPPING_MAP.put("perm_to_auditor_delete", "apply_share_close");

        TYPE_MAPPING_MAP.put("perm_to_applicant_create", "approve_share_open");
        TYPE_MAPPING_MAP.put("perm_to_applicant_modify", "approve_share_open");
        TYPE_MAPPING_MAP.put("perm_to_applicant_delete", "approve_share_close");
        // 未使用
        TYPE_MAPPING_MAP.put("perm_to_visitor_create", "share_open");
        TYPE_MAPPING_MAP.put("perm_to_visitor_modify", "share_open");
        TYPE_MAPPING_MAP.put("perm_to_visitor_delete", "share_close");
        // 继承变更
        TYPE_MAPPING_MAP.put("inherit_to_auditor_", "apply_perm_inherit");
        TYPE_MAPPING_MAP.put("inherit_to_applicant_", "approve_perm_inherit");
        TYPE_MAPPING_MAP.put("inherit_to_visitor_", null);
        // 所有者
        TYPE_MAPPING_MAP.put("owner_to_auditor_create", "apply_owner_set");
        TYPE_MAPPING_MAP.put("owner_to_auditor_modify", null);
        TYPE_MAPPING_MAP.put("owner_to_auditor_delete", "apply_owner_unset");
        TYPE_MAPPING_MAP.put("owner_to_applicant_create", "approve_owner_set");
        TYPE_MAPPING_MAP.put("owner_to_applicant_modify", null);
        TYPE_MAPPING_MAP.put("owner_to_applicant_delete", "approve_owner_unset");
        // 未使用
        TYPE_MAPPING_MAP.put("owner_to_visitor_create", "owner_set");
        TYPE_MAPPING_MAP.put("owner_to_visitor_modify", null);
        TYPE_MAPPING_MAP.put("owner_to_visitor_delete", "owner_unset");
        // 匿名共享
        TYPE_MAPPING_MAP.put("anonymous_to_auditor_", "apply_link_open");
        TYPE_MAPPING_MAP.put("anonymous_to_applicant_", "approve_link_open");
        TYPE_MAPPING_MAP.put("anonymous_to_visitor_", null);
        // 文档同步
        TYPE_MAPPING_MAP.put("sync_to_auditor_", "apply_sync_open");
        TYPE_MAPPING_MAP.put("sync_to_applicant_", "approve_sync_open");
        // 文档流转
        TYPE_MAPPING_MAP.put("flow_to_auditor_", "apply_flow_open");
        TYPE_MAPPING_MAP.put("flow_to_applicant_", "approve_flow_open");
        TYPE_MAPPING_MAP.put("flow_to_applicant_sendback", "approve_flow_sendback");

        TYPE_MAPPING_MAP.put("counter_sign_to_auditor_", "counter_sign_open");
        TYPE_MAPPING_MAP.put("transfer_to_auditor_", "transfer_open");
        TYPE_MAPPING_MAP.put("revocation_to_auditor_", "revocation_open");
    }
    
    @Autowired
    HistoryService historyService;

    @Resource
    private AnyShareConfig anyShareConfig;

    private UserManagementOperation userManagementOperation;

    @Autowired
    DocAuditMessageService docAuditMessageService;

    @Autowired
    private DocAuditHistoryService docAuditHistoryService;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    private ProcessMessageOperation processMessageOperation;

    @Autowired
    DocAuditSendBackMessageDao docAuditSendBackMessage;

    private ProcessMessageOperation getProcessMessageOperation() {
        if (processMessageOperation != null) {
            return processMessageOperation;
        }
        AnyShareConfig anyshareConfig = (AnyShareConfig) ApplicationContextHolder.getBean("anyShareConfig");
        AnyShareClient client = new AnyShareClient(anyshareConfig);
        processMessageOperation = client.getProcessMessageOperation();
        return processMessageOperation;
    }

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }

    /**
     * @description 消息服务消息发送前置处理
     * @author hanj
     * @param processInstanceModel processInstanceModel
     * @updateTime 2021/9/1
     */
    public void preSendMessage(ProcessInstanceModel processInstanceModel){
        ProcessInputModel processInputModel = processInstanceModel.getProcessInputModel();
        Map<String, Object> fields = processInputModel.getFields();
        List<ActivityInstanceModel> tasks = processInstanceModel.getNextActivity();
        // 申请类型
        String type = (String) fields.get("type");
        String opType = "";
        // 流程类型
        String processType = processInstanceModel.getProcessDefinition().getCategory();
        // 操作类型（实名的继承变更和匿名共享无操作类型）
        if (processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE)) {
            opType = ("inherit".equals(type) || "anonymous".equals(type)) ? "" : (String) fields.get("opType");
        }
        String beanName = processType + "_" + type;
        Object isArbitraily = fields.get("isArbitraily");
        if (isArbitraily != null && (Boolean)isArbitraily) {
            beanName=WorkflowConstants.WORKFLOW_TYPE_ARBITRARILY;
        }

        if (processInstanceModel.isFinish() || processInstanceModel.isAutoReject()) {
            // 流程执行完毕，给申请者发送通知
            String messageType = TYPE_MAPPING_MAP.get(type + MsgObject._TO_APPLICANT_ + opType);
            // 兼容共享审核接入任意审核后的消息channel
            if(isArbitraily != null && (Boolean)isArbitraily && !processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE)){
                messageType = NsqConstants.CORE_NSQ_PREFIX + NsqConstants.PROCESS_MESSAGE.getMsgType((String)fields.get("bizType")) + NsqConstants.CORE_NSQ_PROCESSED_SUFFIX;
            }
            this.doSendMessage(beanName, MsgObject.RECEIVE_TYPE_APPLICANT, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_RESULT);
        } else if (processInstanceModel.isRevocation()){
            beanName = WorkflowConstants.WORKFLOW_TYPE_REVOCATION;
            String messageType = TYPE_MAPPING_MAP.get("revocation_to_auditor_");
            this.doSendMessage(beanName, MsgObject.RECEIVE_TYPE_AUDITOR, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_RESULT);
        } else if (CollUtil.isNotEmpty(tasks)) {
            // 给审核员发送审核通知
            String messageType = TYPE_MAPPING_MAP.get(type + MsgObject._TO_AUDITOR_ + opType);
            // 兼容共享审核接入任意审核后的消息channel
            if(isArbitraily != null && (Boolean)isArbitraily && !processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE)){
                messageType = NsqConstants.CORE_NSQ_PREFIX + NsqConstants.PROCESS_MESSAGE.getMsgType((String)fields.get("bizType")) + NsqConstants.CORE_NSQ_APPLIED_SUFFIX;
            }
            this.doSendTodoMessage(beanName, MsgObject.RECEIVE_TYPE_AUDITOR, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_RESULT);
        }

        if (processInstanceModel.isSendBack()) {
            // 当前仅适配文档流转，后续需要其他类型的退回消息再扩展
            String messageType = TYPE_MAPPING_MAP.get(type + MsgObject._TO_APPLICANT_SENDBACK + opType);
            if (messageType == null) {
                return;
            }
            this.sendSendBackMessage(beanName, MsgObject.RECEIVE_TYPE_APPLICANT, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_RESULT);
        }
    }

    /**
     * @description 未找到审核员且自动审核开关关闭通知申请者
     * @author hanj
     * @param docAuditApplyModel docAuditApplyModel
     * @param processInputModel processInputModel
     * @param processInputModel processInputModel
     * @updateTime 2021/6/15
     */
    public void sendErrMsgApplicant(ExceptionErrorCode errorCode, DocAuditApplyModel docAuditApplyModel, ProcessInputModel processInputModel){
        try {
            Map<String, Object> fields = processInputModel.getFields();
            // 申请类型
            String type = (String) fields.get("type");
            String opType = "";
            String beanName = "doc_" + docAuditApplyModel.getApplyType() + type;
            if("perm".equals(docAuditApplyModel.getApplyType()) || "inherit".equals(docAuditApplyModel.getApplyType()) ||
                    "owner".equals(docAuditApplyModel.getApplyType()) || "anonymous".equals(docAuditApplyModel.getApplyType())){
                // 操作类型（实名的继承变更和匿名共享无操作类型）
                opType = ("inherit".equals(type) || "anonymous".equals(type)) ? "" : (String) fields.get("opType");
                beanName = "doc_share_" + type;
            }
            Object isArbitraily = fields.get("isArbitraily");
            if(isArbitraily != null && (Boolean)isArbitraily){
                beanName=WorkflowConstants.WORKFLOW_TYPE_ARBITRARILY;
            }
            String messageType = TYPE_MAPPING_MAP.get(docAuditApplyModel.getApplyType() + MsgObject._TO_APPLICANT_ + opType);
            processInputModel.setWf_curComment(errorCode.getErrorDesc());
            ProcessInstanceModel processInstanceModel = new ProcessInstanceModel();
            processInstanceModel.setProcessInputModel(processInputModel);
            log.info("未找到审核员且自动审核开关关闭通知申请者！参数：{}、{}、{}", beanName, messageType, processInstanceModel);
            this.doSendMessage(beanName, MsgObject.RECEIVE_TYPE_APPLICANT, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_ERROR);
        } catch (Exception e) {
            log.warn("未找到审核员且自动审核开关关闭通知申请者失败：", e);
        }

    }

    /**
     * @description 自动审核发送消息通知（免审核部门+密级）
     * @author hanj
     * @param docAuditApplyModel docAuditApplyModel
     * @param processInputModel processInputModel
     * @updateTime 2021/6/26
     */
    public void sendAutoMsgApplicant(DocAuditApplyModel docAuditApplyModel, ProcessInputModel processInputModel){
        try {
            ProcessInstanceModel processInstanceModel = new ProcessInstanceModel();
            Map<String, Object> fields = processInputModel.getFields();
            // 申请类型
            String type = (String) fields.get("type");
            String opType = "";
            String beanName = "doc_" + docAuditApplyModel.getApplyType() + type;
            if("perm".equals(docAuditApplyModel.getApplyType()) || "inherit".equals(docAuditApplyModel.getApplyType()) ||
                    "owner".equals(docAuditApplyModel.getApplyType()) || "anonymous".equals(docAuditApplyModel.getApplyType())){
                // 操作类型（实名的继承变更和匿名共享无操作类型）
                opType = ("inherit".equals(type) || "anonymous".equals(type)) ? "" : (String) fields.get("opType");
                beanName = "doc_share_" + type;
            }
            Object isArbitraily = fields.get("isArbitraily");
            if(isArbitraily != null && (Boolean)isArbitraily){
                beanName=WorkflowConstants.WORKFLOW_TYPE_ARBITRARILY;
            }
            String messageType = TYPE_MAPPING_MAP.get(docAuditApplyModel.getApplyType() + MsgObject._TO_APPLICANT_ + opType);
            processInputModel.setWf_sendUserId(docAuditApplyModel.getApplyUserId());
            processInputModel.setWf_curComment("自动审核通过");
            processInstanceModel.setProcessInputModel(processInputModel);
            // 通知发起人
            this.doSendMessage(beanName, MsgObject.RECEIVE_TYPE_APPLICANT, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_AUTO);
        } catch (Exception e) {
            log.warn("自动审核发送消息通知（免审核部门+密级）失败：", e);
        }
    }

    public void sendCounterSignOrTransferMsgAuditor(ProcessInstanceModel processInstanceModel){
        try {
            Map<String, Object> fields = processInstanceModel.getProcessInputModel().getFields();
            String type = (String) fields.get("opt_type");
            String beanName = "";
            String messageType = "";
            if (type.equals("counter_sign")) {
                beanName = WorkflowConstants.WORKFLOW_TYPE_COUNTERSIGN;
                messageType = TYPE_MAPPING_MAP.get(type + "_to_auditor_");
            }else{
                beanName = WorkflowConstants.WORKFLOW_TYPE_TRANSFER;
                messageType = TYPE_MAPPING_MAP.get(type + "_to_auditor_");
            }
            String processType = processInstanceModel.getProcessDefinition().getCategory();

            String originalChannel;
            Object isArbitraily = fields.get("isArbitraily");
            String typ = (String) fields.get("type");
            String opType = (String) fields.get("opType");

            if(StrUtil.isEmpty(opType) || ("inherit".equals(typ) || "anonymous".equals(typ))){
                opType = "";
            }

            String originalMessageType = TYPE_MAPPING_MAP.get(typ + MsgObject._TO_AUDITOR_ + opType);

            if (isArbitraily != null && (Boolean) isArbitraily
                    && !processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE)) {
                messageType = NsqConstants.topicMap.get(messageType);
                originalMessageType = NsqConstants.CORE_NSQ_PREFIX
                        + NsqConstants.PROCESS_MESSAGE.getMsgType((String) fields.get("bizType"))
                        + NsqConstants.CORE_NSQ_APPLIED_SUFFIX;
            }

            if (isArbitraily != null && (Boolean) isArbitraily) {
                if (processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE)) {
                    originalChannel = NsqConstants.topicMap.get(originalMessageType);
                } else {
                    originalChannel = originalMessageType;
                }
            } else {
                originalChannel = NsqConstants.topicMap.get(originalMessageType);
            }

            if (StrUtil.isEmpty(originalChannel)){
                log.warn("获取原始消息channel失败, opType: {}, typ: {}, processType: {}", opType, typ, processType);
            }

            fields.put("originalChannel", originalChannel);
            this.doSendTodoMessage(beanName, MsgObject.RECEIVE_TYPE_AUDITOR, messageType, processInstanceModel, WorkflowConstants.MSG_SEND_TYPE_RESULT);
        } catch (Exception e) {
            log.warn("加签发送消息通知失败：", e);
        }
    }

    /**
     * @description 执行消息发送
     * @author hanj
     * @param beanName 消息对象构建子类名
     * @param receiveType 接收类型(applicant:申请者 visitor:访问者 auditor:审核员)
     * @param messageType 消息类型
     * @param processInstanceModel 流程实例对象
     * @param sendType 发送类型
     * @updateTime 2021/9/1
     */
	private void doSendMessage(String beanName, String receiveType, String messageType, ProcessInstanceModel processInstanceModel,
                               String sendType) {
        try {
            AbstractMessageNoticeService messageNoticeService = ApplicationContextHolder
                    .getBean(beanName, AbstractMessageNoticeService.class);
            messageNoticeService.sendMessage(processInstanceModel, receiveType, messageType, sendType);
        } catch (Exception e) {
            log.warn("消息服务发送消息失败,beanName:{},receiveType:{},messageType:{},processInstanceModel:{},error:{}", beanName,
                    receiveType, messageType, processInstanceModel, e);
        }
	}
    
    /**
     * @description 执行待办消息发送
     * @param beanName 消息对象构建子类名
     * @param receiveType 接收类型(applicant:申请者 visitor:访问者 auditor:审核员)
     * @param messageType 消息类型 根据 messageType 获取 channel
     * @param processInstanceModel 流程实例对象
     * @param sendType 发送类型
     */
    private void doSendTodoMessage(String beanName, String receiveType, String messageType,
            ProcessInstanceModel processInstanceModel,
            String sendType) {
        try {
            AbstractMessageNoticeService messageNoticeService = ApplicationContextHolder
                    .getBean(beanName, AbstractMessageNoticeService.class);

            List<MsgObject> msgObjects = messageNoticeService.buildTodoMessageObject(processInstanceModel, receiveType,
                    messageType, sendType);

            HistoricTaskInstanceQuery query = historyService.createHistoricTaskInstanceQuery();
            Set<String> sentTaskIds = query.processInstanceId(processInstanceModel.getProcInstId())
                    .list().stream()
                    .filter(task -> StrUtil.isNotEmpty(task.getMessageId()))
                    .map(task -> task.getId())
                    .collect(Collectors.toSet());

            if (CollUtil.isNotEmpty(sentTaskIds)) {
                msgObjects.removeIf(obj -> {
                    List<String> receiverIds = obj.getReceivers().stream().map(User::getId)
                            .collect(Collectors.toList());
                    MsgContent content = obj.getContent();
                    List<String> curAuditorTaskIds = content.getCur_auditors().stream().filter(
                            item -> receiverIds.contains(item.get("id")))
                            .map(item -> (String) item.get("task_inst_id"))
                            .collect(Collectors.toList());

                    for (String taskId : curAuditorTaskIds) {
                        if (sentTaskIds.contains(taskId)) {
                            return true;
                        }
                    }
                    return false;
                });
            }

            if (CollUtil.isEmpty(msgObjects)) {
                return;
            }

            List<String> messageIds = msgObjects.stream()
                    .map(obj -> docAuditMessageService.insertMessage(processInstanceModel.getProcInstId(), obj))
                    .collect(Collectors.toList());
            try {
                List<String> extMessageIds = messageNoticeService.sendTodoMessage(msgObjects);

                if (CollUtil.isEmpty(extMessageIds) || extMessageIds.size() != messageIds.size()) {
                    throw new Exception("消息发送失败");
                }
                for (int i = 0; i < extMessageIds.size(); i++) {
                    docAuditMessageService.updateExtMessageId(messageIds.get(i), extMessageIds.get(i));
                }
            } catch (Exception e) {
                log.warn("消息服务发送消息失败,beanName:{},receiveType:{},messageType:{},processInstanceModel:{},error:{}",
                        beanName,
                        receiveType, messageType, processInstanceModel, e);
            }
        } catch (Exception e) {
            log.warn("消息发送失败：", e);
        }
    }

    public void updateTodoMessageAsync(ProcessInstanceModel processInstanceModel){
        Runnable run = () -> {
            updateTodoMessage(processInstanceModel);
        };
        executor.execute(run);
    }

    public void updateTodoMessage(ProcessInstanceModel processInstanceModel) {
        ActivityInstanceModel currentActivity = processInstanceModel.getCurrentActivity();
        if (currentActivity == null) {
            // 创建审核任务, 消息在 AbstractMessageNoticeService 中发送
            return;
        }

        String taskId = currentActivity.getActInstId();
        HistoricTaskInstanceQuery query = historyService.createHistoricTaskInstanceQuery();
        HistoricTaskInstance task = query.taskId(taskId).singleResult();
        String messageId = task.getMessageId();
        String handlerId = task.getAssignee();

        if (task != null) {
            updateTodoMessage(processInstanceModel, handlerId, messageId);
        }
    }

    public void updateTodoMessageAsync(ProcessInstanceModel processInstanceModel, String handlerId, String messageId){
        Runnable run = () -> {
            updateTodoMessage(processInstanceModel, handlerId, messageId);
        };
        executor.execute(run);
    }

    public void updateTodoMessage(ProcessInstanceModel processInstanceModel, String handlerId, String messageId) {

        ProcessInputModel processInputModel = processInstanceModel.getProcessInputModel();
        String procInstId = processInstanceModel.getProcInstId();

        Map<String, Object> fields = processInputModel.getFields();
        Object isTransferObj = fields.get("isTransfer");
        Boolean isTransfer = isTransferObj != null && (Boolean) isTransferObj;

        DocAuditHistoryModel docAuditHistoryInfo = docAuditHistoryService.getByProcInstId(procInstId);

        String auditStatus = "";

        if (processInstanceModel.isRevocation()) {
            auditStatus = AuditStatusEnum.UNDONE.getCode();
        } else if (isTransfer) {
            auditStatus = AuditStatusEnum.TRANSFER.getCode();
        } else if (StrUtil.isNotEmpty(docAuditHistoryInfo.getAuditResult())) {
            auditStatus = docAuditHistoryInfo.getAuditResult();
        } else {
            Boolean auditIdea = Boolean.parseBoolean((String) fields.get("auditIdea"));
            auditStatus = auditIdea ? AuditStatusEnum.PASS.getCode() : AuditStatusEnum.REJECT.getCode();
        }

        Map<String, Set<String>> messageReceivers = new HashMap<>();

        Boolean isCompleted = processInstanceModel.isFinish() || processInstanceModel.isAutoReject()
                || processInstanceModel.isRevocation() || processInstanceModel.isCancel();

        if (isCompleted) {
            List<DocAuditMessageReceiverModel> unhandledReceivers = docAuditMessageService
                    .selectUnhandledReceiversByProcInstId(procInstId);

            for (DocAuditMessageReceiverModel receiver : unhandledReceivers) {
                String msgId = receiver.getMessageId();
                if (!messageReceivers.containsKey(msgId)) {
                    messageReceivers.put(msgId, new HashSet<>());
                }
                messageReceivers.get(msgId).add(receiver.getReceiverId());
            }
            docAuditMessageService.updateMessageHandlerByProcInstId(handlerId, auditStatus, procInstId);
        } else {
            HistoricTaskInstanceQuery query = historyService.createHistoricTaskInstanceQuery();
            List<HistoricTaskInstance> tasks = query.processInstanceId(procInstId).list();
            Optional<HistoricTaskInstance> taskOptional = tasks.stream()
                    .filter(t -> t.getMessageId().equals(messageId)).findFirst();
            
            // 同级审核非转审操作需要将同环节所有审核员标记为已处理
            if (!isTransfer && taskOptional.isPresent() && "tjsh".equals(taskOptional.get().getFormKey())) {
                String taskDefKey = taskOptional.get().getTaskDefinitionKey();
                List<HistoricTaskInstance> tjTasks = tasks.stream()
                        .filter(t -> taskDefKey.equals(t.getTaskDefinitionKey())).collect(Collectors.toList());
                for (HistoricTaskInstance t : tjTasks) {
                    String msgId = t.getMessageId();
                    if (!messageReceivers.containsKey(msgId)) {
                        messageReceivers.put(msgId, new HashSet<>());
                    }
                    messageReceivers.get(msgId).add(t.getAssignee());
                }
            }else{
                messageReceivers.put(messageId, new HashSet<>());
                messageReceivers.get(messageId).add(handlerId);
            }

            for (Map.Entry<String, Set<String>> entry : messageReceivers.entrySet()) {
                String msgId = entry.getKey();
                List<String> receiverIds = entry.getValue().stream().collect(Collectors.toList());
                docAuditMessageService.updateMessageHandler(handlerId, auditStatus, msgId, receiverIds);
            }
        }

        Set<String> allReceivers = messageReceivers.values().stream().flatMap(Set<String>::stream)
                .collect(Collectors.toSet());

        if (CollUtil.isEmpty(allReceivers)) {
            log.info("updateTodoMessage, 接收者为空");
            return;
        }

        List<String> allReceiverList = allReceivers.stream().collect(Collectors.toList());
        Map<String, User> userMap = new HashMap<>();

        try {
            List<User> users = userManagementOperation.getUserInfoByIds(listUtils.toString(allReceiverList));
            for (User user : users) {
                userMap.put(user.getId(), user);
            }
        } catch (Exception e) {
            log.warn("updateTodoMessage, 获取接收者信息失败");
            return;
        }

        try {
            ProcessMessageOperation processMessageOperation = getProcessMessageOperation();
            for (Map.Entry<String, Set<String>> entry : messageReceivers.entrySet()) {
                String msgId = entry.getKey();
                DocAuditMessageModel messageModel = docAuditMessageService.selectMessageById(msgId);
                MsgContent content = JSON.parseObject(messageModel.getPayload(), MsgContent.class);
                if(isCompleted){
                    content.setProc_status(auditStatus);
                }
                List<DocAuditMessageReceiverModel> handledReceivers = docAuditMessageService.selectHandledReceiversByMessageId(msgId);
                if (CollUtil.isNotEmpty(handledReceivers)) {
                    List<Map<String, Object>> status = handledReceivers.stream()
                            .map(obj -> {
                                Map<String, Object> m = new HashMap<>();
                                m.put("handler_id", obj.getHandlerId());
                                m.put("receiver_id", obj.getReceiverId());
                                m.put("status", obj.getAuditStatus());
                                return m;
                            }).collect(Collectors.toList());
                    content.setAudit_status(status);
                }
                log.info("更新消息 message_id {}, payload {}", messageModel.getExtMessageId(), content);

                Callable<Void> updateTodoMessageTask = () -> {
                    processMessageOperation.updateTodoMessage(messageModel.getExtMessageId(), null, content);
                    return null;
                };

                TaskUtil.runWithRetry(updateTodoMessageTask, 1000, 5, TaskUtil.RetryMode.EXPONENTIAL);

                List<String> msgReceivers = entry.getValue().stream()
                        .filter(receiverId -> userMap.containsKey(receiverId)).collect(Collectors.toList());
                if (CollUtil.isNotEmpty(msgReceivers) && StrUtil.isNotEmpty(handlerId)) {
                    log.info("更新消息 message_id {}, handler_id {}, receiver_ids {}",
                            messageModel.getExtMessageId(), handlerId, msgReceivers);

                    Callable<Void> updateTodoMessageReceiverHandlerTask = () -> {
                        processMessageOperation.updateTodoMessageReceiverHandler(messageModel.getExtMessageId(),
                                msgReceivers, handlerId);
                        return null;
                    };

                    TaskUtil.runWithRetry(updateTodoMessageReceiverHandlerTask, 1000, 5,
                            TaskUtil.RetryMode.EXPONENTIAL);
                }
            }

            if (isCompleted) {
                docAuditMessageService.deleteMessagesByProcInstId(procInstId);
            }

        } catch (Exception e) {
            log.warn("消息更新失败", e);
        }
    }

    public void sendRemindMessage(ProcessInstanceModel processInstanceModel, List<String> auditorIds, String remark) {
        try {
            if (CollUtil.isEmpty(auditorIds)) {
                return;
            }

            Map<String, User> auditorMap = userManagementOperation.batchListUsers(auditorIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));

            List<DocAuditMessageWithReceiversDTO> remindMessages = docAuditMessageService
                    .selectRemindAuditorMessages(processInstanceModel.getProcInstId(), auditorIds);
            List<MsgObject> messages = remindMessages.stream().map(msg -> {

                MsgContent msgContent = JSON.parseObject(msg.getPayload(), MsgContent.class);
                msgContent.setRemark(remark);

                List<User> receivers = msg.getReceivers().stream()
                        .filter(u -> auditorMap.containsKey(u.getReceiverId()))
                        .map(u -> auditorMap.get(u.getReceiverId())).collect(Collectors.toList());

                String channel = msg.getChan();

                if (channel.equals(NsqConstants.COUNTER_SIGN_TO_AUDITOR_)
                        || channel.equals(NsqConstants.TRANSFER_TO_AUDITOR_)) {
                    channel = msgContent.getOriginal_channel();
                }

                return MsgObject.builder()
                        .channel(channel.replaceAll("applied$", "remind"))
                        .content(msgContent)
                        .receivers(receivers)
                        .build();
            })
                    .filter(msg -> CollUtil.isNotEmpty(msg.getReceivers()))
                    .collect(Collectors.toList());

            if(CollUtil.isNotEmpty(messages)){
                ProcessMessageOperation processMessageOperation = getProcessMessageOperation();
                String str = JSON.toJSONString(messages);
                log.info("发送催办消息 {}", str);
                processMessageOperation.sendMessage(str);
            }
        } catch (Exception e) {
            log.warn("发送催办消息失败, auditorIds: {}", auditorIds);
        }
    }

    public void sendSendBackMessage(String beanName, String receiveType, String messageType, ProcessInstanceModel processInstanceModel, String sendType) {
        // 构建消息体
        try {
            AbstractMessageNoticeService messageNoticeService = ApplicationContextHolder.getBean(beanName, AbstractMessageNoticeService.class);

            List<MsgObject> msgObjects = messageNoticeService.buildTodoMessageObject(processInstanceModel, receiveType, messageType, sendType);
            
            Date now = new Date();
            DocAuditSendBackModel message = DocAuditSendBackModel.builder()
                    .id(IdUtil.randomUUID())
                    .procInstId(processInstanceModel.getProcInstId())
                    .messageId("")
                    .createTime(now)
                    .updateTime(now).build();
            
            // 插入消息记录
            docAuditSendBackMessage.insert(message);

             // 调用消息接口发送消息
            List<String> extMessageIds = messageNoticeService.sendTodoMessage(msgObjects);
            if (extMessageIds.size() == 0) {
                throw new Exception("消息列表为空");
            }
            message.setMessageId(extMessageIds.get(0));
            message.setUpdateTime(new Date());
            docAuditSendBackMessage.updateById(message);
        } catch (Exception e) {
            log.warn("退回消息服务发送消息失败,beanName:{},receiveType:{},messageType:{},processInstanceModel:{},error:{}",beanName,
                receiveType, messageType, processInstanceModel, e);
        }
    }

}