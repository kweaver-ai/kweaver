package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.impl.TaskQueryImpl;
import org.activiti.engine.impl.cmd.AddCommentCmd;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.task.Task;
import org.apache.commons.lang3.StringUtils;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 撤销多实例命令类,暂时只支持撤销单环节多人任务实例
 *
 * @author lw
 * @version 1.0
 * @created 07-四月-2013 15:39:01
 */
public class DeleteMultiInstanceCmd implements Command<Void>, Serializable {

    private static final long serialVersionUID = 1L;
    /**
     * 环节接收变量
     */
    protected final String ASSIGNEE = "assignee";
    /**
     * 实例数
     */
    protected final String NUMBER_OF_INSTANCES = "nrOfInstances";
    /**
     * 存活实例数
     */
    protected final String NUMBER_OF_ACTIVE_INSTANCES = "nrOfActiveInstances";
    /**
     * 已完成的实例数
     */
    protected final String NUMBER_OF_COMPLETED_INSTANCES = "nrOfCompletedInstances";
    /**
     * 当前循环实例下标
     */
    protected final String LOOP_COUNTER = "loopCounter";

    protected Integer nrOfInstances = 0;
    protected Integer nrOfActiveInstances = 0;
    protected Integer loopCounter = 0;
    /**
     * 当前任务实例ID
     */
    protected String processInstanceId;
    /**
     * 当前任务实例ID
     */
    protected String actInstId;
    /**
     * 当前任务实例ID
     */
    protected String actDefId;
    /**
     * 补发接收人列表
     */
    protected List<String> receivers;
    protected Map<String, Object> variables;
    protected final String reason;

    public DeleteMultiInstanceCmd(String processInstanceId, String actDefId, String actInstId, List<String> receivers,
                                  Map<String, Object> variables, String reason) {
        this.processInstanceId = processInstanceId;
        this.actDefId = actDefId;
        this.actInstId = actInstId;
        this.receivers = receivers;
        this.variables = variables;
        this.reason = reason;
    }

    @Override
    public Void execute(CommandContext commandContext) {
        if (StringUtils.isNotEmpty(actInstId)) {
            TaskEntity task = (TaskEntity) new TaskQueryImpl(commandContext).taskId(actInstId).singleResult();
            delete(task, commandContext);
            return null;
        }
        // 获取当前任务实例
        for (String receiver : receivers) {
            List<Task> tasks = new TaskQueryImpl(commandContext).processInstanceId(processInstanceId).taskAssignee(receiver).list();
            if (tasks == null || tasks.isEmpty()) {
                continue;
            }
            delete((TaskEntity) tasks.get(0), commandContext);
        }
        return null;
    }

    private void delete(TaskEntity task, CommandContext commandContext) {
        task.setActionType(WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY);
        String processInstanceId = task.getProcessInstanceId();
        // 获取发起多实例的任务实例
        ExecutionEntity executionEntityOfMany = commandContext.getExecutionEntityManager().findExecutionById(task.getExecutionId());
        try {
            task.setDescription(WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY + "_" + reason);
            commandContext.getHistoryManager().recordTaskUpdate(task);
            // 根据补发接收列表创建多实例任务
            deleteInstances(task, executionEntityOfMany, commandContext, processInstanceId);
        } catch (Exception e) {
        	throw new WorkFlowException(ExceptionErrorCode.A1000,"DeleteMultiInstanceCmd error",e);
        }
    }

    /**
     * Handles the parallel case of spawning the instances. Will create child
     * executions accordingly for every instance needed.
     */
    protected void deleteInstances(TaskEntity task, ExecutionEntity execution,
                                   CommandContext commandContext, String processInstanceId) throws Exception {
        initMultiVariable(commandContext, processInstanceId);
        if (this.nrOfActiveInstances == 0) {
            return;
        }
        // 更新已有的多实例循环变量
        updateMultiVariable(execution);
        execution.deleteCascade("");
        // commandContext.getTaskEntityManager().deleteTaskForce(task.getId(), "", true);
    }

    public void updateMultiVariable(ExecutionEntity execution) {
        execution.removeVariableLocal(ASSIGNEE);
        execution.removeVariableLocal(LOOP_COUNTER);
        execution.setVariable(NUMBER_OF_INSTANCES, --nrOfInstances);
        execution.setVariable(NUMBER_OF_ACTIVE_INSTANCES, --nrOfActiveInstances);
    }

    public void initMultiVariable(CommandContext commandContext, String processInstanceId) {
        // 更新多实例相关变量
        List<HistoricVariableInstance> list = commandContext.getProcessEngineConfiguration().getHistoryService().createHistoricVariableInstanceQuery().processInstanceId(processInstanceId).list();
        for (HistoricVariableInstance var : list) {
            if ("nrOfInstances".equals(var.getVariableName())) {
                this.nrOfInstances = (Integer) var.getValue();
            } else if ("nrOfActiveInstances".equals(var.getVariableName())) {
                this.nrOfActiveInstances = (Integer) var.getValue();
            } else if ("loopCounter".equals(var.getVariableName())) {
                Integer tempLoopCounter = (Integer) var.getValue();
                if (tempLoopCounter != null && tempLoopCounter > loopCounter) {
                    this.loopCounter = tempLoopCounter;
                }
            }
        }
    }
}
