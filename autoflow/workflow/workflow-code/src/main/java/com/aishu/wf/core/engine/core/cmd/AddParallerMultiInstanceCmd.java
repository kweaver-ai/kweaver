package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.impl.NativeExecutionQueryImpl;
import org.activiti.engine.impl.ProcessInstanceQueryImpl;
import org.activiti.engine.impl.bpmn.behavior.InclusiveGatewayActivityBehavior;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.task.Task;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 补发多实例命令类,暂时只支持补发单环节多人任务实例
 *
 * @author lw
 * @version 1.0
 * @created 07-四月-2013 15:39:01
 */
public class AddParallerMultiInstanceCmd extends InclusiveGatewayActivityBehavior
		implements Command<Void>, Serializable {

	private static final long serialVersionUID = 1L;
	// Variable names for outer instance(as described in spec)
	// 环节接收变量
	protected final String ASSIGNEE = "assignee";
	// 实例数
	protected final String NUMBER_OF_INSTANCES = "nrOfInstances";
	// 存活实例数
	protected final String NUMBER_OF_ACTIVE_INSTANCES = "nrOfActiveInstances";
	// 已完成的实例数
	protected final String NUMBER_OF_COMPLETED_INSTANCES = "nrOfCompletedInstances";
	// 当前循环实例下标
	// Variable names for inner instances (as described in the spec)
	protected final String LOOP_COUNTER = "loopCounter";

	protected Integer nrOfInstances = 0;
	protected Integer nrOfActiveInstances = 0;
	protected Integer loopCounter = 0;
	// 当前任务实例ID
	protected String taskId;
	// 补发接收人列表
	protected List<String> receivers;
	protected Map<String, Object> variables;

	public AddParallerMultiInstanceCmd(String taskId, List<String> receivers, Map<String, Object> variables) {
		this.taskId = taskId;
		this.receivers = receivers;
		this.variables = variables;
	}

	public Void execute(CommandContext commandContext) {
		// 获取当前任务实例
		Task task = commandContext.getTaskEntityManager().findTaskById(taskId);
		String processInstanceId = task.getProcessInstanceId();
		String taskDefinitionKey = task.getTaskDefinitionKey();
		// 获取发起多实例的任务实例
		ExecutionEntity executionEntityOfMany = getParentExecution(processInstanceId,commandContext);
		try {
			// executionEntityOfMany.inactivate();
			// lockConcurrentRoot(executionEntityOfMany);
			PvmActivity activity = executionEntityOfMany.getActivity();
			if (!activeConcurrentExecutionsExist(executionEntityOfMany)) {
				// 根据补发接收列表创建多实例任务
				createInstances(executionEntityOfMany, commandContext, processInstanceId);
			}
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.A1000,"AddParallerMultiInstanceCmd error",e);
		}
		return null;
	}

	/**
	 * Handles the parallel case of spawning the instances. Will create child
	 * executions accordingly for every instance needed.
	 */
	protected void createInstances(ActivityExecution execution, CommandContext commandContext, String processIntsanceId)
			throws Exception {
		// 初始化已有的多实例循环变量
		initMultiVariable(commandContext, processIntsanceId);

		// 创建执行实例
		List<ActivityExecution> concurrentExecutions = new ArrayList<ActivityExecution>();
		for (String receiver : receivers) {
			ExecutionEntity concurrentExecution = (ExecutionEntity) execution.createExecution();
			concurrentExecution.setActive(true);
			concurrentExecution.setConcurrent(false);
			concurrentExecution.setScope(true);
			concurrentExecution.setParentId(execution.getProcessInstanceId());
			// if
			// (BpmnXMLConstants.ELEMENT_SUBPROCESS.equals(concurrentExecution.getActivity().getProperty("type")))
			// {
			ExecutionEntity extraScopedExecution = concurrentExecution.createExecution();
			extraScopedExecution.setActive(true);
			extraScopedExecution.setConcurrent(true);
			extraScopedExecution.setScope(false);
			concurrentExecution = extraScopedExecution;
			// }
			concurrentExecutions.add(concurrentExecution);
		}
		// 执行活动
		for (int i = 0; i < receivers.size(); i++) {
			ActivityExecution concurrentExecution = concurrentExecutions.get(i);
			if (concurrentExecution.isActive() && !concurrentExecution.isEnded()
			// && concurrentExecution.getParent().isActive()
					&& !concurrentExecution.getParent().isEnded()) {
				// 递增循环变量
				concurrentExecution.setVariableLocal("assignee", receivers.get(i));
				concurrentExecution.setVariableLocal(LOOP_COUNTER, ++loopCounter);
				concurrentExecution.setVariable(NUMBER_OF_INSTANCES, ++nrOfInstances);
				concurrentExecution.setVariable(NUMBER_OF_ACTIVE_INSTANCES, ++nrOfActiveInstances);
				concurrentExecution.setVariablesLocal(variables);
				concurrentExecution.executeActivity(concurrentExecution.getActivity());
			}
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
			ExecutionEntity executionEntity = (ExecutionEntity) execution;
			// executionEntity.setActive(false);
		}
	}

	public void initMultiVariable(CommandContext commandContext, String processInstanceId) {
		/*
		 * 更新多实例相关变量
		 */
		List<HistoricVariableInstance> list = commandContext.getProcessEngineConfiguration().getHistoryService()
				.createHistoricVariableInstanceQuery().processInstanceId(processInstanceId).list();
		for (HistoricVariableInstance var : list) {
			if (var.getVariableName().equals("nrOfInstances")) {
				this.nrOfInstances = (Integer) var.getValue();
			} else if (var.getVariableName().equals("nrOfActiveInstances")) {
				this.nrOfActiveInstances = (Integer) var.getValue();
			} else if (var.getVariableName().equals("loopCounter")) {
				Integer tempLoopCounter = (Integer) var.getValue();
				if (tempLoopCounter > loopCounter) {
					this.loopCounter = tempLoopCounter;
				}
			}
		}
	}
	
	/**
	 * 获取流程执行父路径
	 * 
	 * @param topExecutionId
	 * @param commandContext
	 * @return
	 */
	public ExecutionEntity getParentExecution(String executionId,CommandContext commandContext) {
		ProcessInstanceQueryImpl query = new ProcessInstanceQueryImpl();
		query.processInstanceId(executionId);
		return commandContext.getExecutionEntityManager().getParentExecution(query);
	}
}
