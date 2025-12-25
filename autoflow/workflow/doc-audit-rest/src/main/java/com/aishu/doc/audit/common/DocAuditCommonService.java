package com.aishu.doc.audit.common;

import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.vo.ArbitrailyProcess;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * @description 文档审核-流程执行通用类
 * @author ouandyang
 */
@Slf4j
@Service
public  abstract class DocAuditCommonService{
  
    @Autowired
    ProcessDefinitionService processDefinitionService;

    @Autowired
    ProcessInstanceService processInstanceService;

    @Autowired
    AuditConfig auditConfig;
	  /**
     * @description 初始化提交流程参数
     * @author ouandyang
     * @param  docAuditApplyModel
     * @param  user 当前用户
     * @updateTime 2021/8/12
     */
    protected ProcessInputModel initProcessInputModel(DocAuditApplyModel docAuditApplyModel, User user) {
        ProcessInputModel model = new ProcessInputModel();
        // 获取流程定义信息
        this.buildProcDefData(model, docAuditApplyModel);
        // 组装流程提交所需参数
        model.setWf_procTitle(this.generateProcTitle(docAuditApplyModel, user.getUserName()));
        model.setWf_sendUserId(user.getUserId());
        model.setWf_sender(user.getUserId());
        model.setWf_starter(docAuditApplyModel.getApplyUserId());
        model.setWf_uniteworkUrl("--");
        model.setWf_businessKey(docAuditApplyModel.getDocId());
        // 组装自定义参数
        Map<String, Object> fields = Maps.newHashMap();
        if (docAuditApplyModel.getAuditIdea() != null) {
            fields.put("auditIdea", docAuditApplyModel.getAuditIdea().toString());
            if (!docAuditApplyModel.getAuditIdea() && docAuditApplyModel.getSendBack() != null
                    && docAuditApplyModel.getSendBack() && !docAuditApplyModel.getIsAudit()) {
                model.setWf_commentDisplayArea("退回");
            } else if (!docAuditApplyModel.getAuditIdea()) {
                model.setWf_commentDisplayArea("否决");
            } else {
                model.setWf_commentDisplayArea("同意");
            }
            // model.setWf_commentDisplayArea(docAuditApplyModel.getAuditIdea() ? "同意" : "否决");
            if (StrUtil.isEmpty(docAuditApplyModel.getAuditMsg())) {
                model.setWf_curComment(DocConstants.DEFAULT_COMMENT);
            } else {
                model.setWf_curComment(docAuditApplyModel.getAuditMsg());
            }
            model.setWf_curActInstId(docAuditApplyModel.getTaskId());
        }
        if(" ".equals(docAuditApplyModel.getAuditMsg()) ||StringUtils.isEmpty(docAuditApplyModel.getAuditMsg())){
            fields.put("auditMsg",null);
        }else{
            String msg =docAuditApplyModel.getAuditMsg();

            if(docAuditApplyModel.getAuditMsg().length() > 201){
                msg = msg.substring(0,200)+"...";
            }
            fields.put("auditMsg", msg);
        }
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());        
        ArbitrailyProcess process = JSONUtil.toBean(JSONUtil.parseObj(detail.get("process")), ArbitrailyProcess.class);
        fields.put("predefinedAuditorIds", process.getPredefined_auditor_ids());
        fields.put("docId", docAuditApplyModel.getDocId());
        fields.put("docName", docAuditApplyModel.getDocPath());
        fields.put("docShortName", docAuditApplyModel.getDocNames());
        fields.put("docNames", docAuditApplyModel.getDocNames());
        fields.put("docType", docAuditApplyModel.getDocType());
        fields.put("docCsfLevel", docAuditApplyModel.getCsfLevel());
        fields.put("applyId", docAuditApplyModel.getId());
        fields.put("applyUserName", docAuditApplyModel.getApplyUserName());
        fields.put("type", docAuditApplyModel.getApplyType());
        fields.put("bizType", docAuditApplyModel.getBizType());
        fields.put("conflictApplyId", docAuditApplyModel.getConflictApplyId());
        fields.put("opType", detail.get("opType"));
        fields.put("deadline", detail.get("expiresAt"));
        fields.put("flowName", detail.get("flowName"));
        fields.put("id", docAuditApplyModel.getId());
        fields.put("isArbitraily", null != JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") ? true : false);
        fields.put("frontPluginJsonStr", auditConfig.builderFrontPlugin(docAuditApplyModel.getApplyType()));
        fields.put("preProcInstId", docAuditApplyModel.getPreProcInstId());
        fields.put("sendBack", docAuditApplyModel.getSendBack());
        fields.put("applyUserId", docAuditApplyModel.getApplyUserId());
        JSONObject applyDetailJsonObj = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        if(applyDetailJsonObj.containsKey("workflow")){
            fields.put("workflow", JSONUtil.toJsonStr(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow")));
        }
        model.setFields(fields);
        // 待办扩展数据
        JSONObject addtion  = JSONUtil.createObj();
        addtion.set("docType", docAuditApplyModel.getDocType());
        addtion.set("docLibType", detail.get("docLibType"));
        addtion.set("applyUserName", docAuditApplyModel.getApplyUserName());
        addtion.set("applyTime", DateUtil.formatDateTime(docAuditApplyModel.getApplyTime()));
        addtion.set("applyDetail",docAuditApplyModel.getApplyDetail());
        addtion.set("applyUserId", docAuditApplyModel.getApplyUserId());
        model.getWf_variables().put("addtion", addtion.toString());
        this.buildPreProcInstID(model, docAuditApplyModel);
        return model;
    }
	
    /**
     * @description 生成流程标题
     * @author ouandyang
     * @param  docAuditApplyModel 文档审核申请实体
     * @param  userName 当前登录用户名称
     * @updateTime 2021/5/21
     */
    private String generateProcTitle(DocAuditApplyModel docAuditApplyModel, String userName) {
        String procTitle = userName + "_" + docAuditApplyModel.getApplyType() + "_";
        if (docAuditApplyModel.getApplyTime() == null) {
            procTitle += DateUtil.format(new Date(), DatePattern.PURE_DATETIME_PATTERN);
        } else {
            procTitle += DateUtil.format(docAuditApplyModel.getApplyTime(), DatePattern.PURE_DATETIME_PATTERN);
        }
        return procTitle;
    }
    
 

    /**
     * @description 构建流程定义数据
     * @author ouandyang
     * @param  model 流程输入参数
     * @param  docAuditApplyModel 文档审核申请数据
     * @updateTime 2021/5/21
     */
    private void buildProcDefData(ProcessInputModel model, DocAuditApplyModel docAuditApplyModel) {
        if (StrUtil.isNotBlank(docAuditApplyModel.getProcDefId())) {
            return ;
        }

        ProcessDefinitionModel processInfoConfig = processDefinitionService
                .getProcessDefBykey(docAuditApplyModel.getProcDefKey());
        if (processInfoConfig == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前无匹配的审核流程，本次操作无法生效，请联系管理员。");
        } else {
            docAuditApplyModel.setProcDefId(processInfoConfig.getProcDefId());
            docAuditApplyModel.setProcDefName(processInfoConfig.getProcDefName());
            model.setWf_procDefId(processInfoConfig.getProcDefId());
            model.setWf_procDefKey(docAuditApplyModel.getProcDefKey());
            model.setWf_procDefName(processInfoConfig.getProcDefName());
        }
    }

    /**
     * @description 构建流程退回数据
     * @author siyu.chen
     * @param  model 流程输入参数
     * @param  docAuditApplyModel 文档审核申请数据
     * @updateTime 2024/7/16
     */
    private void buildPreProcInstID(ProcessInputModel model, DocAuditApplyModel docAuditApplyModel) {
        if (docAuditApplyModel.getPreProcInstId() == null) {
            return;
        }
        try {
            ProcessInputModel inputModel = processInstanceService.getProcessInputVariableByFinished(docAuditApplyModel.getPreProcInstId());
            Map<String, Object> fileds = inputModel.getFields();
            List<String> preProcInstIds = fileds.get("preProcInstIds") == null? new ArrayList<>() : (List<String>) fileds.get("preProcInstIds");
            preProcInstIds.add(docAuditApplyModel.getPreProcInstId());
            model.getFields().put("preProcInstIds", preProcInstIds);
        } catch (Exception e) {
            log.warn("build pre procinst id err, detail: {}", e.getMessage());
        }
    }
    
    /**
     * @description 记录申请日志
     * @author ouandyang
     * @param  docAuditApplyModel
     * @updateTime 2021/5/27
     */
    @OperationLog(title = OperationLogConstants.DOC_AUDIT_ADD_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    protected void addApplyLog(DocAuditApplyModel docAuditApplyModel) {}

    /**
     * @description 记录审核日志
     * @author ouandyang
     * @param  docAuditApplyModel
     * @updateTime 2021/5/27
     */
    @OperationLog(title = OperationLogConstants.DOC_AUDIT_UPDATE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    protected void addAuditLog(DocAuditApplyModel docAuditApplyModel, String ip, String userId) {}

    /**
     * @description 记录审核完成日志
     * @author ouandyang
     * @param  history
     * @updateTime 2021/5/27
     */
    @OperationLog(title = OperationLogConstants.DOC_AUDIT_END_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    protected void addAuditedLog(DocAuditHistoryModel history, String ip, String userId) {}

    /**
     * @description 记录审核退回日志
     * @author siyu.chen
     * @param  history
     * @updateTime 2024/7/9
     */
    @OperationLog(title = OperationLogConstants.SENDBACK_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    protected void addSendBackLog(DocAuditHistoryModel history, String ip, String userId) {}

    /**
     * @description 记录审核重新发起日志
     * @author siyu.chen
     * @param  history
     * @updateTime 2024/7/9
     */
    @OperationLog(title = OperationLogConstants.RESUBMIT_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    protected void addReSubmitLog(DocAuditApplyModel docAuditApplyModel) {}

}
