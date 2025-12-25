package com.aishu.doc.msg.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;

import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.DocAuditMessageService;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.doc.msg.model.MsgPayload;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.ProcessMessageOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;

import org.activiti.engine.HistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @description 流程消息服务抽象父类
 * @author hanj
 */
public abstract class AbstractMessageNoticeService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private ProcessMessageOperation processMessageOperation;
    @Autowired
    NsqSenderService nsqSenderService;

    @Autowired
    private UserService userService;

    @Autowired
    protected HistoryService historyService;

    @Autowired
    ProcessInstanceService processInstanceService;

    @Autowired
    protected DocAuditHistoryService docAuditHistoryService;

    @Autowired
    protected DocAuditMessageService docAuditMessageService;

    /**
     * @description 初始化流程消息管理
     * @author hanj
     * @updateTime 2021/6/5
     */
    private ProcessMessageOperation getProcessMessageOperation() {
        if (processMessageOperation != null) {
            return processMessageOperation;
        }
        AnyShareConfig anyshareConfig = (AnyShareConfig) ApplicationContextHolder.getBean("anyShareConfig");
        AnyShareClient client = new AnyShareClient(anyshareConfig);
        processMessageOperation = client.getProcessMessageOperation();
        return processMessageOperation;
    }

    /**
     * @description 发送待办消息
     */
    final public List<String> sendTodoMessage(List<MsgObject> message) throws Exception {
        if (message == null || message.size() == 0) {
            return null;
        }
        List<MsgPayload> msgPayloads = message.stream().map(msg -> MsgPayload.builder().content(msg.getContent())
                .channel(msg.getChannel()).receivers(msg.getReceivers()).build()).collect(Collectors.toList());
        ProcessMessageOperation processMessageOpe = this.getProcessMessageOperation();
        String str = JSON.toJSONString(msgPayloads);
        return processMessageOpe.sendTodoMessage(str);
    }

    /**
     * @description 构建待办消息
     * @param instanceModel
     * @param receiveType
     * @param messageType
     * @param sendType
     * @return
     * @throws Exception
     */
    final public List<MsgObject> buildTodoMessageObject(ProcessInstanceModel instanceModel, String receiveType, String messageType, String sendType) throws Exception {
        if (StrUtil.isBlank(messageType)){
            return null;
        }
        ProcessInputModel inputModel = instanceModel.getProcessInputModel();
        List<MsgObject> message = this.buildMessageObject(inputModel, instanceModel, receiveType, messageType, sendType);
        // 去除没有接受者的消息
        message.removeIf(obj -> obj.getReceivers().size() == 0);
        if (message == null || message.size() == 0) {
            return null;
        }
        this.buildMessageObject(message, instanceModel, messageType);
        return message;
    }

    /**
     * @description 发送消息
     * @author hanj
     * @param instanceModel 流程实例对象
     * @param receiveType 接收类型(applicant:申请者 visitor:访问者 auditor:审核员)
     * @param messageType 消息类型
     * @param sendType 发送类型
     * @updateTime 2021/9/1
     */
    public void sendMessage(ProcessInstanceModel instanceModel, String receiveType, String messageType, String sendType) throws Exception {
        if (StrUtil.isBlank(messageType)) {
            throw new IllegalArgumentException("流程消息类型不能为空");
        }
        ProcessInputModel inputModel = instanceModel.getProcessInputModel();
        List<MsgObject> message = this.buildMessageObject(inputModel, instanceModel, receiveType, messageType, sendType);
        if (message == null || message.size() == 0) {
            return;
            }
        ProcessMessageOperation processMessageOpe = this.getProcessMessageOperation();

        String str = buildMessageObject(message, instanceModel, messageType);

        MsgObject msgObject = message.get(0);
        /**
         * 撤销消息已更新待办为已撤销状态，不再发送通知消息，仅推送第三方
         */
        if(NsqConstants.TREVOCATION_TO_AUDITOR_.equals(msgObject.getChannel())){

            HashMap<String, Object> headers = new HashMap<>();
            headers.put("msg_id", IdUtil.randomUUID());
            headers.put("receivers", msgObject.getReceivers());

            String msgBody = msgObject.getChannel()
                    + NsqConstants.LINE_BREAK
                    + JSON.toJSONString(headers)
                    + NsqConstants.LINE_BREAK
                    + JSON.toJSONString(msgObject.getContent());

            nsqSenderService.sendMessage(NsqConstants.THIRDPARTY_MESSAGE_PLUGIN_MESSAGE_PUSH, msgBody);
        }else{
            processMessageOpe.sendMessage(str);
        }
    }

    /**
     * @description 封装EACP公共类型消息体
     * @author hanj
     * @param msg 流程通知消息对象的JSON字符串
     * @param instanceModel 流程输出参数
     * @updateTime 2022/4/9
     */
    private String buildMessageObject(List<MsgObject> msg, ProcessInstanceModel instanceModel, String messageType){
        if (!instanceModel.isRevocation()){
            User user = userService.getUserById(instanceModel.getProcessInputModel().getWf_sendUserId());
            msg.get(0).setContent(msg.get(0).getContent().append(msg.get(0).getContent(),instanceModel,user));
        }
        ProcessInputModel inputModel = instanceModel.getProcessInputModel();
        Map<String, Object> fields = inputModel.getFields();
        // 如果当前申请以对接过任意审核那么业务数据都从业务部门给的数据中取
        // 某些流程存在isArbitraily字段，但是标志是false，此时应该也不走任意审逻辑
        Object isArbitraily = inputModel.getFields().get("isArbitraily");
        if(isArbitraily != null && (Boolean)isArbitraily){
            // 如果是任意审核拼接业务数据以及流程数据
            // 兼容共享审核接入任意审核后的消息channel以及审核撤销的消息channel
            String processType = instanceModel.getProcessDefinition().getCategory();
            if (processType.startsWith(WorkflowConstants.WORKFLOW_TYPE_SHARE) ||
                (fields.get("isRevocation") != null && (Boolean)fields.get("isRevocation"))){
                msg.get(0).setChannel(NsqConstants.topicMap.get(messageType));
            }else{
                msg.get(0).setChannel(messageType);
            }
            msg.get(0).setContent(msg.get(0).getContent().appendData(msg.get(0).getContent(), JSONUtil.parseObj(fields.get("data"))));
            return JSON.toJSONString(msg);
        }else{
            msg.get(0).setChannel(NsqConstants.topicMap.get(messageType));
        }
        return JSON.toJSONString(msg);
    }


    /**
     * @description 构建流程通知消息对象
     * @author hanj
     * @param inputModel 流程输入参数
     * @param instanceModel 流程输出参数
     * @param receiveType 接收类型
     * @param messageType 消息类型
     * @param sendType 发送类型
     * @updateTime 2021/9/1
     */
    private List<MsgObject> buildMessageObject(ProcessInputModel inputModel, ProcessInstanceModel instanceModel,
                                                String receiveType, String messageType, String sendType) throws Exception {
        if (MsgObject.RECEIVE_TYPE_AUDITOR.equals(receiveType)) {
            return this.buildMessageForAuditorObject(inputModel, instanceModel, messageType, sendType);
        } else if (MsgObject.RECEIVE_TYPE_APPLICANT.equals(receiveType)) {
            return this.buildMessageForApplicantObject(inputModel, instanceModel, messageType, sendType);
        } else if (MsgObject.RECEIVE_TYPE_VISITOR.equals(receiveType)) {
            return this.buildMessageForVisitorObject(inputModel, instanceModel, messageType, sendType);
        } else {
            throw new IllegalArgumentException(String.format("参数类型[%s]错误，取值范围：[\"auditor\", \"applicant\", \"visitor\"]", receiveType));
        }
    }

    /**
     * @description 构建流程通知申请者消息对象
     * @author hanj
     * @param inputModel 流程输入参数
     * @param result 流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    protected abstract List<MsgObject> buildMessageForApplicantObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType, String sendType) throws Exception;

    /**
     * @description 构建流程通知审核员消息对象
     * @author hanj
     * @param inputModel 流程输入参数
     * @param result 流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    protected abstract List<MsgObject> buildMessageForAuditorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType, String sendType) throws Exception;

    /**
     * @description 构建流程通知访问者消息对象
     * @author hanj
     * @param inputModel 流程输入参数
     * @param result 流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    protected abstract List<MsgObject> buildMessageForVisitorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType, String sendType) throws Exception;

}
