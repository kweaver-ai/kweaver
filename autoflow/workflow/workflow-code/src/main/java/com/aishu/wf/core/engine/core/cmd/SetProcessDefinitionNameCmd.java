package com.aishu.wf.core.engine.core.cmd;

import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.ActivitiObjectNotFoundException;
import org.activiti.engine.delegate.event.ActivitiEventType;
import org.activiti.engine.delegate.event.impl.ActivitiEventBuilder;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.repository.ProcessDefinition;

/**
 * 变更流程名称
 * @author lw
 */
public class SetProcessDefinitionNameCmd implements Command<Void> {

	protected String processDefinitionId;
	protected String name;

	public SetProcessDefinitionNameCmd(String processDefinitionId, String name) {
		this.processDefinitionId = processDefinitionId;
		this.name = name;
	}

	public Void execute(CommandContext commandContext) {

		if (processDefinitionId == null) {
			throw new ActivitiIllegalArgumentException(
					"Process definition id is null");
		}

		ProcessDefinitionEntity processDefinition = commandContext
				.getProcessDefinitionEntityManager().findProcessDefinitionById(
						processDefinitionId);

		if (processDefinition == null) {
			throw new ActivitiObjectNotFoundException(
					"No process definition found for id = '"
							+ processDefinitionId + "'",
					ProcessDefinition.class);
		}
		
		// Update name
		processDefinition.setName(name);
		
		/*
		 * // Remove process definition from cache, it will be refetched later
		 * DeploymentCache<ProcessDefinitionEntity> processDefinitionCache =
		 * commandContext
		 * .getProcessEngineConfiguration().getProcessDefinitionCache(); if
		 * (processDefinitionCache != null) {
		 * processDefinitionCache.remove(processDefinitionId); }
		 */
		commandContext.getDbSqlSession().update(processDefinition);

		if (commandContext.getEventDispatcher().isEnabled()) {
			commandContext.getEventDispatcher().dispatchEvent(
					ActivitiEventBuilder
							.createEntityEvent(
									ActivitiEventType.ENTITY_UPDATED,
									processDefinition));
		}

		return null;
	}

	public String getProcessDefinitionId() {
		return processDefinitionId;
	}

	public void setProcessDefinitionId(String processDefinitionId) {
		this.processDefinitionId = processDefinitionId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

}
