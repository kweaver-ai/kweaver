package com.aishu.wf.core.engine.core.model;

import java.io.Serializable;
import java.util.Date;

import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.TaskEntity;

import lombok.Data;

/**
 * 环节实例对象
 *
 * @author lw
 */
@Data
public class ActivityInstanceModel implements Serializable {

    static final long serialVersionUID = 1L;
    /**
     * 流程定义ID
     */
    String procDefId;
    /**
     * 流程定义名称
     */
    String procDefName;
    /**
     * 父流程实例ID
     */
    String parentProcInstId;
    /**
     * 流程实例ID
     */
    String procInstId;
    /**
     * 流程名称
     */
    String procTitle;
    /**
     * 执行ID
     */
    String executionId;
    /**
     * 环节定义ID
     */
    String actDefName;
    /**
     * 环节类型
     */
    String actDefType;

    /**
     * 环节定义名称
     */
    String actDefId;
    /**
     * 环节实例ID-任务节点对应任务ID
     */
    String actInstId;
    /**
     * 父环节实例ID
     */
    String parentActInstId;
    /**
     * 上一步环节实例ID
     */
    String prevActInstId;
    /**
     * 上一步环节定义ID
     */
    String prevActDefId;
    /**
     * 上一步环节定义名称
     */
    String prevActDefName;
    /**
     * 当前环节发送人帐号
     */
    String sender;
    /**
     * 发送人ID
     */
    String sendUserId;
    /**
     * 当前环节发送人姓名
     */
    String sendUserName;

    /**
     * 当前环节发送人组织机构ID
     */
    String senderOrgId;

    /**
     * 当前环节发送人组织机构名称
     */
    String senderOrgName;
    /**
     * 当前环节的接收人，待办任务可能没有数据
     */
    String receiver;
    /**
     * 环节所有者
     */
    String owner;
    /**
     * 状态
     */
    String actState;
    /**
     * 创建时间
     */
    Date createTime;
    /**
     * 完成时间
     */
    Date finishTime;
    /**
     * 持续时间-耗时
     */
    Date dueDate;
    /**
     * 租户ID--待定
     */
    String tenantId;

    /**
     * 接收人信息，receiver为接收人帐号
     */
    String receiverUserId;
    String receiverUserName;
    String receiverOrgId;
    String receiverOrgName;

    ActivityDefinitionModel activityDefinition;

    /**
     * 构建历史环节
     *
     * @param task
     * @return
     */
    public static ActivityInstanceModel buildHisTask(HistoricTaskInstance task) {
        ActivityInstanceModel activityInstance = new ActivityInstanceModel();
        if (task == null)
            return activityInstance;
        activityInstance.procDefId = task.getProcessDefinitionId();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.procTitle = task.getProcTitle();
        activityInstance.procInstId = task.getProcessInstanceId();
        activityInstance.actInstId = task.getId();
        activityInstance.owner = task.getOwner();
        activityInstance.receiver = task.getAssignee();
        activityInstance.receiverUserId = task.getAssignee();
        activityInstance.receiverOrgId = task.getAssigneeOrgId();
        activityInstance.receiverOrgName = task.getAssigneeOrgName();
        activityInstance.receiverUserName = task.getAssigneeUserName();
        activityInstance.sender = task.getSender();
        activityInstance.sendUserName = task.getSendUserName();
        activityInstance.senderOrgId = task.getSenderOrgId();
        activityInstance.senderOrgName = task.getSenderOrgName();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.createTime = task.getStartTime();
        activityInstance.finishTime = task.getEndTime();
        activityInstance.executionId = task.getExecutionId();
        activityInstance.prevActInstId = task.getPreTaskId();
        activityInstance.prevActDefId = task.getPreTaskDefKey();
        activityInstance.prevActDefName = task.getPreTaskDefName();
        activityInstance.actState = "1";
        activityInstance.dueDate = task.getDueDate();
        activityInstance.tenantId = task.getTenantId();
        activityInstance.actDefId = task.getTaskDefinitionKey();
        activityInstance.actDefName = task.getName();
        return activityInstance;
    }


    public static ActivityInstanceModel buildHisTask(TaskEntity task) {
        ActivityInstanceModel activityInstance = new ActivityInstanceModel();
        if (task == null)
            return activityInstance;
        activityInstance.procDefId = task.getProcessDefinitionId();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.procTitle = task.getProcTitle();
        activityInstance.procInstId = task.getProcessInstanceId();
        activityInstance.actInstId = task.getId();
        activityInstance.owner = task.getOwner();
        activityInstance.receiver = task.getAssignee();
        activityInstance.receiverUserId = task.getAssigneeUserId();
        activityInstance.receiverOrgId = task.getAssigneeOrgId();
        activityInstance.receiverOrgName = task.getAssigneeOrgName();
        activityInstance.receiverUserName = task.getAssigneeUserName();
        activityInstance.sender = task.getSender();
        activityInstance.sendUserName = task.getSendUserName();
        activityInstance.sendUserId = task.getSendUserId();
        activityInstance.senderOrgId = task.getSenderOrgId();
        activityInstance.senderOrgName = task.getSenderOrgName();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.createTime = task.getCreateTime();
        activityInstance.finishTime = Context.getProcessEngineConfiguration().getClock().getCurrentTime();
        activityInstance.executionId = task.getExecutionId();
        activityInstance.prevActInstId = task.getPreTaskId();
        activityInstance.prevActDefId = task.getPreTaskDefKey();
        activityInstance.prevActDefName = task.getPreTaskDefName();
        activityInstance.actState = "1";
        activityInstance.dueDate = task.getDueDate();
        activityInstance.tenantId = task.getTenantId();
        activityInstance.actDefId = task.getTaskDefinitionKey();
        activityInstance.actDefName = task.getName();
        return activityInstance;
    }

    /**
     * 构建待办环节
     *
     * @param task
     * @return
     */
    public static ActivityInstanceModel buildTask(TaskEntity task) {
        ActivityInstanceModel activityInstance = new ActivityInstanceModel();
        if (task == null) {
            return activityInstance;
        }
        activityInstance.procDefId = task.getProcessDefinitionId();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.procTitle = task.getProcTitle();
        activityInstance.procInstId = task.getProcessInstanceId();
        activityInstance.actInstId = task.getId();
        activityInstance.owner = task.getOwner();
        activityInstance.receiver = task.getAssignee();
        activityInstance.receiverUserId = task.getAssigneeUserId();
        activityInstance.receiverOrgId = task.getAssigneeOrgId();
        activityInstance.receiverOrgName = task.getAssigneeOrgName();
        activityInstance.receiverUserName = task.getAssigneeUserName();
        activityInstance.sender = task.getSender();
        activityInstance.sendUserId = task.getSendUserId();
        activityInstance.sendUserName = task.getSendUserName();
        activityInstance.senderOrgId = task.getSenderOrgId();
        activityInstance.senderOrgName = task.getSenderOrgName();
        activityInstance.procDefName = task.getProcessDefinitionName();
        activityInstance.createTime = task.getCreateTime();
        activityInstance.executionId = task.getExecutionId();
        activityInstance.prevActInstId = task.getPreTaskId();
        activityInstance.prevActDefId = task.getPreTaskDefKey();
        activityInstance.prevActDefName = task.getPreTaskDefName();
        activityInstance.actState = "0";
        activityInstance.tenantId = task.getTenantId();
        activityInstance.dueDate = task.getDueDate();
        activityInstance.actDefId = task.getTaskDefinitionKey();
        activityInstance.actDefName = task.getName();
        try {
            activityInstance.actDefType = (String) task.getExecution().getActivity().getProperty("dealType");
        } catch (Exception ignore) {
        }
        return activityInstance;
    }
}
