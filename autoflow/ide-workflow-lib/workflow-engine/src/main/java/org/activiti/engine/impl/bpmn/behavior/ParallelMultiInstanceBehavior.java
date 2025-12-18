/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.activiti.engine.impl.bpmn.behavior;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.apache.commons.lang3.StringUtils;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.script.MultiTaskCompletionCondition;
import com.aishu.wf.core.engine.core.service.impl.ProcessDefinitionResource;
import com.aishu.wf.core.engine.core.service.impl.TaskResourceService;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WfEngineUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * @author Joram Barrez
 */
public class ParallelMultiInstanceBehavior extends MultiInstanceActivityBehavior {
	private static final long serialVersionUID = 1L;

	public ParallelMultiInstanceBehavior(ActivityImpl activity, AbstractBpmnActivityBehavior originalActivityBehavior) {
		super(activity, originalActivityBehavior);
	}

	/**
	 * Handles the parallel case of spawning the instances. Will create child
	 * executions accordingly for every instance needed.
	 */
	protected void createInstances(ActivityExecution execution) throws Exception {
		// by lw
		setMutilAssignee(execution);
		int nrOfInstances = resolveNrOfInstances(execution);
		if (nrOfInstances < 0) {
			throw new ActivitiIllegalArgumentException(
					"Invalid number of instances: must be non-negative integer value" + ", but was " + nrOfInstances);
		}

		setLoopVariable(execution, NUMBER_OF_INSTANCES, nrOfInstances);
		setLoopVariable(execution, NUMBER_OF_COMPLETED_INSTANCES, 0);
		setLoopVariable(execution, NUMBER_OF_ACTIVE_INSTANCES, nrOfInstances);

		List<ActivityExecution> concurrentExecutions = new ArrayList<ActivityExecution>();
		for (int loopCounter = 0; loopCounter < nrOfInstances; loopCounter++) {
			ActivityExecution concurrentExecution = execution.createExecution();
			concurrentExecution.setActive(true);
			concurrentExecution.setConcurrent(true);
			concurrentExecution.setScope(false);
			
			// In case of an embedded subprocess, and extra child execution is required
			// Otherwise, all child executions would end up under the same parent,
			// without any differentiation to which embedded subprocess they belong
			if (isExtraScopeNeeded()) {
				ActivityExecution extraScopedExecution = concurrentExecution.createExecution();
				extraScopedExecution.setActive(true);
				extraScopedExecution.setConcurrent(false);
				extraScopedExecution.setScope(true);
				concurrentExecution = extraScopedExecution;
			}
			//by lw
			((ExecutionEntity)concurrentExecution).setBusinessKey((String) execution.getActivity().getProperty("dealType"));
			concurrentExecutions.add(concurrentExecution);
			logLoopDetails(concurrentExecution, "initialized", loopCounter, 0, nrOfInstances, nrOfInstances);
		}

		// Before the activities are executed, all executions MUST be created up front
		// Do not try to merge this loop with the previous one, as it will lead to bugs,
		// due to possible child execution pruning.
		for (int loopCounter = 0; loopCounter < nrOfInstances; loopCounter++) {
			ActivityExecution concurrentExecution = concurrentExecutions.get(loopCounter);
			// executions can be inactive, if instances are all automatics (no-waitstate)
			// and completionCondition has been met in the meantime
			if (concurrentExecution.isActive() && !concurrentExecution.isEnded()
					&& concurrentExecution.getParent().isActive() && !concurrentExecution.getParent().isEnded()) {
				setLoopVariable(concurrentExecution, getCollectionElementIndexVariable(), loopCounter);
				executeOriginalBehavior(concurrentExecution, loopCounter);
			}
		}

		// See ACT-1586: ExecutionQuery returns wrong results when using multi instance
		// on a receive task
		// The parent execution must be set to false, so it wouldn't show up in the
		// execution query
		// when using .activityId(something). Do not we cannot nullify the activityId
		// (that would
		// have been a better solution), as it would break boundary event behavior.
		if (!concurrentExecutions.isEmpty()) {
			ExecutionEntity executionEntity = (ExecutionEntity) execution;
			executionEntity.setActive(false);
		}
	}

	/**
	 * Called when the wrapped {@link ActivityBehavior} calls the
	 * {@link AbstractBpmnActivityBehavior#leave(ActivityExecution)} method. Handles
	 * the completion of one of the parallel instances
	 */
	public void leave(ActivityExecution execution) {
		callActivityEndListeners(execution);

		int nrOfInstances = getLoopVariable(execution, NUMBER_OF_INSTANCES);
		if (nrOfInstances == 0) {
			// Empty collection, just leave.
			super.leave(execution);
			return;
		}

		int loopCounter = getLoopVariable(execution, getCollectionElementIndexVariable());
		int nrOfCompletedInstances = getLoopVariable(execution, NUMBER_OF_COMPLETED_INSTANCES) + 1;
		int nrOfActiveInstances = getLoopVariable(execution, NUMBER_OF_ACTIVE_INSTANCES) - 1;

		if (isExtraScopeNeeded()) {
			// In case an extra scope was created, it must be destroyed first before going
			// further
			ExecutionEntity extraScope = (ExecutionEntity) execution;
			execution = execution.getParent();
			// by lw
			if (execution.getVariablesLocal().isEmpty()) {
				execution.setVariablesLocal(extraScope.getVariablesLocal());
			}
			extraScope.remove();
		}

		if (execution.getParent() != null) { // will be null in case of empty collection
			setLoopVariable(execution.getParent(), NUMBER_OF_COMPLETED_INSTANCES, nrOfCompletedInstances);
			setLoopVariable(execution.getParent(), NUMBER_OF_ACTIVE_INSTANCES, nrOfActiveInstances);
		}
		logLoopDetails(execution, "instance completed", loopCounter, nrOfCompletedInstances, nrOfActiveInstances,
				nrOfInstances);

		ExecutionEntity executionEntity = (ExecutionEntity) execution;
		ProcessInputModel curProcessInputModel = WfEngineUtils.getWfprocessInputModel(execution.getVariables());
		if (executionEntity.getParent() != null) {
			executionEntity.inactivate();
			executionEntity.getParent().forceUpdate();
			List<ActivityExecution> joinedExecutions = executionEntity
					.findInactiveConcurrentExecutions(execution.getActivity());
			Map<String, Object> filterVariables = initVariables(joinedExecutions, execution);
			if (completionConditionSatisfied(execution, filterVariables) || joinedExecutions.size() >= nrOfInstances) {
				// Removing all active child executions (ie because completionCondition is true)
				List<ExecutionEntity> executionsToRemove = new ArrayList<ExecutionEntity>();
				for (ActivityExecution childExecution : executionEntity.getParent().getExecutions()) {
					//by lw
					if (!executionEntity.getId().equals(childExecution.getId())) {
						executionsToRemove.add((ExecutionEntity) childExecution);
					}
				}
				for (ExecutionEntity executionToRemove : executionsToRemove) {
					if (LOGGER.isDebugEnabled()) {
						LOGGER.debug(
								"Execution {} still active, but multi-instance is completed. Removing this execution.",
								executionToRemove);
					}
					executionToRemove.inactivate();
					executionToRemove.deleteCascade(WorkFlowContants.DELETE_TASK_REASON_MULTI_DELETE_KEY);
				}
				// by lw
				Context.getCommandContext().getHistoryManager().recordActivityEnd(executionEntity);
				// by lw
				List<PvmTransition> transitionsToTake = new ArrayList<PvmTransition>();
				try {
					ProcessDefinitionResource processDefinitionResource = (ProcessDefinitionResource) ApplicationContextHolder
							.getBean("processDefinitionResource");
					/**
					 * by lw 多实例输出按前端指定下一环节跳转
					 */
					String nextActDefId = (String) Context.getCommandContext().getAttribute("nextActDefId");
					
					// 连续多级执行逻辑
					nextActDefId = exeContinuousMultilevelTask(execution, curProcessInputModel, nextActDefId);
					
					//自动执行逻辑
					autoExeNextTask( execution, curProcessInputModel, nextActDefId);
					
					nextActDefId=curProcessInputModel.getWf_nextActDefId();
					Context.getCommandContext().addAttribute("nextActDefId",nextActDefId);
					execution.setVariable(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, curProcessInputModel);
					execution.getParent().setVariable(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, curProcessInputModel);
					if ((!curProcessInputModel.isWf_webAutoQueryNextActFlag()) && StringUtils.isNotEmpty(nextActDefId)) {
						TransitionImpl newTransition = new TransitionImpl(null, executionEntity.getProcessDefinition());
						newTransition.setSource((ActivityImpl) execution.getActivity());
						newTransition
								.setDestinationByExtend(executionEntity.getProcessDefinition().findActivity(nextActDefId));
						transitionsToTake.add(newTransition);
						//executionEntity.setActivity(newTransition.getDestination());
					} else {
						for (PvmTransition outgoingTransition : execution.getActivity().getOutgoingTransitions()) {
							if (!processDefinitionResource.filterActivity(execution.getProcessDefinitionId(),
									(ActivityImpl) outgoingTransition.getSource(),
									(ActivityImpl) outgoingTransition.getDestination(), filterVariables)) {
								transitionsToTake.add(outgoingTransition);
							}
						}
					}
				} catch (Exception e) {
					LOGGER.error("custom transitionsToTake error",e);
				}
				if (transitionsToTake.isEmpty()) {
					transitionsToTake.addAll(execution.getActivity().getOutgoingTransitions());
				}
				if (transitionsToTake.size() > 1) {
					throw new WorkFlowException(ExceptionErrorCode.B2050, "transitionsToTake size>1");
				}
				executionEntity.takeAll(transitionsToTake, joinedExecutions);
			} else if (joinedExecutions.size() >= 1) {
				setExecutionVariables(executionEntity);
				// by lw 2014-5-25
				recordTaskEndExtend(executionEntity);
				

			}

		} else {
			super.leave(executionEntity);
		}
	}

	/**
	 * 2013/5/3 by lw start Record the creation of a task, if audit history is
	 * enabled.
	 */
	public HistoricTaskInstanceEntity recordTaskEndExtend(ActivityExecution execution) {
		HistoricTaskInstanceEntity historicTaskInstance = null;
		TaskEntity task = TaskEntity.create(Context.getProcessEngineConfiguration().getClock().getCurrentTime());
		ExecutionEntity executionEntity = (ExecutionEntity) execution;
		// by lw
		WfEngineUtils.buildExtTaskEntity(task, executionEntity);
		historicTaskInstance = new HistoricTaskInstanceEntity(task, executionEntity);
		if (historicTaskInstance.getPreTaskId() != null) {
			/*
			 * HistoricTaskInstanceEntity
			 * prevHisTask=Context.getCommandContext().getHistoricTaskInstanceEntityManager(
			 * ).findHistoricTaskInstanceById(historicTaskInstance.getPreTaskId());
			 * historicTaskInstance.setStartTime(prevHisTask!=null?prevHisTask.getEndTime():
			 * Context .getProcessEngineConfiguration().getClock().getCurrentTime());
			 */
		}
		ProcessInputModel processInputModel = WfEngineUtils.getWfprocessInputModel(execution.getVariables());
		if (processInputModel.getWf_receiver() != null && processInputModel.getWf_receiver().indexOf(",") == -1) {
			task.setAssigneeWithoutCascade(processInputModel.getWf_receiver());
		}
		WfEngineUtils.buildExtHistoricTaskInstanceEntity(historicTaskInstance, task, executionEntity);
		historicTaskInstance.setAssignee(processInputModel.getWf_receiver());
		if ("callActivity".equals(executionEntity.getActivity().getProperty("type"))) {
			historicTaskInstance.setPreTaskDefName((String) executionEntity.getActivity().getProperty("name"));
		} else {
			historicTaskInstance.setTaskDefinitionKey(processInputModel.getWf_nextActDefId());
			historicTaskInstance.setName(processInputModel.getWf_nextActDefName());
			// historicTaskInstance.setTaskDefinitionKey(processInputModel.getWf_nextActDefId());
		}
		historicTaskInstance.setDescription(processInputModel.getWf_nextActDefType());
		historicTaskInstance.setActionType("execute_activity");

		historicTaskInstance.markEnded("custom-completed");
		historicTaskInstance.setEndTime(null);
		Context.getCommandContext().getDbSqlSession().insert(historicTaskInstance);
		// by lw 2014-11-30
		Context.getCommandContext().getProcessEngineConfiguration().getTaskService()
				.deleteComments(historicTaskInstance.getPreTaskId(), null);
		Context.getCommandContext().getCommentEntityManager().addCommentNotValidate(historicTaskInstance.getPreTaskId(),
				executionEntity.getTopProcessInstanceId(), historicTaskInstance.getProcessInstanceId(),
				processInputModel.getWf_curComment(), processInputModel.getWf_commentDisplayArea());

		return historicTaskInstance;
	}

	/**
	 * 设置任务上下文变量
	 * 
	 * @param delegateTask
	 */
	private void setExecutionVariables(ExecutionEntity executionEntity) {
		Map<String, Object> taskVariables = executionEntity.getVariables();
		for (Map.Entry<String, Object> variable : taskVariables.entrySet()) {
			if (StringUtils.isEmpty(variable.getKey()) || variable.getValue() == null) {
				continue;
			}
			if (!((variable.getKey().equals(WorkFlowContants.WF_BUSINESS_DATA_OBJECT_KEY))
					|| (variable.getKey().equals(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY)))) {
				continue;
			}
			executionEntity.setVariableLocal(variable.getKey(), variable.getValue());
		}
	}

	protected boolean completionConditionSatisfied(ActivityExecution execution, Map<String, Object> filterVariables) {
		MultiTaskCompletionCondition condition = (MultiTaskCompletionCondition) ApplicationContextHolder
				.getBean("multiTaskCompletionCondition");
		return condition.completionConditionByMultiTask(execution, filterVariables);
	}

	private Map<String, Object> initVariables(List<ActivityExecution> joinedExecutions, ActivityExecution execution) {
		List<ProcessInputModel> processInputModels = new ArrayList<ProcessInputModel>();
		for (ActivityExecution activityExecution : joinedExecutions) {
			ProcessInputModel processInputModel = WfEngineUtils
					.getWfprocessInputModel(activityExecution.getVariables());
			processInputModels.add(processInputModel);
		}
		Map<String, Object> filterVariables = new HashMap<String, Object>();
		filterVariables.putAll(execution.getVariables());
		filterVariables.put("execution", execution);
		filterVariables.put("processInputModels", processInputModels);
		return filterVariables;
	}
	
	//by lw
	public void setMutilAssignee(ActivityExecution execution) throws Exception {
		//runtime change Behavior
		((ExecutionEntity)execution).setBusinessKey((String) execution.getActivity().getProperty("dealType"));
		if (execution.getVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST) == null) {
			TaskResourceService taskResourceService = (TaskResourceService) ApplicationContextHolder.getBean("taskResourceService");
			ProcessInputModel processInputModel = ProcessDefinitionUtils
					.getWfprocessInputModel((ExecutionEntity) execution);
			processInputModel.setWf_curActDefId(execution.getActivity().getId());
			String multiLevelDescription = (String) execution.getVariable("multiLevelDescription");
			if(null != multiLevelDescription && "multilevel".equals(multiLevelDescription)) {
				// 若当前环节实例为连续多级，则审核员设置未通过匹配级别获取到的审核员
				// by hanj 2022-07
				List<String> multilevelAssigneList = (List<String>) execution.getVariable("multilevelAssigneeList");
				execution.setVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST, multilevelAssigneList);
			} else {
				execution.setVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST,
						taskResourceService.getNextActivityUser(processInputModel));
			}
		}
	}
	

}
