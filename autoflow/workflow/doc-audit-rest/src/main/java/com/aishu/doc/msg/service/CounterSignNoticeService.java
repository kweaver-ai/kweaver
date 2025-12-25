package com.aishu.doc.msg.service;

import cn.hutool.core.util.StrUtil;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.doc.msg.model.ProcessMsgTypeEnum;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
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
 * @author: xiashenghui
 * @create: 2022-09-29 15:33
 **/
@Slf4j
@Service(value = WorkflowConstants.WORKFLOW_TYPE_COUNTERSIGN)
public class CounterSignNoticeService extends AbstractMessageNoticeService  {

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
    protected List<MsgObject> buildMessageForAuditorObject(ProcessInputModel inputModel, ProcessInstanceModel result, String messageType,
                                                           String sendType) throws Exception {
        Map<String, Object> fields = inputModel.getFields();
        List<String> auditorIds = Arrays.asList(fields.get("cur_auditors").toString().split(","));
        String startUserId = inputModel.getWf_sendUserId();
        if(null != result && !WorkflowConstants.MSG_SEND_TYPE_AUTO.equals(sendType)){
            startUserId = StrUtil.isNotEmpty(result.getStartUserId()) ? result.getStartUserId() : startUserId;
        }
        String senderName = "";
        User user = userService.getUserById(startUserId);
        if(null != user){
            senderName = user.getUserName();
        }
        MsgContent msgContent = MsgContent.builder()
                .accessorname((String) fields.get("accessorName"))
                .accessortype((String) fields.get("accessorType"))
                .csf((Integer) fields.get("docCsfLevel"))
                .end(-1L)
                .gns((String) fields.get("docId"))
                .isdir(Objects.equals("folder", fields.get("docType")))
                .sender(startUserId)
                .senderName(senderName)
                .time(System.currentTimeMillis() * 1000)
                .url((String) fields.get("docName"))
                .applyid((String) fields.get("applyId"))
                .type(ProcessMsgTypeEnum.getValueByName("counter_sign_open"))
                .bizType((String) fields.get("bizType"))
                .doc_names((String) fields.get("docNames"))
                .original_channel((String) fields.get("originalChannel"))
                .build();
        MsgObject msgObject = MsgObject.builder()
                .content(msgContent)
                .receivers(userManagementOperation.batchListUsers(auditorIds))
                .build();
        List<MsgObject> msgObjectList = new ArrayList<>();
        msgObject = common.setTaskID(msgObject, inputModel, result.getProcInstId());
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
