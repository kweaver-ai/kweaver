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

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.activiti.engine.ActivitiException;
import org.activiti.engine.delegate.event.ActivitiEventType;
import org.activiti.engine.delegate.event.impl.ActivitiEventBuilder;
import org.activiti.engine.impl.Condition;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.JobEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.ProcessDefinitionImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.activiti.engine.impl.pvm.runtime.InterpretableExecution;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.executor.ExecuteActivityExecutor;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WfEngineUtils;

import cn.hutool.core.util.StrUtil;

/**
 * Helper class for implementing BPMN 2.0 activities, offering convenience
 * methods specific to BPMN 2.0.
 *
 * This class can be used by inheritance or aggregation.
 *
 * @author Joram Barrez
 */
public class BpmnActivityBehavior implements Serializable {
	private static final long serialVersionUID = 1L;

	private static Logger log = LoggerFactory.getLogger(BpmnActivityBehavior.class);

	/**
	 * Performs the default outgoing BPMN 2.0 behavior, which is having parallel
	 * paths of executions for the outgoing sequence flow.
	 *
	 * More precisely: every sequence flow that has a condition which evaluates to
	 * true (or which doesn't have a condition), is selected for continuation of the
	 * process instance. If multiple sequencer flow are selected, multiple, parallel
	 * paths of executions are created.
	 */
	public void performDefaultOutgoingBehavior(ActivityExecution activityExecution) {
		ActivityImpl activity = (ActivityImpl) activityExecution.getActivity();
		if (!(activity.getActivityBehavior() instanceof IntermediateCatchEventActivityBehavior)) {
			dispatchJobCanceledEvents(activityExecution);
		}
		performOutgoingBehavior(activityExecution, true, false, null);
	}

	/**
	 * Performs the default outgoing BPMN 2.0 behavior (@see
	 * {@link #performDefaultOutgoingBehavior(ActivityExecution)}), but without
	 * checking the conditions on the outgoing sequence flow.
	 *
	 * This means that every outgoing sequence flow is selected for continuing the
	 * process instance, regardless of having a condition or not. In case of
	 * multiple outgoing sequence flow, multiple parallel paths of executions will
	 * be created.
	 */
	public void performIgnoreConditionsOutgoingBehavior(ActivityExecution activityExecution) {
		performOutgoingBehavior(activityExecution, false, false, null);
	}

	/**
	 * dispatch job canceled event for job associated with given execution entity
	 *
	 * @param activityExecution
	 */
	protected void dispatchJobCanceledEvents(ActivityExecution activityExecution) {
		if (activityExecution instanceof ExecutionEntity) {
			List<JobEntity> jobs = ((ExecutionEntity) activityExecution).getJobs();
			for (JobEntity job : jobs) {
				if (Context.getProcessEngineConfiguration().getEventDispatcher().isEnabled()) {
					Context.getProcessEngineConfiguration().getEventDispatcher()
							.dispatchEvent(ActivitiEventBuilder.createEntityEvent(ActivitiEventType.JOB_CANCELED, job));
				}
			}
		}
	}

	/**
	 * Actual implementation of leaving an activity.
	 *
	 * @param execution                      The current execution context
	 * @param checkConditions                Whether or not to check conditions
	 *                                       before determining whether or not to
	 *                                       take a transition.
	 * @param throwExceptionIfExecutionStuck If true, an {@link ActivitiException}
	 *                                       will be thrown in case no transition
	 *                                       could be found to leave the activity.
	 */
	protected void performOutgoingBehavior(ActivityExecution execution, boolean checkConditions,
			boolean throwExceptionIfExecutionStuck, List<ActivityExecution> reusableExecutions) {

		if (log.isDebugEnabled()) {
			log.debug("Leaving activity '{}'", execution.getActivity().getId());
		}

		String defaultSequenceFlow = (String) execution.getActivity().getProperty("default");
		List<PvmTransition> transitionsToTake = new ArrayList<PvmTransition>();

		// by lw 按前端指定下一环节跳转
		String nextActDefId = (String) Context.getCommandContext().getAttribute("nextActDefId");
		int findStartNextActDefId = 0;
		//判断开始节点多路输出
		if (nextActDefId == null && "startEvent".equals(execution.getActivity().getProperty("type"))) {
			List<PvmTransition> pvm = execution.getActivity().getOutgoingTransitions();
			for (PvmTransition pvmTransition : pvm) {
				if ("userTask".equals(pvmTransition.getDestination().getProperty("type"))) {
					findStartNextActDefId++;
				}
			}
		}

		ProcessDefinitionImpl pdf = ((ExecutionEntity) execution).getProcessDefinition();
		//判断开始节点多路输出
		if (findStartNextActDefId > 1) {
			nextActDefId = (String) Context.getCommandContext().getAttribute("startNextActDefId");
			if (StringUtils.isEmpty(nextActDefId)) {
				return;
			}
			TransitionImpl newTransition = new TransitionImpl(null, null, pdf);
			newTransition.setSource((ActivityImpl) execution.getActivity());
			newTransition.setDestinationByExtend(pdf.findActivity(nextActDefId));
			transitionsToTake.add(newTransition);
		} else if (StringUtils.isNotEmpty(nextActDefId)
				&& "userTask".equals(execution.getActivity().getProperty("type"))) {//前端指定下一环节
			TransitionImpl newTransition = new TransitionImpl(null, null, pdf);
			newTransition.setSource((ActivityImpl) execution.getActivity());
			ActivityImpl nextActDef = pdf.findActivity(nextActDefId);
			if (nextActDef != null) {
				newTransition.setDestination(pdf.findActivity(nextActDefId));
				transitionsToTake.add(newTransition);
			}
		}

		boolean emptyToTake = false;
		if (transitionsToTake.isEmpty()) {//没有下一节点就自动找节点的输出环节
			List<PvmTransition> outgoingTransitions = execution.getActivity().getOutgoingTransitions();
			for (PvmTransition outgoingTransition : outgoingTransitions) {
				if (defaultSequenceFlow == null || !outgoingTransition.getId().equals(defaultSequenceFlow)) {
					Condition condition = (Condition) outgoingTransition.getProperty(BpmnParse.PROPERTYNAME_CONDITION);
					if (condition == null || !checkConditions
							|| condition.evaluate(outgoingTransition.getId(), execution)) {
						transitionsToTake.add(outgoingTransition);
						emptyToTake = true;
					}
				}
			}
		}
		//只有下一环节就走单个节点执行
		if (transitionsToTake.size() == 1) {
			// by lw 第一个节点自动通过
			PvmTransition outgoingTransition = transitionsToTake.get(0);
			ProcessInputModel curProcessInputModel = WfEngineUtils.getWfprocessInputModel(execution.getVariables());
			if (!WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(curProcessInputModel.getWf_uniteCategory()) && emptyToTake &&
					ProcessDefinitionUtils.isStartUserTask(execution.getProcessDefinitionId(), outgoingTransition.getDestination().getId())) {
				// 自动执行逻辑
				String resultNextActDefId = autoExeNextTask(execution, curProcessInputModel, outgoingTransition.getDestination().getId());
				if (!outgoingTransition.getDestination().getId().equals(resultNextActDefId)) {
					TransitionImpl newTransition = new TransitionImpl(null, null, pdf);
					newTransition.setSource((ActivityImpl) execution.getActivity());
					newTransition.setDestinationByExtend(pdf.findActivity(curProcessInputModel.getWf_nextActDefId()));
					outgoingTransition = newTransition;
				}
			}

			execution.take(outgoingTransition);

		} else if (transitionsToTake.size() >= 1) {//只有多个下一环节的执行

			execution.inactivate();
			if (reusableExecutions == null || reusableExecutions.isEmpty()) {
				execution.takeAll(transitionsToTake, Arrays.asList(execution));
			} else {
				execution.takeAll(transitionsToTake, reusableExecutions);
			}

		} else {

			if (defaultSequenceFlow != null) {
				PvmTransition defaultTransition = execution.getActivity().findOutgoingTransition(defaultSequenceFlow);
				if (defaultTransition != null) {
					execution.take(defaultTransition);
				} else {
					throw new ActivitiException(
							"Default sequence flow '" + defaultSequenceFlow + "' could not be not found");
				}
			} else {

				Object isForCompensation = execution.getActivity()
						.getProperty(BpmnParse.PROPERTYNAME_IS_FOR_COMPENSATION);
				if (isForCompensation != null && (Boolean) isForCompensation) {
					if (execution instanceof ExecutionEntity) {
						Context.getCommandContext().getHistoryManager().recordActivityEnd((ExecutionEntity) execution);
					}
					InterpretableExecution parentExecution = (InterpretableExecution) execution.getParent();
					((InterpretableExecution) execution).remove();
					parentExecution.signal("compensationDone", null);

				} else {

					if (log.isDebugEnabled()) {
						log.debug("No outgoing sequence flow found for {}. Ending execution.",
								execution.getActivity().getId());
					}
					execution.end();

					if (throwExceptionIfExecutionStuck) {
						throw new ActivitiException("No outgoing sequence flow of the inclusive gateway '"
								+ execution.getActivity().getId() + "' could be selected for continuing the process");
					}
				}

			}
		}
	}



	/**
	 * by lw
	 *
	 * @param execution
	 * @param processInputModel
	 * @param nextActDefId
	 * @return
	 */
	protected String autoExeNextTask(ActivityExecution execution, ProcessInputModel processInputModel,
			String nextActDefId) {
		DocShareStrategyService docShareStrategyService = (DocShareStrategyService) ApplicationContextHolder
				.getBean("docShareStrategyService");
		ExecuteActivityExecutor executeActivityExecutor = (ExecuteActivityExecutor) ApplicationContextHolder
				.getBean("execute_activity");
		DocShareStrategy docShareStrategy;
		try {
			docShareStrategy = docShareStrategyService.queryDocShareStrategy(processInputModel.getWf_procDefId(),
					nextActDefId, null, null, null);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return nextActDefId;
		}
		// by ouandyang
		// 如果有审核员，则不走自动审核
		List<DocShareStrategyAuditor> auditorList = null;
		String noAuditorType = docShareStrategy.getNoAuditorType() != null ? docShareStrategy.getNoAuditorType() : null;
		try {
			Map<String, Object> fields = processInputModel.getFields();
			Integer docCsfLevel = Integer.valueOf(fields.get("docCsfLevel").toString());
			auditorList = docShareStrategyService.getDocAuditorList(processInputModel.getWf_procDefId(), nextActDefId, null,
			         null, docCsfLevel, processInputModel.getWf_starter(), null, null, fields);
		} catch (Exception e) {
			log.debug("getDocAuditorList error ===", e);
		}
		if (auditorList != null && auditorList.size() > 0) {
			// 判断审核员与发起人为同一人时，审核类型，自动拒绝：auto_reject；自动通过：auto_pass
        	List<DocShareStrategyAuditor> ownAuditorList = auditorList.stream().filter(item -> !item.getUserId().equals(processInputModel.getWf_starter())).collect(Collectors.toList());
            if(ownAuditorList.size() > 0) {
            	return nextActDefId;
            } else {
            	noAuditorType = null != docShareStrategy ? docShareStrategy.getOwnAuditorType() : noAuditorType;
            }
		}

		processInputModel.setWf_nextActDefId(nextActDefId);
		// by ouandyang 设置环节名称
		if (StrUtil.isBlank(processInputModel.getWf_nextActDefName())) {
			processInputModel.setWf_nextActDefName(docShareStrategy.getActDefName());
		}
		if (null != noAuditorType && noAuditorType.equals("auto_pass")) {
			// 记录自动执行的环节
			recordAutoTaskExtend(execution, processInputModel);
			// 自动获取下一节点
			processInputModel.setWf_curActDefId(processInputModel.getWf_nextActDefId());
			processInputModel.setWf_curActDefType(processInputModel.getWf_nextActDefType());
			processInputModel.setWf_curActDefName(processInputModel.getWf_nextActDefName());
			processInputModel.setWf_nextActDefId(null);
			processInputModel.setWf_nextActDefType(null);
			processInputModel.setWf_nextActDefName(null);
			executeActivityExecutor.autoAct(processInputModel, null);
			processInputModel.setWf_webAutoQueryNextActFlag(false);
			autoExeNextTask(execution, processInputModel, processInputModel.getWf_nextActDefId());
		} else if (null != noAuditorType && noAuditorType.equals("auto_reject")) {
			execution.setVariable("auto_reject", "true");
			execution.setVariable("auditResult", false); // by ouandyang
			processInputModel.setWf_nextActDefId("EndEvent_1wqgipp");
			processInputModel.setWf_nextActDefName("流程结束");
			processInputModel.setWf_nextActDefType("endEvent");
			ExecutionEntity executionEntity = (ExecutionEntity) execution;
			executionEntity.setId(execution.getProcessInstanceId());
			executionEntity.setSuspensionState(SuspensionState.AUTO_REJECT.getStateCode());
			return processInputModel.getWf_nextActDefId();
		}
		// by ouandyang
		// 所有环节全部自动审核通过后，更新相关状态
		else if (StrUtil.isBlank(processInputModel.getWf_curActInstId()) && "EndEvent_1wqgipp".equals(nextActDefId)) {
			execution.setVariable("auditResult", true);
			ExecutionEntity executionEntity = (ExecutionEntity) execution;
			executionEntity.setId(execution.getProcessInstanceId());
			executionEntity.setSuspensionState(SuspensionState.FINISH.getStateCode());
		}

		/*
			 * else {
			 * processInputModel.setWf_curActDefId(processInputModel.getWf_nextActDefId());
			 * processInputModel.setWf_curActDefType(processInputModel.getWf_nextActDefType(
			 * ));
			 * processInputModel.setWf_curActDefName(processInputModel.getWf_nextActDefName(
			 * )); processInputModel.setWf_nextActDefId(null);
			 * processInputModel.setWf_nextActDefType(null);
			 * processInputModel.setWf_nextActDefName(null); }
			 */
		return processInputModel.getWf_nextActDefId();
	}

	/**
	 * 2013/5/3 by lw start Record the creation of a task, if audit history is
	 * enabled.
	 */
	private HistoricTaskInstanceEntity recordAutoTaskExtend(ActivityExecution execution,
			ProcessInputModel processInputModel) {
		HistoricTaskInstanceEntity historicTaskInstance = null;
		TaskEntity task = TaskEntity.create(Context.getProcessEngineConfiguration().getClock().getCurrentTime());
		ExecutionEntity executionEntity = (ExecutionEntity) execution;
		// by lw
		WfEngineUtils.buildExtTaskEntity(task, executionEntity);
		task.setName(processInputModel.getWf_nextActDefName());
		task.setTaskDefinitionKey(processInputModel.getWf_nextActDefId());
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
		historicTaskInstance.setFormKey((String) executionEntity.getActivity().getProperty("dealType"));
		historicTaskInstance.setDescription("autoPass");
		historicTaskInstance.setActionType("execute_activity");

		historicTaskInstance.markEnded("autoPass");
		Context.getCommandContext().getDbSqlSession().insert(historicTaskInstance);
		// by lw 2014-11-30
		/*
		 * Context.getCommandContext().getProcessEngineConfiguration().getTaskService()
		 * .deleteComments(historicTaskInstance.getPreTaskId(), null);
		 */
		/*
		 * Context.getCommandContext().getCommentEntityManager().addCommentNotValidate(
		 * historicTaskInstance.getPreTaskId(),
		 * executionEntity.getTopProcessInstanceId(),
		 * historicTaskInstance.getProcessInstanceId(),
		 * processInputModel.getWf_curComment(),
		 * processInputModel.getWf_commentDisplayArea());
		 */
		return historicTaskInstance;
	}


}
