package com.aishu.doc.msg.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.common.listUtils;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.doc.service.TransferInfoService;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class Common {
    @Autowired
    DocAuditHistoryService docAuditHistoryService;

    @Autowired
    TransferInfoService transferInfoService;

    @Resource
    private AnyShareConfig anyShareConfig;

    private UserManagementOperation userManagementOperation;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }


    public List<Map<String, Object>> setReceiverTaskInstID(List<User> receivers, Map<String, String> taskIDMap) {
        List<Map<String, Object>> receiverList = new ArrayList<>();

        if (CollUtil.isEmpty(receivers)) {
            return receiverList;
        }
        
        for (User receiver : receivers) {
            if (!taskIDMap.containsKey(receiver.getId())) {
                continue;
            }
            Map<String, Object> receiverMap= new HashMap<>();
            receiverMap.put("account", receiver.getAccount());
            receiverMap.put("id", receiver.getId());
            receiverMap.put("email", receiver.getEmail());
            receiverMap.put("task_inst_id", taskIDMap.get(receiver.getId()));
            receiverList.add(receiverMap);
        }

        return receiverList;
    }


    public MsgObject setTaskIDAndStatus(MsgObject msg, ProcessInputModel inputModel, ProcessInstanceModel instanceModel) throws Exception {
        MsgContent content = msg.getContent();
        Map<String, Object> fields = inputModel.getFields();
        DocAuditHistoryModel docAuditHistoryInfo = docAuditHistoryService.getById(fields.get("applyId").toString());
        String auditResult = "";
        if (docAuditHistoryInfo.getAuditResult() != null ) {
            auditResult = docAuditHistoryInfo.getAuditResult().equals(WorkflowConstants.AUDIT_RESULT_SENDBACK)
                    ? WorkflowConstants.AUDIT_RESULT_REJECT
                    : docAuditHistoryInfo.getAuditResult();
            content.setSend_back(docAuditHistoryInfo.getAuditResult().equals(WorkflowConstants.AUDIT_RESULT_SENDBACK));
        }
        content.setProc_status(auditResult);
        List<ActivityInstanceModel> tasks = instanceModel.getNextActivity();
        Map<String, String> taskIDMap = tasks.stream().collect(Collectors.toMap(ActivityInstanceModel::getReceiverUserId, task -> task.getActInstId()));
        List<Map<String, Object>> allCurAuditors = setReceiverTaskInstID(msg.getReceivers(), taskIDMap);
        if (allCurAuditors.size() != 0){
            content.setCur_auditors(allCurAuditors);
        }
        ActivityInstanceModel currentActivity = instanceModel.getCurrentActivity();
        // 可能是第一次初始化流程此时没有pre 审核员
        if (currentActivity == null) {
            msg.setContent(content);
            return msg;
        }
        // 当前流程所有的审核员信息
        List<DocAuditHistoryModel> docAuditHistoryList =  docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(fields.get("applyId").toString(), currentActivity.getActDefId());
        List<String> auditorIds = new ArrayList<>();
        for (DocAuditHistoryModel docAuditHistory : docAuditHistoryList) {
            // 非同级审核审核结果为空表示当前环节此审核员并非上一环节的审核员应跳过(因为上一环节已处理完,任务历史表中存在当前处理的审批人信息)
            // 转审人员也应被跳过
            if (!docAuditHistory.getAuditType().equals("tjsh") && (docAuditHistory.getAuditResult() == null) ||
                (docAuditHistory.getAuditResult() != null) && docAuditHistory.getAuditResult().equals("receiver_transfer")) {
                continue;
            }
            String auditorId = docAuditHistory.getAuditor();
            if(StrUtil.isEmpty(auditorId)){
                continue;
            }
            auditorIds.add(docAuditHistory.getAuditor());
        }
        if (auditorIds.size() == 0) {
            msg.setContent(content);
            return msg;
        }
        taskIDMap = docAuditHistoryList.stream().filter(obj -> obj.getAuditResult() ==null || obj.getAuditResult() !=null && !obj.getAuditResult().equals("receiver_transfer"))
            .collect(Collectors.toMap(DocAuditHistoryModel::getAuditor, docAuditHistory -> docAuditHistory.getId()));
        content.setPre_auditors(setReceiverTaskInstID(userManagementOperation.batchListUsers(auditorIds), taskIDMap));
        msg.setContent(content);
        return msg;
    }

    public MsgObject setTaskID(MsgObject msg, ProcessInputModel inputModel, String procInstID) throws Exception {
        Map<String, Object> fields = inputModel.getFields();
        String applyID = fields.get("applyId").toString();
        String actDefID = inputModel.getWf_nextActDefId() == null ? inputModel.getWf_curActDefId() : inputModel.getWf_nextActDefId();
        String curAuditorID = fields.get("userId").toString();
        MsgContent content = msg.getContent();
        List<DocAuditHistoryModel> docAuditHistoryList =  docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(applyID, actDefID);
        Map<String, String> taskIDMap = docAuditHistoryList.stream().filter(obj -> obj.getAuditResult() ==null || obj.getAuditResult() !=null && !obj.getAuditResult().equals("receiver_transfer"))
            .collect(Collectors.toMap(DocAuditHistoryModel::getAuditor, docAuditHistory -> docAuditHistory.getId()));
        content.setCur_auditors(setReceiverTaskInstID(msg.getReceivers(), taskIDMap));
        String type = fields.get("opt_type") != null ? (String) fields.get("opt_type") : "";
        // 转审审核员的信息，需要重新过滤筛选
        if (type.equals(WorkflowConstants.WORKFLOW_TYPE_TRANSFER)){
            // 获取转审人员列表
            List<TransferInfo> transferList = transferInfoService.list(new LambdaQueryWrapper<TransferInfo>()
                    .eq(TransferInfo::getProcInstId, procInstID)
                    .eq(TransferInfo::getTaskDefKey, inputModel.getWf_curActDefId()));

            taskIDMap = transferList.stream().collect(Collectors.toMap(TransferInfo::getTransferBy, TransferInfo::getTaskId));
        }
        content.setPre_auditors(setReceiverTaskInstID(userManagementOperation.batchListUsers(Arrays.asList(curAuditorID)), taskIDMap));
        return msg;
    }

    public MsgContent setRevocationAuditor(MsgContent content, String applyID, String actDefID) throws Exception {
        List<DocAuditHistoryModel> docAuditHistoryList =  docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(applyID, actDefID);
        Map<String, String> taskIDMap = docAuditHistoryList.stream().filter(obj -> obj.getAuditResult() ==null || obj.getAuditResult() !=null && !obj.getAuditResult().equals("receiver_transfer"))
            .collect(Collectors.toMap(DocAuditHistoryModel::getAuditor, docAuditHistory -> docAuditHistory.getId()));
        List<String> auditorIds = new ArrayList<>();
        for (DocAuditHistoryModel docAuditHistory : docAuditHistoryList) {
            if (docAuditHistory.getAuditResult() != null && !docAuditHistory.getAuditResult().equals("revocation")){
                continue;
            }
            auditorIds.add(docAuditHistory.getAuditor());
        }
        if (auditorIds.size() != 0) {
            content.setPre_auditors(setReceiverTaskInstID(userManagementOperation.batchListUsers(auditorIds), taskIDMap));
        }
        return content;
    }
}
