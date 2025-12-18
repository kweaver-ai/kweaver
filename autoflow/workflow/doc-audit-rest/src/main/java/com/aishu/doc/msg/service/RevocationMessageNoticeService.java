package com.aishu.doc.msg.service;

import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.doc.msg.model.ProcessMsgTypeEnum;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;

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

/**
 * @program: workflow
 * @description:
 * @author: siyu.chen
 * @create: 2023-11-04 23:50
 **/
@Slf4j
@Service(value = WorkflowConstants.WORKFLOW_TYPE_REVOCATION)
public class RevocationMessageNoticeService extends AbstractMessageNoticeService {

    @Resource
    private AnyShareConfig anyShareConfig;

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
    protected List<MsgObject> buildMessageForApplicantObject(ProcessInputModel inputModel, ProcessInstanceModel result,
            String messageType,
            String sendType) throws Exception {
        return null;
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
    protected List<MsgObject> buildMessageForAuditorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType, String sendType) throws Exception {
        Map<String, Object> fields = inputModel.getFields();
        List<String> applyUserId = Arrays.asList(fields.get("applyUserId").toString().split(","));
        MsgContent msgContent = MsgContent.builder()
                .csf((Integer) fields.get("docCsfLevel"))
                .end(-1L)
                .gns((String) fields.get("docId"))
                .isdir(Objects.equals("folder", fields.get("docType")))
                .time(System.currentTimeMillis() * 1000)
                .applyid((String) fields.get("applyId"))
                .type(ProcessMsgTypeEnum.getValueByName(messageType))
                .url((String) fields.get("docName"))
                .bizType((String) fields.get("bizType"))
                .doc_names((String) fields.get("docNames"))
                .build();
        MsgObject msgObject = MsgObject.builder()
                .content(msgContent)
                // 发起人id
                .receivers(userManagementOperation.batchListUsers(applyUserId))
                .build();
        List<MsgObject> msgObjectList = new ArrayList<>();
        // 设置审核员信息
        msgObject.setContent(common.setRevocationAuditor(msgContent, fields.get("applyId").toString(), result.getEndActivityId()));
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
    protected List<MsgObject> buildMessageForVisitorObject(ProcessInputModel inputModel, ProcessInstanceModel result,
            String messageType,
            String sendType) {
        return null;
    }
}