package com.aishu.wf.core.engine.core.cmd;

import java.util.ArrayList;
import java.util.List;

import org.activiti.engine.impl.ProcessInstanceQueryImpl;
import org.activiti.engine.impl.cmd.AddCommentCmd;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.runtime.ProcessInstance;
import org.apache.commons.lang3.StringUtils;

import cn.hutool.core.collection.CollUtil;

/**
 * 流程结束命令类
 * 
 * @author lw
 */
public class EndProcessInstanceCmd implements Command<Void> {
	protected final ProcessInstance processInstance;
	protected final String userId;
	protected final String reason;
	protected final String displayArea;

	public EndProcessInstanceCmd(ProcessInstance processInstance, String userId, String reason, String displayArea) {
		this.processInstance = processInstance;
		this.userId = userId;
		this.reason = reason;
		this.displayArea = displayArea;
	}

	public Void execute(CommandContext commandContext) {
		// 获取当前待办
		List<TaskEntity> tasks = commandContext.getTaskEntityManager()
				.findTasksByProcessInstanceId(processInstance.getId());
		TaskEntity task = null;
		if (CollUtil.isNotEmpty(tasks)) {
			task = tasks.stream().filter(item -> 
				item.getAssignee().equals(userId)).findFirst().get();
		} else {
			task = new TaskEntity();
		}
		//保持作废意见
		if (StringUtils.isNotBlank(reason)) {
			new AddCommentCmd(task.getId(), processInstance.getId(), reason, displayArea).execute(commandContext);
		}
		List<ExecutionEntity> childExecutions = new ArrayList<ExecutionEntity>();
		String topExecutionId = "";
		if (StringUtils.isNotEmpty(processInstance.getSuperExecutionId())) {
			topExecutionId = processInstance.getTopProcessInstanceId();
			List<ExecutionEntity> executions = getAllExecutionEntity(topExecutionId, commandContext);
			childExecutions.addAll(executions);
		} else {
			childExecutions = commandContext.getExecutionEntityManager()
					.findChildExecutionsByProcessInstanceId(processInstance.getId());
			topExecutionId = processInstance.getProcessInstanceId();
		}
		for (ExecutionEntity childExecution : childExecutions) {
			childExecution.inactivate();
			childExecution.deleteCascade(null);
		}
		commandContext.getHistoryManager().recordProcessInstanceAutoEnd(processInstance.getId(), reason,
				task.getTaskDefinitionKey());
		
		// 当前待办审核员状态设为审核完成
		HistoricTaskInstanceEntity historicTaskInstance = commandContext
				.getDbSqlSession().selectById(HistoricTaskInstanceEntity.class, task.getId());
		if (historicTaskInstance != null) {
			historicTaskInstance.markEnded("completed");
		}
		return null;
	}


	/**
	 * 获取所有流程执行路径
	 * 
	 * @param topExecutionId
	 * @param commandContext
	 * @return
	 */
	public List<ExecutionEntity> getAllExecutionEntity(String topExecutionId, CommandContext commandContext) {
		ProcessInstanceQueryImpl query = new ProcessInstanceQueryImpl();
		query.processInstanceId(topExecutionId);
		List<ExecutionEntity> executions = commandContext.getExecutionEntityManager().findAllExecution(query);
		List<ExecutionEntity> executionEntitys = new ArrayList<ExecutionEntity>();
		for (ExecutionEntity execution : executions) {
			executionEntitys.add(execution);
		}
		return executionEntitys;
	}

}
