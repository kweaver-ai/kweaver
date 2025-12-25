package com.aishu.wf.core.engine.util;

import java.util.List;
import java.util.Map;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.identity.UserService;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.HistoricTaskInstanceQueryImpl;
import org.activiti.engine.impl.bpmn.behavior.ParallelMultiInstanceBehavior;
import org.activiti.engine.impl.bpmn.behavior.UserTaskActivityBehavior;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.history.handler.ActivityInstanceEndHandler;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.HistoricActivityInstanceEntity;
import org.activiti.engine.impl.persistence.entity.HistoricProcessInstanceEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.persistence.entity.VariableInstanceEntity;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import org.springframework.beans.factory.annotation.Autowired;

public class WfEngineUtils {
	private static Logger log = LoggerFactory
			.getLogger(ActivityInstanceEndHandler.class);



	public static ProcessInputModel getWfprocessInputModel(
			Map<String, Object> variables) {
		ProcessInputModel processInputModel = null;
		if (variables != null) {
			processInputModel = (ProcessInputModel) variables
					.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
		}
		if (processInputModel == null) {
			processInputModel = new ProcessInputModel();
		}
		return processInputModel;
	}

	public static void setWfprocessInputModel(ExecutionEntity execution,
			TaskEntity task) {
		if (execution
				.getVariable(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY) == null) {
			ProcessInputModel processInputModel = new ProcessInputModel();
			processInputModel
					.setWf_procDefName(task.getProcessDefinitionName());
			processInputModel.setWf_procTitle(task.getProcTitle());
			processInputModel.setWf_sender(task.getAssignee());
			processInputModel.setWf_sendUserName(task.getSendUserName());
			processInputModel.setWf_sendUserOrgName(task.getSenderOrgName());
			processInputModel.setWf_sendUserOrgId(task.getSenderOrgId());
			processInputModel.setWf_sendUserName(task.getSendUserName());
			processInputModel.setWf_actionType(task.getActionType());
			execution.setVariable(
					WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY,
					processInputModel);
		}
	}

	// DefaultHistoryManager.recordActivityStart
	public static void buildExtActivityInstance(
			HistoricActivityInstanceEntity historicActivityInstance,
			ExecutionEntity executionEntity) {
		buildExtSubActivityInstance(historicActivityInstance, executionEntity);
		// 2014-1-28 by lw
		if (historicActivityInstance.getProcessDefinitionName() == null) {
			String processDefinitionName = executionEntity.getProcessDefinition().getName();
			if (processDefinitionName == null) {
				processDefinitionName = WfEngineUtils.getWfprocessInputModel(
						executionEntity.getVariables()).getWf_procDefName();
			}
			historicActivityInstance
					.setProcessDefinitionName(processDefinitionName);
		}
	}

	// DefaultHistoryManager.recordActivityStart
	public static void buildExtSubActivityInstance(
			HistoricActivityInstanceEntity historicActivityInstance,
			ExecutionEntity executionEntity) {
		ProcessInputModel processInputModel=WfEngineUtils.getWfprocessInputModel(executionEntity.getVariables());
		// 2014-1-28 by lw
		if (historicActivityInstance.getSender() == null) {
			String sender = executionEntity.getSender();
			if (sender == null) {
				sender =processInputModel.getWf_sender();
			}
			historicActivityInstance.setSender(sender);
		}
		if (historicActivityInstance.getSendUserName() == null) {
			String sendUserName = executionEntity.getSendUserName();
			if (sendUserName == null) {
				sendUserName =processInputModel.getWf_sendUserName();
			}
			historicActivityInstance.setSendUserName(sendUserName);
		}
		if (historicActivityInstance.getSenderOrgName() == null) {
			String senderOrgName = executionEntity.getSenderOrgName();
			if (senderOrgName == null) {
				senderOrgName = processInputModel.getWf_sendUserOrgName();
				executionEntity.setSenderOrgName(senderOrgName);
			}
			historicActivityInstance.setSenderOrgName(senderOrgName);
		}
		if (historicActivityInstance.getSenderOrgId() == null) {
			String senderOrgId = executionEntity.getSenderOrgId();
			if (senderOrgId == null) {
				senderOrgId = processInputModel.getWf_sendUserOrgId();
				executionEntity.setSenderOrgId(senderOrgId);
			}
			historicActivityInstance.setSenderOrgId(senderOrgId);
		}
		if (historicActivityInstance.getProcTitle() == null) {
			String procTitle = executionEntity.getName();
			if (procTitle == null) {
				procTitle = processInputModel.getWf_procTitle();
			}
			historicActivityInstance.setProcTitle(procTitle);
		}
		if (executionEntity != null && executionEntity.getVariables() != null) {
			Map<String, Object> tempVariablesLocal = executionEntity
					.getVariables();
			String preTaskDefKey = (String) tempVariablesLocal
					.get(WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY);
			String preTaskId = (String) tempVariablesLocal
					.get(WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY);
			if (preTaskDefKey == null || "".equals(preTaskDefKey)) {
				ExecutionEntity topExecution = executionEntity.getParent();
				if (topExecution != null) {
					while (executionEntity.getProcessInstance().equals(
									topExecution.getProcessInstance())) {
						if (topExecution.getParent() == null)
							break;
						topExecution = topExecution.getParent();
					}
					tempVariablesLocal = topExecution.getVariablesLocal();
				}
			}
			//这段逻辑影响了包容网关按规则执行,暂时屏蔽
			/*if(preTaskId!=null&&preTaskId.equals(executionEntity.getId())) {//by lw 包容网关pretaskid与executionEntity id一致
				historicActivityInstance.setPreActId(processInputModel.getWf_curActDefId());
				historicActivityInstance
						.setPreActInstId(processInputModel.getWf_curActInstId());
				historicActivityInstance.setPreActName(processInputModel.getWf_curActDefName());
			}else {*/
				historicActivityInstance.setPreActId((String) tempVariablesLocal
						.get(WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY));
				historicActivityInstance
						.setPreActInstId((String) tempVariablesLocal
								.get(WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY));
				historicActivityInstance.setPreActName((String) tempVariablesLocal
						.get(WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY));
			//}
		}
	}

	// ExecutionEntity.createExecution
	public static void buildExtExecution(Map<String, Object> variables,
			ExecutionEntity createdExecution) {
		ProcessInputModel processInputModel=WfEngineUtils.getWfprocessInputModel(variables);
		if (createdExecution.getName() == null) {
			createdExecution.setName(processInputModel.getWf_procTitle());
		}
		if (createdExecution.getProcessDefinitionName() == null) {
			if(createdExecution.getProcessDefinition().getProcessDefinition().getName()!=null){
				createdExecution.setProcessDefinitionName(createdExecution.getProcessDefinition().getProcessDefinition().getName());
			}else{
			createdExecution.setProcessDefinitionName(processInputModel.getWf_procDefName());
			}
		}
		if (createdExecution.getSender() == null) {
			createdExecution.setSender(processInputModel.getWf_sender());
		}
		if (createdExecution.getSendUserId() == null) {
			createdExecution.setSendUserId(processInputModel.getWf_sendUserId());
		}
		if (createdExecution.getSendUserName() == null) {
			createdExecution.setSendUserName(processInputModel.getWf_sendUserName());
		}
		if (createdExecution.getSenderOrgName() == null) {
			createdExecution.setSenderOrgName(processInputModel.getWf_sendUserOrgName());
		}
		if (createdExecution.getSenderOrgId() == null) {
			createdExecution.setSenderOrgId(processInputModel.getWf_sendUserOrgId());
		}
		String topId = createdExecution
				.getTopProcessInstanceId(createdExecution);
		if (topId == null) {
			topId = createdExecution.getProcessInstanceId();
		}
		createdExecution.setTopProcessInstanceId(topId);
	}

	// TaskEntity.createAndInsert,DefaultHistoryManager.recordTaskCreated
	public static void buildExtTaskEntity(TaskEntity task,
			ExecutionEntity execution) {
		ProcessInputModel processInputModel=WfEngineUtils.getWfprocessInputModel(
				execution.getVariables());
		if (task.getProcTitle() == null) {
			String procTitle = execution.getName();
			if (procTitle == null) {
				procTitle = processInputModel.getWf_procTitle();
				execution.setName(procTitle);
			}
			task.setProcTitle(procTitle);
		}
		if (task.getSender() == null) {
			String sender = execution.getSender();
			if (sender == null) {
				sender = processInputModel.getWf_sender();
				execution.setSender(sender);
			}
			task.setSender(sender);
		}
		if (task.getSendUserId() == null) {
			String sendUserId = execution.getSendUserId();
			if (sendUserId == null) {
				sendUserId = processInputModel.getWf_sendUserId();
				execution.setSendUserId(sendUserId);
			}
			task.setSendUserId(sendUserId);
		}
		/*
		 * if (task.getSendUserName() == null) { String sendUserName =
		 * execution.getSendUserName(); if (sendUserName == null) { sendUserName =
		 * processInputModel.getWf_sendUserName();
		 * execution.setSendUserName(sendUserName); }
		 * task.setSendUserName(sendUserName); } if (task.getSenderOrgName() == null) {
		 * String senderOrgName = execution.getSenderOrgName(); if (senderOrgName ==
		 * null) { senderOrgName =processInputModel.getWf_sendUserOrgName();
		 * execution.setSenderOrgName(senderOrgName); }
		 * task.setSenderOrgName(senderOrgName); }
		 */
		if (task.getSenderOrgId() == null) {
			String senderOrgId = execution.getSenderOrgId();
			if (senderOrgId == null) {
				senderOrgId = processInputModel.getWf_sendUserOrgId();
				execution.setSenderOrgId(senderOrgId);
			}
			task.setSenderOrgId(senderOrgId);
		}
		if (task.getProcessDefinitionName() == null) {
			String processDefinitionName = execution.getProcessDefinition().getName();
			if (processDefinitionName == null) {
				processDefinitionName = processInputModel.getWf_procDefName();
				execution.setProcessDefinitionName(processDefinitionName);
			}
			task.setProcessDefinitionName(processDefinitionName);
		}
		if (execution != null && execution.getVariablesLocal() != null) {
			Map<String, Object> tempVariablesLocal = execution
					.getVariables();
			String preTaskDefKey = (String) tempVariablesLocal
					.get(WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY);
			String preTaskId = (String) tempVariablesLocal
					.get(WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY);
			if (preTaskDefKey == null || "".equals(preTaskDefKey)) {
				ExecutionEntity topExecution = execution.getParent();
				if (topExecution != null) {
					while (execution.getProcessInstance().equals(
									topExecution.getProcessInstance())) {
						if (topExecution.getParent() == null)
							break;
						topExecution = topExecution.getParent();
					}
					tempVariablesLocal = topExecution.getVariablesLocal();
				}
			}
			//这段逻辑影响了包容网关按规则执行,暂时屏蔽
			/*if(preTaskId!=null&&preTaskId.equals(execution.getId())) {//by lw 包容网关pretaskid与executionEntity id一致
				task.setPreTaskDefKey(processInputModel.getWf_curActDefId());
				task.setPreTaskId(processInputModel.getWf_curActInstId());
				task.setPreTaskDefName(processInputModel.getWf_curActDefName());
			}*/
			if (task.getPreTaskDefKey() == null) {
				task.setPreTaskDefKey((String) tempVariablesLocal
						.get(WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY));
				task.setPreTaskId((String) tempVariablesLocal
						.get(WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY));
				task.setPreTaskDefName((String) tempVariablesLocal
						.get(WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY));
			}
			task.setActionType(WfEngineUtils.getWfprocessInputModel(
					tempVariablesLocal).getWf_actionType());
		}
		if(StringUtils.isEmpty(task.getTenantId())){
			task.setTenantId(execution.getTenantId());
		}
		if(StringUtils.isEmpty(task.getTaskDefinitionKey())){
			task.setTaskDefinitionKeyWithoutCascade(processInputModel.getWf_nextActDefId());
		}
		if(StringUtils.isEmpty(task.getName())){
			task.setNameWithoutCascade(processInputModel.getWf_nextActDefName());
		}
		if(StringUtils.isEmpty(task.getFormKey())){
			task.setFormKey(processInputModel.getWf_nextActDefType());
		}
		if(processInputModel.getFields()!=null) {
			if(processInputModel.getFields().get("applyId")!=null) {
				task.setBizId((String) processInputModel.getFields().get("applyId"));
			}
			if(processInputModel.getFields().get("docId")!=null) {
				task.setDocId((String) processInputModel.getFields().get("docId"));
			}
			if(processInputModel.getFields().get("docShortName")!=null) {
				task.setDocName((String) processInputModel.getFields().get("docShortName"));
			}
			if(processInputModel.getFields().get("docName")!=null) {
				task.setDocPath((String) processInputModel.getFields().get("docName"));
			}
			if(processInputModel.getFields().get("bizType")!=null) {
				task.setCategory((String) processInputModel.getFields().get("bizType"));
			}
		}
		if(processInputModel.getWf_variables().get("addtion")!=null) {
			task.setAddition((String) processInputModel.getWf_variables().get("addtion"));
		}

	}
	
	public static TaskEntity buildTaskEntityByProcessEnd(
			ExecutionEntity processInfo) {
		TaskEntity task = TaskEntity.create(Context
				.getProcessEngineConfiguration().getClock().getCurrentTime());
		// by lw
		buildExtTaskEntity(task, processInfo);
		task.setProcessInstance(processInfo.getProcessInstance());
		task.setId(processInfo.getId());
		task.setProcessDefinitionId(processInfo.getProcessDefinitionId());
		task.setName(processInfo.getCurrentActivityName());
		task.setTaskDefinitionKey(processInfo.getCurrentActivityId());
		task.setAssigneeUserId(task.getSendUserId());
		task.setAssigneeUserName(task.getSendUserName());
		task.setAssigneeOrgId(task.getSenderOrgId());
		task.setAssigneeOrgName(task.getSenderOrgName());
		return task;
	}

	// HistoricTaskInstanceEntity
	public static void buildExtHistoricTaskInstanceEntity(
			HistoricTaskInstanceEntity hisTaskEntity, TaskEntity task,
			ExecutionEntity execution) {
		if (task.getProcTitle() != null) {
			hisTaskEntity.setProcTitle(task.getProcTitle());
		} else {
			hisTaskEntity.setProcTitle(execution.getName());
		}
		if (task.getSender() != null) {
			hisTaskEntity.setSender(task.getSender());
		} else {
			hisTaskEntity.setSender(execution.getSender());
		}
		if (task.getSendUserId() != null) {
			hisTaskEntity.setSendUserId(task.getSendUserId());
		} else {
			hisTaskEntity.setSendUserId(execution.getSendUserId());
		}
		/*
		 * if (task.getSendUserName() != null) {
		 * hisTaskEntity.setSendUserName(task.getSendUserName()); } else {
		 * hisTaskEntity.setSendUserName(execution.getSendUserName()); }
		 */
		if (task.getSenderOrgId() != null) {
			hisTaskEntity.setSenderOrgId(task.getSenderOrgId());
		} else {
			hisTaskEntity.setSenderOrgId(execution.getSenderOrgId());
		}
		/*
		 * if (task.getSenderOrgName() != null) {
		 * hisTaskEntity.setSenderOrgName(task.getSenderOrgName()); } else {
		 * hisTaskEntity.setSenderOrgName(execution.getSenderOrgName()); }
		 */
		if (task.getProcessDefinitionName() != null) {
			hisTaskEntity.setProcessDefinitionName(task
					.getProcessDefinitionName());
		} else {
			hisTaskEntity.setProcessDefinitionName(execution
					.getProcessDefinitionName());
		}if (task.getName() != null) {
			hisTaskEntity.setName(task
					.getName());
		} else {
			hisTaskEntity.setName(execution
					.getName());
		}
		hisTaskEntity.setPreTaskId(task.getPreTaskId());
		hisTaskEntity.setPreTaskDefKey(task.getPreTaskDefKey());
		hisTaskEntity.setPreTaskDefName(task.getPreTaskDefName());
		hisTaskEntity.setActionType(task.getActionType());
		if(StringUtils.isEmpty(task.getAssigneeOrgId())||StringUtils.isEmpty(task.getAssigneeOrgName())){
			additionalAssignee(task);
		}
		hisTaskEntity.setAssigneeOrgId(task.getAssigneeOrgId());
		//hisTaskEntity.setAssigneeOrgName(task.getAssigneeOrgName());
		//hisTaskEntity.setAssigneeUserName(task.getAssigneeUserName());
		hisTaskEntity.setAssignee(task.getAssignee());
		hisTaskEntity.setFormKey(task.getFormKey());
		hisTaskEntity.setTopExecutionId(getTopExecutionId(execution));
		hisTaskEntity.setBizId(task.getBizId());
		hisTaskEntity.setDocId(task.getDocId());
		hisTaskEntity.setDocName(task.getDocName());
		hisTaskEntity.setDocPath(task.getDocPath());
		hisTaskEntity.setAddition(task.getAddition());
		hisTaskEntity.setStatus("1");
		
	}
	public static String getTopExecutionId(ExecutionEntity execution){
		String topExecutionId=execution.getId();
		/*if(execution.getSuperExecution()!=null){
			execution=execution.getSuperExecution();
		}*/
		if(topExecutionId!=null&&execution.getParentId()!=null&&!execution.getParent().getId().equals(execution.getParent().getTopProcessInstanceId())){
			topExecutionId =getTopExecutionId(execution.getParent());
		}
		return topExecutionId;
	}
	// HistoricProcessInstanceEntity

	public static void buildExtHistoricProcessInstanceEntity(
			HistoricProcessInstanceEntity hisProcInstEntity,
			ExecutionEntity processInstance) {

		// 2014-1-28 by lw
		hisProcInstEntity.setName(processInstance.getName());
		hisProcInstEntity.setProcessDefinitionName(processInstance
				.getProcessDefinitionName());
		hisProcInstEntity.setProcState(SuspensionState.ACTIVE.getStateCode());
		String parentProcInstId = WfEngineUtils.getWfprocessInputModel(
				processInstance.getVariables()).getWf_parentProcInstId();
		if (hisProcInstEntity.getSuperProcessInstanceId() == null
				&& parentProcInstId != null && !"".equals(parentProcInstId)
				&& !"null".equals(parentProcInstId)) {
			hisProcInstEntity.setSuperProcessInstanceId(parentProcInstId);
		}
		if (StringUtils.isNotEmpty(processInstance.getTopProcessInstanceId())) {
			hisProcInstEntity.setTopProcessInstanceId(processInstance
					.getTopProcessInstanceId());
		} else {
			String topId = processInstance
					.getTopProcessInstanceId(processInstance);
			if (topId == null) {
				topId = processInstance.getProcessInstanceId();
			}
			hisProcInstEntity.setTopProcessInstanceId(topId);
		}
		if (hisProcInstEntity.getBusinessKey() == null) {
			hisProcInstEntity.setBusinessKey(java.util.UUID.randomUUID()
					.toString());
		}
		if (hisProcInstEntity.getStartUserId() == null) {
			hisProcInstEntity.setStartUserId(processInstance.getSendUserId());
		}
		if (hisProcInstEntity.getSender() == null) {
			hisProcInstEntity.setSender(processInstance.getSender());
		}
		if (hisProcInstEntity.getSendUserName() == null) {
			hisProcInstEntity
					.setSendUserName(processInstance.getSendUserName());
		}
		if (hisProcInstEntity.getSenderOrgName() == null) {
			hisProcInstEntity.setSenderOrgName(processInstance
					.getSenderOrgName());
		}
		if (hisProcInstEntity.getSenderOrgId() == null) {
			hisProcInstEntity.setSenderOrgId(processInstance.getSenderOrgId());
		}
		if (hisProcInstEntity.getProcessDefinitionName() == null) {
			hisProcInstEntity.setProcessDefinitionName(processInstance
					.getProcessDefinition().getName());
		}
	}

	public static void buildExtSubHistoricProcessInstanceEntity(
			HistoricProcessInstanceEntity hisProcInstEntity,
			ExecutionEntity processInstance) {
		//by lw
		hisProcInstEntity.setName(processInstance.getName());
		// hisProcInstEntity.setProcessDefinitionName(processInstance.getProcessDefinitionName());
		hisProcInstEntity.setProcState(SuspensionState.ACTIVE.getStateCode());
		if (hisProcInstEntity.getBusinessKey() == null) {
			hisProcInstEntity.setBusinessKey(java.util.UUID.randomUUID()
					.toString());
		}
		if (hisProcInstEntity.getStartUserId() == null) {
			hisProcInstEntity.setStartUserId(processInstance.getSender());
		}
		if (hisProcInstEntity.getSender() == null) {
			hisProcInstEntity.setSender(processInstance.getSender());
		}
		if (hisProcInstEntity.getSendUserName() == null) {
			hisProcInstEntity
					.setSendUserName(processInstance.getSendUserName());
		}
		if (hisProcInstEntity.getSenderOrgName() == null) {
			hisProcInstEntity.setSenderOrgName(processInstance
					.getSenderOrgName());
		}
		if (hisProcInstEntity.getSenderOrgId() == null) {
			hisProcInstEntity.setSenderOrgId(processInstance.getSenderOrgId());
		}
		if (hisProcInstEntity.getProcessDefinitionName() == null) {
			hisProcInstEntity.setProcessDefinitionName(processInstance
					.getProcessDefinition().getName());
		}
	}

	public static void buildExtActivityInstanceByEnd(DelegateExecution execution) {
		ExecutionEntity executionEntity = (ExecutionEntity) execution;
		if (!(executionEntity.getEventSource() instanceof ActivityImpl)) {
			return;
		}
		// 2014-1-28 by lw
		try {
			ActivityImpl activityImpl = (ActivityImpl) executionEntity
					.getEventSource();
			String actvitiyType = (String) activityImpl.getProperty("type");
			//用户任务触发的节点结束逻辑
			if (activityImpl != null
					&& "userTask".equals(actvitiyType)
					&& (activityImpl.getActivityBehavior() instanceof UserTaskActivityBehavior || activityImpl
							.getActivityBehavior() instanceof ParallelMultiInstanceBehavior)) {
				List<TaskEntity> tasks = executionEntity.getTasks();
				//下一个环节为用户任务时的处理逻辑
				if (!tasks.isEmpty()) {
					TaskEntity task = tasks.get(0);
					WfEngineUtils.setWfprocessInputModel(executionEntity, task);
					execution.setVariable(
							WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY,
							task.getTaskDefinitionKey());
					execution.setVariable(
							WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY,
							task.getName());
					execution.setVariable(
							WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY,
							task.getId());
				} else if (executionEntity.getTransition()!=null&&executionEntity.getTransition().getDestination()!=null&&("callActivity".equals(executionEntity
						.getTransition().getDestination().getProperty("type"))
						|| "serviceTask".equals(executionEntity.getTransition()
								.getDestination().getProperty("type"))
						|| "userTask".equals(actvitiyType)
						&& activityImpl.getActivityBehavior() instanceof ParallelMultiInstanceBehavior)) {// 下一个节点为子流程、服务任务节点的处理逻辑
					String sendUserId = executionEntity.getSendUserId();
					if (sendUserId == null) {
						ProcessInputModel processInputModel = WfEngineUtils
								.getWfprocessInputModel(executionEntity
										.getVariables());
						sendUserId = processInputModel.getWf_sendUserId();
					}
					HistoricTaskInstanceQueryImpl query = new HistoricTaskInstanceQueryImpl();
					query.processInstanceId(execution.getProcessInstanceId());
					query.taskAssignee(sendUserId);
					query.taskDefinitionKey(activityImpl.getId())
							.orderByTaskCreateTime().desc();
					List<HistoricTaskInstance> historyTasks = Context
							.getCommandContext()
							.getHistoricTaskInstanceEntityManager()
							.findHistoricTaskInstancesByQueryCriteria(query);
					execution.setVariable(
							WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY,
							execution.getCurrentActivityId());
					execution.setVariable(
							WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY,
							execution.getCurrentActivityName());
					execution
							.setVariable(
									WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY,
									historyTasks != null
											&& !historyTasks.isEmpty() ? historyTasks
											.get(0).getId() : execution.getId());

				}
			} else if (actvitiyType.indexOf("Gateway") != -1
					|| "manualTask".equals(actvitiyType)
					|| "callActivity".equals(actvitiyType)
					|| "receiveTask".equals(actvitiyType)
					|| "scriptTask".equals(actvitiyType)
					|| "serviceTask".equals(executionEntity.getActivity()
							.getProperty("type"))) {// 非用户任务触发的节点结束逻辑
				HistoricActivityInstanceEntity activityInstanceEntity = Context
						.getCommandContext().getHistoryManager()
						.findActivityInstance((ExecutionEntity) execution);
				execution.setVariable(
						WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY,
						activityInstanceEntity != null ? activityInstanceEntity
								.getId() : execution.getId());
				execution.setVariable(
						WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY,
						execution.getCurrentActivityId());
				execution.setVariable(
						WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY,
						execution.getCurrentActivityName());

			}

		} catch (Exception e) {
			log.warn("buildExtActivityInstanceByEnd error ,executionEntity{}",
					new Object[] { executionEntity }, e);
		}
	}

	// TaskEntity.complete
	public static void buildExtTaskEntityByComplete(TaskEntity taskEntity,
			ExecutionEntity execution) {
		// 2014-1-28 by lw
		execution.setVariable(WorkFlowContants.WF_PRE_TASK_DEF_ID_VAR_KEY,
				taskEntity.getTaskDefinitionKey());
		execution.setVariable(WorkFlowContants.WF_PRE_TASK_DEF_NAME_VAR_KEY,
				taskEntity.getName());
		execution.setVariable(WorkFlowContants.WF_PRE_TASK_ID_VAR_KEY,
				taskEntity.getId());
	}

	
	public static void additionalAssignee(TaskEntity taskEntity) {
		String assignee = taskEntity.getAssignee();
		if (StringUtils.isEmpty(assignee)) {
			return;
		}
		taskEntity.setAssigneeUserId(assignee);
		// 2022/06/22 by hanj
		if(StrUtil.isNotEmpty(assignee)) {
			try {
				UserService userService = (UserService) ApplicationContextHolder.getBean("anyShareUserServiceImpl");
				String userName = userService.getUserById(assignee).getUserName();
				taskEntity.setAssigneeOrgId(userName);
			} catch (Exception e) {
				// TODO: handle exception
				System.out.println(e);
			}
		}
		/*
		 * taskEntity.setAssigneeOrgId(org.getOrgId());
		 * taskEntity.setAssigneeOrgName(org.getOrgName());
		 * taskEntity.setAssigneeUserName(user.getUserName());
		 * taskEntity.setAssigneeUserId(user.getUserCode());
		 */
	}

	public static boolean filterVariable(VariableInstanceEntity var,
			ExecutionEntity execution) {
		boolean isFilter = false;
		if (execution != null) {
			if (var.getName().toLowerCase()
					.startsWith(WorkFlowContants.GLOBAL_VARIABLE_PREFIX_KEY)) {
				isFilter = true;
			}
		}
		return isFilter;
	}

	public static boolean filterVariable(String name, ExecutionEntity execution) {
		boolean isFilter = false;
		if (execution == null) {
			return isFilter;
		}
		if (name.toLowerCase().startsWith(
				WorkFlowContants.GLOBAL_VARIABLE_PREFIX_KEY)) {
			isFilter = true;
		}
		return isFilter;
	}
	
	

}
