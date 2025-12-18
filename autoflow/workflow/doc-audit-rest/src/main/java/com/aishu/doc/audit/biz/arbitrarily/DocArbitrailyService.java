package com.aishu.doc.audit.biz.arbitrarily;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.common.DocAuditAfterService;
import com.aishu.doc.audit.common.DocAuditBizService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditDetailService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.ProcessLogModel;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.HistoryService;
import org.activiti.engine.history.HistoricTaskInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @description 任意审核流程执行类
 * @author hanj
 */
@Slf4j
@Service(value = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX)
public class DocArbitrailyService  implements DocAuditBizService {
    @Autowired
    NsqSenderService nsqSenderService;
    @Autowired
    DocAuditAfterService docAuditAfterService;
    @Autowired
    DocAuditDetailService docAuditDetailService;
    @Autowired
    HistoryService historyService;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;

    @Override
    public void submitProcessBefore(ProcessInputModel processInputModel, DocAuditApplyModel docAuditApplyModel) {
        Map<String, Object> fields = processInputModel.getFields();
        JSONObject dataObj = JSONUtil.parseObj(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("data"));
        fields.put("data", dataObj);
        // 兼容共享审核接入任意审核后的消息channel
        fields.put("opType", dataObj.get("operation"));
        fields.put("isArbitraily", true);
    }

    @Override
    public void submitProcessAfter(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {

    }

    @Override
    public void sendAuditNotify(String bizId, String auditResult, String auditType, String applyType) {
        List<String> assigneeList = getAuditedFinallyAssignee(bizId);
        nsqSenderService.sendAuditNotify(NsqConstants.WORKFLOW_AUDIT_RESULT + "." + auditType, bizId, auditResult, assigneeList);
        if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(auditType)) {
			nsqSenderService.sendAuditNotify(NsqConstants.WORKFLOW_AUDIT_RESULT + "." + applyType, bizId, auditResult, assigneeList);
		}
    }

    @Override
    public void submitErrorHandle(DocAuditApplyModel docAuditApplyModel, ProcessInputModel model, ProcessInstanceModel processInstanceModel, WorkFlowException we) {
        // 因为文档共享有特殊需求，所以当流程类型为共享时走以前共享的逻辑
        if(DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(docAuditApplyModel.getBizType()) || DocConstants.BIZ_TYPE_ANONYMITY_SHARE.equals(docAuditApplyModel.getBizType())){
            DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
                    DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX + docAuditApplyModel.getBizType(), DocAuditBizService.class);
            docAuditBizService.submitErrorHandle(docAuditApplyModel, model, processInstanceModel, we);
        }else{
            if (we.getExceptionErrorCode().isNotAuditorErr()) {
                if (StrUtil.isEmpty(model.getWf_curActInstId())) {
                    docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.REJECT.getValue(),
                            WorkflowConstants.AUDIT_RESULT_REJECT, false);
                }
            }
        }
    }

    /**
     * @description 获取审核最后完成的审核员ID集合
     * @param bizId bizId
     */
    private List<String> getAuditedFinallyAssignee(String bizId){
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByBizId(bizId);
        List<HistoricTaskInstance> historicTaskInstances = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(docAuditHistoryModel.getProcInstId()).orderByTaskCreateTime().desc().list();
        historicTaskInstances = historicTaskInstances.stream().filter(ht -> !ht.getTaskDefinitionKey().equals("EndEvent_1wqgipp")).collect(Collectors.toList());

        List<String> resultList = new ArrayList<>();
        if(historicTaskInstances.size() == 0){
            return resultList;
        }
        String taskDefinitionKey = historicTaskInstances.get(0).getTaskDefinitionKey();
        String auditModel = historicTaskInstances.get(0).getFormKey();
        boolean isMultilevel = "multilevel".equals(historicTaskInstances.get(0).getDescription()) ? true : false;
        if(isMultilevel){
            // 连续多级去最后一级处理完成的审核员
            List<HistoricTaskInstance> historicTaskInstanceList = historicTaskInstances.stream().filter(e -> e.getTaskDefinitionKey()
                    .equals(taskDefinitionKey) && "completed".equals(e.getDeleteReason())).collect(Collectors.toList());
            List<ProcessLogModel> processDetailLogs = Lists.newArrayList();
            for(HistoricTaskInstance historicTask : historicTaskInstanceList){
                ProcessLogModel processDetailLog = new ProcessLogModel();
                processDetailLog.setReceiveUserId(historicTask.getAssignee());
                processDetailLog.setStartTime(historicTask.getStartTime());
                processDetailLog.setPreTaskId(StrUtil.isNotEmpty(historicTask.getPreTaskId()) ? historicTask.getPreTaskId() : "empty");
                processDetailLogs.add(processDetailLog);
            }
            Map<String, List<ProcessLogModel>> multilevelLogMap = processDetailLogs.stream()
                    .sorted(Comparator.comparing(ProcessLogModel::getStartTime).reversed())
                    .collect(Collectors.groupingBy(ProcessLogModel::getPreTaskId, LinkedHashMap::new, Collectors.toList()));
            for (String key : multilevelLogMap.keySet()) {
                List<ProcessLogModel> multilevelLogTemps = multilevelLogMap.get(key);
                List<String> assigneeList = multilevelLogTemps.stream()
                        .sorted(Comparator.comparing(ProcessLogModel::getStartTime))
                        .map(ProcessLogModel::getReceiveUserId).collect(Collectors.toList());
                resultList.addAll(assigneeList);
                break;
            }
        } else {
            List<String> assigneeList = historicTaskInstances.stream().filter(e -> e.getTaskDefinitionKey().equals(taskDefinitionKey) &&
                    "completed".equals(e.getDeleteReason())).sorted(Comparator.comparing(HistoricTaskInstance::getCreateTime).reversed())
                    .map(HistoricTaskInstance::getAssignee).collect(Collectors.toList());
            if(WorkflowConstants.AUDIT_MODEL.HQSH.getValue().equals(auditModel)){
                resultList.addAll(assigneeList);
            } else if(assigneeList.size() > 0){
                resultList.add(assigneeList.get(0));
            }
        }
        return resultList;
    }
}
