package com.aishu.doc.msg.service;

import cn.hutool.core.util.StrUtil;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.doc.msg.model.ProcessMsgTypeEnum;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @program: workflow
 * @description:
 * @author: xiashenghui
 * @create: 2022-07-11 15:33
 **/
@Slf4j
@Service(value = WorkflowConstants.WORKFLOW_TYPE_FLOW + "_flow")
public class FlowMessageNoticeService extends AbstractMessageNoticeService  {

    @Resource
    private AnyShareConfig anyShareConfig;

    @Autowired
    private UserService userService;

    private UserManagementOperation userManagementOperation;

    @Autowired
    private Common common;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }


    /**
     * @description 构建流程通知申请者消息对象
     * @author hanj
     * @param inputModel  流程输入参数
     * @param result      流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    @Override
    protected List<MsgObject> buildMessageForApplicantObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType,
                                                             String sendType) throws Exception {
        Map<String, Object> fields = inputModel.getFields();
        Boolean auditIdea = Boolean.parseBoolean((String) fields.get("auditIdea"));
        String startUserId = inputModel.getWf_sendUserId();
        String auditname = "";
        if(null != result && !WorkflowConstants.MSG_SEND_TYPE_AUTO.equals(sendType)){
            startUserId = StrUtil.isNotEmpty(result.getStartUserId()) ? result.getStartUserId() : startUserId;
        }
        String senderName = "";
        String senderUserId = inputModel.getWf_sendUserId();
        User user = userService.getUserById(senderUserId);
        if(null != user){
            senderName = user.getUserName();
        }
        JSONArray docs = JSON.parseArray(fields.get("docs").toString());
        MsgContent msgContent = MsgContent.builder()
                .accessorname((String) fields.get("accessorName"))
                .accessortype((String) fields.get("accessorType"))
                .auditmsg(inputModel.getWf_curComment())
                .auditname(auditname)
                .auditresult(auditIdea)
                .csf((Integer) fields.get("docCsfLevel"))
                .end(-1L)
                .gns((String) fields.get("docId"))
                .isdir(Objects.equals("folder", fields.get("docType")))
                .sender(senderUserId)
                .senderName(senderName)
                .time(System.currentTimeMillis() * 1000)
                .url((String) fields.get("docName"))
                .applyid((String) fields.get("applyId"))
                .type(ProcessMsgTypeEnum.getValueByName(messageType))
                .docs(docs)
                .doc_names((String) fields.get("docNames"))
                .build();
        MsgObject msgObject = MsgObject.builder()
                .content(msgContent)
                .receivers(userManagementOperation.batchListUsers(Arrays.asList(startUserId)))
                .build();
        List<MsgObject> msgObjectList = new ArrayList<>();

        msgObject = common.setTaskIDAndStatus(msgObject, inputModel, result);
        msgObjectList.add(msgObject);
        return msgObjectList;
    }

    /**
     * @description 构建流程通知审核者消息对象
     * @author hanj
     * @param inputModel  流程输入参数
     * @param result      流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    @Override
    protected List<MsgObject> buildMessageForAuditorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType,
                                                           String sendType) throws Exception {
        Map<String, Object> fields = inputModel.getFields();
        List<ActivityInstanceModel> tasks = result.getNextActivity();
        List<String> auditorIds = tasks.stream().map(ActivityInstanceModel::getReceiverUserId).collect(Collectors.toList());
        String startUserId = inputModel.getWf_sendUserId();
        if(null != result && !WorkflowConstants.MSG_SEND_TYPE_AUTO.equals(sendType)){
            startUserId = StrUtil.isNotEmpty(result.getStartUserId()) ? result.getStartUserId() : startUserId;
        }
        String senderName = "";
        User user = userService.getUserById(startUserId);
        if(null != user){
            senderName = user.getUserName();
        }
        Boolean auditIdea = Boolean.parseBoolean((String) fields.get("auditIdea"));
        JSONArray docs = JSON.parseArray(fields.get("docs").toString());
        MsgContent msgContent = MsgContent.builder()
                .accessorname((String) fields.get("accessorName"))
                .accessortype((String) fields.get("accessorType"))
                .auditresult(auditIdea)
                .csf((Integer) fields.get("docCsfLevel"))
                .end(-1L)
                .gns((String) fields.get("docId"))
                .isdir(Objects.equals("folder", fields.get("docType")))
                .sender(startUserId)
                .senderName(senderName)
                .time(System.currentTimeMillis() * 1000)
                .url((String) fields.get("docName"))
                .applyid((String) fields.get("applyId"))
                .type(ProcessMsgTypeEnum.getValueByName(messageType))
                .docs(docs)
                .doc_names((String) fields.get("docNames"))
                .build();
        MsgObject msgObject = MsgObject.builder()
                .content(msgContent)
                .receivers(userManagementOperation.batchListUsers(auditorIds))
                .build();
        List<MsgObject> msgObjectList = new ArrayList<>();
        msgObject = common.setTaskIDAndStatus(msgObject, inputModel, result);
        msgObjectList.add(msgObject);
        return msgObjectList;
    }

    /**
     * @description 构建流程通知访问者消息对象
     * @author hanj
     * @param inputModel  流程输入参数
     * @param result      流程输出参数
     * @param messageType 消息类型
     * @updateTime 2021/6/5
     */
    @Override
    protected List<MsgObject> buildMessageForVisitorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType,
                                                           String sendType) {
        return null;
    }
}