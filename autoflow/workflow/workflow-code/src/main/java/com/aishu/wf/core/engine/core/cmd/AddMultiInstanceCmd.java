package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.ExecutionEntityManager;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.task.Task;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 补发多实例命令类,暂时只支持补发单环节多人任务实例
 *
 * @author lw
 * @version 1.0
 * @modify Liuchu
 * @date 2021-3-29 11:18:13
 * @created 07-四月-2013 15:39:01
 */
public class AddMultiInstanceCmd implements Command<Void>, Serializable {

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
    protected String taskId;
    /**
     * 补发接收人列表
     */
    protected List<String> receivers;
    protected Map<String, Object> variables;

    public AddMultiInstanceCmd(String taskId, List<String> receivers,
                               Map<String, Object> variables) {
        this.taskId = taskId;
        this.receivers = receivers;
        this.variables = variables;
    }

    @Override
    public Void execute(CommandContext commandContext) {
        // 获取当前任务实例
        Task task = commandContext.getTaskEntityManager().findTaskById(taskId);
        String processInstanceId = task.getProcessInstanceId();
        // 获取发起多实例的任务实例
        ExecutionEntityManager executionEntityManager = commandContext.getExecutionEntityManager();
        List<ExecutionEntity> parentExecutions = executionEntityManager
                .findChildExecutionsByParentExecutionId(processInstanceId);
        List<ExecutionEntity> childExecutions = executionEntityManager
                .findChildExecutionsByParentExecutionId(parentExecutions.get(0).getId());
        ExecutionEntity executionEntityOfMany = childExecutions.get(0);
        try {
            // 根据补发接收列表创建多实例任务
            createInstances(task, executionEntityOfMany, commandContext, processInstanceId);
            Object assignList =  parentExecutions.get(0).getVariable(WorkFlowContants.ELEMENT_ASSIGNEE_LIST);
            if (assignList != null) {
                List<String> auditors = (List<String>) assignList;
                auditors.addAll(receivers);
                parentExecutions.get(0).setVariable(WorkFlowContants.ELEMENT_ASSIGNEE_LIST, auditors);
            }
        } catch (Exception e) {
        	throw new WorkFlowException(ExceptionErrorCode.A1000,"AddMultiInstanceCmd error",e);
        }
        return null;
    }

    /**
     * Handles the parallel case of spawning the instances. Will create child
     * executions accordingly for every instance needed.
     */
    protected void createInstances(Task task, ActivityExecution execution,
                                   CommandContext commandContext, String processInstanceId) {
        // 初始化已有的多实例循环变量
        initMultiVariable(commandContext, processInstanceId);

        // 创建执行实例
        List<ExecutionEntity> concurrentExecutions = new ArrayList<>();
        // 内嵌子流程结构		topExecution->多个内嵌子流节点Execution->每个执行路径的Execution
        for (String receiver : receivers) {
            // 创建与execution平级的内嵌子流节点Execution
            ExecutionEntity concurrentExecution = (ExecutionEntity) execution.createExecution();
            concurrentExecution.setBusinessKey(execution.getBusinessKey());
            concurrentExecution.setActive(true);
            concurrentExecution.setConcurrent(true);
            concurrentExecution.setScope(false);
            concurrentExecution.setParentId(execution.getParentId());
            if (BpmnXMLConstants.ELEMENT_SUBPROCESS.equals(concurrentExecution.getActivity().getProperty("type"))) {
                // 创建每个执行路径的Execution
                ExecutionEntity extraScopedExecution = concurrentExecution.createExecution();
                // concurrentExecution.setParentId(extraScopedExecution.getId());
                extraScopedExecution.setActive(true);
                extraScopedExecution.setConcurrent(false);
                extraScopedExecution.setScope(true);
                // extraScopedExecution.setParentId(execution.getParentId());
                concurrentExecution = extraScopedExecution;
            }
            concurrentExecutions.add(concurrentExecution);
        }
        // 执行活动
        for (int i = 0; i < receivers.size(); i++) {
            ExecutionEntity concurrentExecution = concurrentExecutions.get(i);
            // 递增循环变量
            concurrentExecution.setVariableLocal("assignee", receivers.get(i));
            concurrentExecution.setVariableLocal(LOOP_COUNTER, ++loopCounter);
            concurrentExecution.setVariable(NUMBER_OF_INSTANCES, ++nrOfInstances);
            concurrentExecution.setVariable(NUMBER_OF_ACTIVE_INSTANCES, ++nrOfActiveInstances);
            concurrentExecution.setSenderOrgId(task.getSenderOrgId());
            concurrentExecution.setSendUserName(task.getSendUserName());
            concurrentExecution.setSenderOrgName(task.getSenderOrgName());
            concurrentExecution.setSendUserId(task.getSendUserId());
            concurrentExecution.setSender(task.getSender());
            variables.put("wf_preTaskDefKey", task.getPreTaskDefKey());
            variables.put("wf_preTaskDefName", task.getPreTaskDefName());
            variables.put("wf_preTaskId", task.getPreTaskId());
            concurrentExecution.setVariablesLocal(variables);
            concurrentExecution.executeActivity(concurrentExecution.getActivity());
        }

        // See ACT-1586: ExecutionQuery returns wrong results when using multi
        // instance on a receive task
        // The parent execution must be set to false, so it wouldn't show up in
        // the execution query
        // when using .activityId(something). Do not we cannot nullify the
        // activityId (that would
        // have been a better solution), as it would break boundary event
        // behavior.
        if (!concurrentExecutions.isEmpty()) {
            //	ExecutionEntity executionEntity = (ExecutionEntity) execution;
            //executionEntity.setActive(false);
        }
    }

    public void initMultiVariable(CommandContext commandContext,
                                  String processInstanceId) {
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
