package com.aishu.wf.core.engine.core.model;

import java.io.Serializable;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.runtime.ProcessInstance;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 流程实例对象
 *
 * @author lw
 * @version: 1.0
 */
@Data
@ApiModel(value = "流程实例对象")
public class ProcessInstanceModel implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "流程定义ID", example = "Process_QM57BLUS:6:67f28095-7d55-11eb-b88e-0242ac12000e")
    String procDefId;

    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程")
    String procDefName;

    @ApiModelProperty(value = "流程实例ID", example = "a9ffcaf-8645-11eb-93b1-00ff1169f9ce")
    String procInstId;

    @ApiModelProperty(value = "顶层流程实例父ID", example = "7e3ebcd-6606-11eb-819b-5654eb2299f3")
    String topProcInstId;

    @ApiModelProperty(value = "流程实例父ID", example = "d3cc8f02-7c92-11eb-9bd1-00ff1601c9e0")
    String parentProcInstId;

    @ApiModelProperty(value = "流程标题", example = "共享审核流程标题")
    String procTitle;

    @ApiModelProperty(value = "流程起草人Id", example = "admin")
    String startUserId;

    @ApiModelProperty(value = "流程起草人", example = "管理员")
    String startUserName;

    @ApiModelProperty(value = "流程起草组织", example = "3cc8f02-7c92-11eb-9bd1-00ff1601c9e0")
    String starterOrgId;

    @ApiModelProperty(value = "流程起草组织", example = "技术中心")
    String starterOrgName;

    @ApiModelProperty(value = "流程创建时间", example = "2021-03-04 10:39:08")
    Date createTime;

    @ApiModelProperty(value = "流程完成时间", example = "2021-03-16 14:28:51")
    Date finishTime;

    @ApiModelProperty(value = "流程开始环节ID", example = "87e3ebcd-6606-11eb-819b-5654eb2299f3")
    String startActivityId;

    @ApiModelProperty(value = "流程结束环节ID", example = "659cdb1-6533-11eb-9133-0242ac120009")
    String endActivityId;

    @ApiModelProperty(value = "业务主键", example = "1343ac8-7c05-11eb-88b5-00ff1601c9e0")
    String businessKey;

    @ApiModelProperty(value = "流程状态", example = "1")
    String procState;

    @ApiModelProperty(value = "是否包含子流", example = "false")
    boolean hasSubProcess;

    @ApiModelProperty(value = "流程定义")
    ProcessDefinitionModel processDefinition;

    @ApiModelProperty(value = "已办环节实例")
    ActivityInstanceModel currentActivity;

    @ApiModelProperty(value = "待办环节实例")
    List<ActivityInstanceModel> nextActivity;

    @ApiModelProperty(value = "流程输入对象")
    ProcessInputModel processInputModel;

    @ApiModelProperty(value = "租户Id", example = "workflow")
    String tenantId;

    @ApiModelProperty(value = "本次执行耗时", example = "111")
    String useTime;

    public static ProcessInstanceModel build(HistoricProcessInstance processInstance) {
        ProcessInstanceModel processInstanceModel = new ProcessInstanceModel();
        if (processInstance == null) {
            return processInstanceModel;
        }
        processInstanceModel.procTitle = processInstance.getName();
        processInstanceModel.businessKey = processInstance.getBusinessKey();
        processInstanceModel.procInstId = processInstance.getId();
        processInstanceModel.createTime = processInstance.getStartTime();
        processInstanceModel.finishTime = processInstance.getEndTime();
        processInstanceModel.startActivityId = processInstance.getStartActivityId();
        processInstanceModel.endActivityId = processInstance.getEndActivityId();
        processInstanceModel.startUserId = processInstance.getStartUserId();
        processInstanceModel.startUserName = processInstance.getStartUserName();
        processInstanceModel.parentProcInstId = processInstance.getSuperProcessInstanceId();
        processInstanceModel.topProcInstId = processInstance.getTopProcessInstanceId();
        processInstanceModel.procDefId = processInstance.getProcessDefinitionId();
        processInstanceModel.procDefName = processInstance.getProcessDefinitionName();
        processInstanceModel.starterOrgId = processInstance.getStarterOrgId();
        processInstanceModel.starterOrgName = processInstance.getStarterOrgName();
        processInstanceModel.procState = String.valueOf(processInstance.getProcState());
        processInstanceModel.tenantId = processInstance.getTenantId();
        return processInstanceModel;
    }

    public static ProcessInstanceModel build(ExecutionEntity processInstance) {
        ProcessInstanceModel processInstanceModel = new ProcessInstanceModel();
        if (processInstance == null) {
            return processInstanceModel;
        }
        processInstanceModel.procTitle = processInstance.getName();
        processInstanceModel.businessKey = processInstance.getBusinessKey();
        processInstanceModel.procInstId = processInstance.getId();
        processInstanceModel.createTime = new Date();
        processInstanceModel.startActivityId = processInstance.getCurrentActivityId();
        processInstanceModel.startUserId = processInstance.getSendUserId();
        processInstanceModel.startUserName = processInstance.getSendUserName();
        processInstanceModel.parentProcInstId = processInstance.getSuperExecution() != null ? processInstance.getSuperExecution().getProcessInstanceId() : processInstance.getParentId();
        processInstanceModel.topProcInstId = processInstance.getTopProcessInstanceId();
        processInstanceModel.procDefId = processInstance.getProcessDefinitionId();
        processInstanceModel.procDefName = processInstance.getProcessDefinitionName();
        processInstanceModel.starterOrgId = processInstance.getSenderOrgId();
        processInstanceModel.starterOrgName = processInstance.getSenderOrgName();
        processInstanceModel.procState = String.valueOf(processInstance.getSuspensionState());
        processInstanceModel.tenantId = processInstance.getTenantId();
        if (processInstanceModel.finishTime == null &&
                (SuspensionState.AUTO_REJECT.getStateCode() == processInstance.getSuspensionState() ||
                        SuspensionState.FINISH.getStateCode() == processInstance.getSuspensionState())) {
            processInstanceModel.finishTime = new Date();
        }
        return processInstanceModel;
    }

    public static ProcessInstanceModel build(ProcessInstance processInstance) {
        ProcessInstanceModel processInstanceModel = new ProcessInstanceModel();
        if (processInstance == null) {
            return processInstanceModel;
        }
        processInstanceModel.procTitle = processInstance.getName();
        processInstanceModel.businessKey = processInstance.getBusinessKey();
        processInstanceModel.procInstId = processInstance.getId();
        processInstanceModel.createTime = new Date();
        processInstanceModel.startActivityId = processInstance.getActivityId();
        /*
         * processInstanceModel.startUserId = processInstance.getSendUserId();
         * processInstanceModel.startUserName = processInstance.getSendUserName();
         */
        processInstanceModel.parentProcInstId = processInstance.getParentId();
        processInstanceModel.topProcInstId = processInstance.getTopProcessInstanceId();
        processInstanceModel.procDefId = processInstance.getProcessDefinitionId();
        processInstanceModel.procDefName = processInstance.getProcessDefinitionName();
        /*
         * processInstanceModel.starterOrgId = processInstance.getSenderOrgId();
         * processInstanceModel.starterOrgName = processInstance.getSenderOrgName();
         */
        processInstanceModel.tenantId = processInstance.getTenantId();
        return processInstanceModel;
    }


    @JsonIgnore
    public boolean isFinish() {
        return this.finishTime != null && this.procState.equals(String.valueOf(SuspensionState.FINISH.getStateCode()));
    }

    @JsonIgnore
    public boolean isCancel() {
        return this.finishTime != null && this.procState.equals(String.valueOf(SuspensionState.CANCELED.getStateCode()));
    }

    @JsonIgnore
    public boolean isAutoReject() {
        return this.finishTime != null && this.procState.equals(String.valueOf(SuspensionState.AUTO_REJECT.getStateCode()));
    }

    @JsonIgnore
    public boolean isRevocation() {
        ProcessInputModel processInputModel = this.getProcessInputModel();
        if (processInputModel != null) {
            Map<String, Object> fileds = processInputModel.getFields();
            Object isRevocation = fileds.get("isRevocation");
            return isRevocation == null ? false : (Boolean) isRevocation;
        }
        return false;
    }

    @JsonIgnore
    public boolean isSendBack() {
        ProcessInputModel processInputModel = this.getProcessInputModel();
        if (processInputModel != null) {
            Map<String, Object> fileds = processInputModel.getFields();
            Object auditResult = fileds.get("audit_result");

            return auditResult == null ? false : auditResult.equals(8);
        }
        return false;
    }
}
