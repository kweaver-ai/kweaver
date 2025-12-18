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
import java.util.Collection;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.activiti.engine.ActivitiException;
import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.delegate.BpmnError;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.ExecutionListener;
import org.activiti.engine.delegate.Expression;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.HistoricTaskInstanceQueryImpl;
import org.activiti.engine.impl.bpmn.helper.ErrorPropagation;
import org.activiti.engine.impl.bpmn.helper.ScopeUtil;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.delegate.ExecutionListenerInvocation;
import org.activiti.engine.impl.history.handler.ActivityInstanceStartHandler;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.impl.pvm.delegate.CompositeActivityBehavior;
import org.activiti.engine.impl.pvm.delegate.SubProcessActivityBehavior;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.runtime.AtomicOperation;
import org.activiti.engine.impl.pvm.runtime.InterpretableExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.ContivuousMultilevelDTO;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.executor.ExecuteActivityExecutor;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.util.WfEngineUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;

/**
 * Implementation of the multi-instance functionality as described in the BPMN
 * 2.0 spec.
 *
 * Multi instance functionality is implemented as an {@link ActivityBehavior}
 * that wraps the original {@link ActivityBehavior} of the activity.
 *
 * Only subclasses of {@link AbstractBpmnActivityBehavior} can have
 * multi-instance behavior. As such, special logic is contained in the
 * {@link AbstractBpmnActivityBehavior} to delegate to the
 * {@link MultiInstanceActivityBehavior} if needed.
 *
 * @author Joram Barrez
 * @author Falko Menge
 */
public abstract class MultiInstanceActivityBehavior extends FlowNodeActivityBehavior
		implements CompositeActivityBehavior, SubProcessActivityBehavior {
	private static final long serialVersionUID = 1L;
	protected static final Logger LOGGER = LoggerFactory.getLogger(MultiInstanceActivityBehavior.class);

	// Variable names for outer instance(as described in spec)
	protected final String NUMBER_OF_INSTANCES = "nrOfInstances";
	protected final String NUMBER_OF_ACTIVE_INSTANCES = "nrOfActiveInstances";
	protected final String NUMBER_OF_COMPLETED_INSTANCES = "nrOfCompletedInstances";

	// Instance members
	protected ActivityImpl activity;
	protected AbstractBpmnActivityBehavior innerActivityBehavior;
	protected Expression loopCardinalityExpression;
	protected Expression completionConditionExpression;
	protected Expression collectionExpression;
	protected String collectionVariable;
	protected String collectionElementVariable;
	// default variable name for loop counter for inner instances (as described in
	// the spec)
	protected String collectionElementIndexVariable = "loopCounter";

	/**
	 * @param innerActivityBehavior The original {@link ActivityBehavior} of the
	 *                              activity that will be wrapped inside this
	 *                              behavior.
	 * @param isSequential          Indicates whether the multi instance behavior
	 *                              must be sequential or parallel
	 */
	public MultiInstanceActivityBehavior(ActivityImpl activity, AbstractBpmnActivityBehavior innerActivityBehavior) {
		this.activity = activity;
		setInnerActivityBehavior(innerActivityBehavior);
	}

	public void execute(ActivityExecution execution) throws Exception {
		if (getLocalLoopVariable(execution, getCollectionElementIndexVariable()) == null) {
			try {
				createInstances(execution);
			} catch (BpmnError error) {
				ErrorPropagation.propagateError(error, execution);
			}

			if (resolveNrOfInstances(execution) == 0) {
				leave(execution);
			}
		} else {
			innerActivityBehavior.execute(execution);
		}
	}

	protected abstract void createInstances(ActivityExecution execution) throws Exception;

	// Intercepts signals, and delegates it to the wrapped {@link ActivityBehavior}.
	public void signal(ActivityExecution execution, String signalName, Object signalData) throws Exception {
		innerActivityBehavior.signal(execution, signalName, signalData);
	}

	// required for supporting embedded subprocesses
	public void lastExecutionEnded(ActivityExecution execution) {
		ScopeUtil.createEventScopeExecution((ExecutionEntity) execution);
		leave(execution);
	}

	// required for supporting external subprocesses
	public void completing(DelegateExecution execution, DelegateExecution subProcessInstance) throws Exception {
		// by lw
		if (CallActivityBehavior.class.isInstance(innerActivityBehavior)) {
			((CallActivityBehavior) innerActivityBehavior).completing(execution, subProcessInstance);
		}
	}

	// required for supporting external subprocesses
	public void completed(ActivityExecution execution) throws Exception {
		leave(execution);
	}

	// Helpers
	// //////////////////////////////////////////////////////////////////////

	@SuppressWarnings("rawtypes")
	protected int resolveNrOfInstances(ActivityExecution execution) {
		int nrOfInstances = -1;
		if (loopCardinalityExpression != null) {
			nrOfInstances = resolveLoopCardinality(execution);
		} else if (collectionExpression != null) {
			Object obj = collectionExpression.getValue(execution);
			if (!(obj instanceof Collection)) {
				throw new ActivitiIllegalArgumentException(
						collectionExpression.getExpressionText() + "' didn't resolve to a Collection");
			}
			nrOfInstances = ((Collection) obj).size();
		} else if (collectionVariable != null) {
			Object obj = execution.getVariable(collectionVariable);
			if (obj == null) {
				throw new ActivitiIllegalArgumentException("Variable " + collectionVariable + " is not found");
			}
			if (!(obj instanceof Collection)) {
				throw new ActivitiIllegalArgumentException("Variable " + collectionVariable + "' is not a Collection");
			}
			nrOfInstances = ((Collection) obj).size();
		} else {
			throw new ActivitiIllegalArgumentException("Couldn't resolve collection expression nor variable reference");
		}
		return nrOfInstances;
	}

	@SuppressWarnings("rawtypes")
	protected void executeOriginalBehavior(ActivityExecution execution, int loopCounter) throws Exception {
		if (usesCollection() && collectionElementVariable != null) {
			Collection collection = null;
			if (collectionExpression != null) {
				collection = (Collection) collectionExpression.getValue(execution);
			} else if (collectionVariable != null) {
				collection = (Collection) execution.getVariable(collectionVariable);
			}

			Object value = null;
			int index = 0;
			Iterator it = collection.iterator();
			while (index <= loopCounter) {
				value = it.next();
				index++;
			}
			setLoopVariable(execution, collectionElementVariable, value);
		}

		// If loopcounter == 1, then historic activity instance already created, no need
		// to
		// pass through executeActivity again since it will create a new historic
		// activity
		if (loopCounter == 0) {
			callCustomActivityStartListeners(execution);
			innerActivityBehavior.execute(execution);
		} else {
			execution.executeActivity(activity);
		}
	}

	protected boolean usesCollection() {
		return collectionExpression != null || collectionVariable != null;
	}

	protected boolean isExtraScopeNeeded() {
		// special care is needed when the behavior is an embedded subprocess (not very
		// clean, but it works)
		return innerActivityBehavior instanceof org.activiti.engine.impl.bpmn.behavior.SubProcessActivityBehavior;
	}

	protected int resolveLoopCardinality(ActivityExecution execution) {
		// Using Number since expr can evaluate to eg. Long (which is also the default
		// for Juel)
		Object value = loopCardinalityExpression.getValue(execution);
		if (value instanceof Number) {
			return ((Number) value).intValue();
		} else if (value instanceof String) {
			return Integer.valueOf((String) value);
		} else {
			throw new ActivitiIllegalArgumentException("Could not resolve loopCardinality expression '"
					+ loopCardinalityExpression.getExpressionText() + "': not a number nor number String");
		}
	}

	protected boolean completionConditionSatisfied(ActivityExecution execution) {
		if (completionConditionExpression != null) {
			Object value = completionConditionExpression.getValue(execution);
			if (!(value instanceof Boolean)) {
				throw new ActivitiIllegalArgumentException("completionCondition '"
						+ completionConditionExpression.getExpressionText() + "' does not evaluate to a boolean value");
			}
			Boolean booleanValue = (Boolean) value;
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("Completion condition of multi-instance satisfied: {}", booleanValue);
			}
			return booleanValue;
		}
		return false;
	}

	protected void setLoopVariable(ActivityExecution execution, String variableName, Object value) {
		execution.setVariableLocal(variableName, value);
	}

	protected Integer getLoopVariable(ActivityExecution execution, String variableName) {
		Object value = execution.getVariableLocal(variableName);
		ActivityExecution parent = execution.getParent();
		while (value == null && parent != null) {
			value = parent.getVariableLocal(variableName);
			parent = parent.getParent();
		}
		return (Integer) (value != null ? value : 0);
	}

	protected Integer getLocalLoopVariable(ActivityExecution execution, String variableName) {
		return (Integer) execution.getVariableLocal(variableName);
	}

	/**
	 * Since the first loop of the multi instance is not executed as a regular
	 * activity, it is needed to call the start listeners yourself.
	 */
	protected void callCustomActivityStartListeners(ActivityExecution execution) {
		List<ExecutionListener> listeners = activity
				.getExecutionListeners(org.activiti.engine.impl.pvm.PvmEvent.EVENTNAME_START);

		List<ExecutionListener> filteredExecutionListeners = new ArrayList<ExecutionListener>(listeners.size());
		if (listeners != null) {
			// Sad that we have to do this, but it's the only way I could find (which is
			// also safe for backwards compatibility)

			for (ExecutionListener executionListener : listeners) {
				if (!(executionListener instanceof ActivityInstanceStartHandler)) {
					filteredExecutionListeners.add(executionListener);
				}
			}

			CallActivityListenersOperation atomicOperation = new CallActivityListenersOperation(
					filteredExecutionListeners);
			Context.getCommandContext().performOperation(atomicOperation, (InterpretableExecution) execution);
		}

	}

	/**
	 * Since no transitions are followed when leaving the inner activity, it is
	 * needed to call the end listeners yourself.
	 */
	protected void callActivityEndListeners(ActivityExecution execution) {
		List<ExecutionListener> listeners = activity
				.getExecutionListeners(org.activiti.engine.impl.pvm.PvmEvent.EVENTNAME_END);
		CallActivityListenersOperation atomicOperation = new CallActivityListenersOperation(listeners);
		Context.getCommandContext().performOperation(atomicOperation, (InterpretableExecution) execution);
	}

	protected void logLoopDetails(ActivityExecution execution, String custom, int loopCounter,
			int nrOfCompletedInstances, int nrOfActiveInstances, int nrOfInstances) {
		if (LOGGER.isDebugEnabled()) {
			LOGGER.debug(
					"Multi-instance '{}' {}. Details: loopCounter={}, nrOrCompletedInstances={},nrOfActiveInstances={},nrOfInstances={}",
					execution.getActivity(), custom, loopCounter, nrOfCompletedInstances, nrOfActiveInstances,
					nrOfInstances);
		}
	}

	// Getters and Setters
	// ///////////////////////////////////////////////////////////

	public Expression getLoopCardinalityExpression() {
		return loopCardinalityExpression;
	}

	public void setLoopCardinalityExpression(Expression loopCardinalityExpression) {
		this.loopCardinalityExpression = loopCardinalityExpression;
	}

	public Expression getCompletionConditionExpression() {
		return completionConditionExpression;
	}

	public void setCompletionConditionExpression(Expression completionConditionExpression) {
		this.completionConditionExpression = completionConditionExpression;
	}

	public Expression getCollectionExpression() {
		return collectionExpression;
	}

	public void setCollectionExpression(Expression collectionExpression) {
		this.collectionExpression = collectionExpression;
	}

	public String getCollectionVariable() {
		return collectionVariable;
	}

	public void setCollectionVariable(String collectionVariable) {
		this.collectionVariable = collectionVariable;
	}

	public String getCollectionElementVariable() {
		return collectionElementVariable;
	}

	public void setCollectionElementVariable(String collectionElementVariable) {
		this.collectionElementVariable = collectionElementVariable;
	}

	public String getCollectionElementIndexVariable() {
		return collectionElementIndexVariable;
	}

	public void setCollectionElementIndexVariable(String collectionElementIndexVariable) {
		this.collectionElementIndexVariable = collectionElementIndexVariable;
	}

	public void setInnerActivityBehavior(AbstractBpmnActivityBehavior innerActivityBehavior) {
		this.innerActivityBehavior = innerActivityBehavior;
		this.innerActivityBehavior.setMultiInstanceActivityBehavior(this);
	}

	public AbstractBpmnActivityBehavior getInnerActivityBehavior() {
		return innerActivityBehavior;
	}

	/**
	 * ACT-1339. Calling ActivityEndListeners within an {@link AtomicOperation} so
	 * that an executionContext is present.
	 *
	 * @author Aris Tzoumas
	 * @author Joram Barrez
	 *
	 */
	private static final class CallActivityListenersOperation implements AtomicOperation {

		private List<ExecutionListener> listeners;

		private CallActivityListenersOperation(List<ExecutionListener> listeners) {
			this.listeners = listeners;
		}

		@Override
		public void execute(InterpretableExecution execution) {
			for (ExecutionListener executionListener : listeners) {
				try {
					Context.getProcessEngineConfiguration().getDelegateInterceptor()
							.handleInvocation(new ExecutionListenerInvocation(executionListener, execution));
				} catch (Exception e) {
					throw new ActivitiException("Couldn't execute listener", e);
				}
			}
		}

		@Override
		public boolean isAsync(InterpretableExecution execution) {
			return false;
		}
	}

	/**
	 * execution continuous multilevel task
	 * @param execution
	 * @param processInputModel
	 * @param nextActDefId
	 * @author hanj
	 *
	 */
	protected String exeContinuousMultilevelTask(ActivityExecution execution,ProcessInputModel processInputModel,String nextActDefId) {
		// 拒绝则终止连续多级审核
		if("false".equals(String.valueOf(execution.getVariable("auditResult")))) {
			return "EndEvent_1wqgipp";
		}
		DocShareStrategy docShareStrategy = null;
		try {
			// 获取环节策略配置，防止配置变更，保留版本逻辑
			docShareStrategy = (DocShareStrategy) execution.getVariable("docShareStrategy");
		} catch (Exception e) {
			LOGGER.error("exeContinuousMultilevelTask docShareStrategy get error", e);
		}
		if(null != docShareStrategy && "multilevel".equals(docShareStrategy.getStrategyType())) {
			// 获取当前环节实例缓存的连续多级审核员策略配置数据
			JSONArray json = (JSONArray) execution.getVariable("multilevelStrategyAssigneeList");
			String dealType = (String) execution.getVariable("dealType");
			List<ContivuousMultilevelDTO> multilevelStrategyAssigneeList = JSONUtil.toList(json, ContivuousMultilevelDTO.class);
			// 初始连续多级标识信息
			List<String> assigneeList = new ArrayList<>();
			String continuousMultilevel = (String) execution.getVariable("continuousMultilevel");
			execution.setVariable("multiLevelDescription", "");
			// 连续多级审核员策略配置数据为空，则正常构建连续多级审核任务参数，无匹配审核员后续走自动通过或自动拒绝
			if(null == multilevelStrategyAssigneeList || multilevelStrategyAssigneeList.size() == 0) {
				buildMultilevelTask(execution, processInputModel, String.valueOf(continuousMultilevel), nextActDefId);
				execution.setVariable("dealType", dealType);
				execution.setVariable("multilevelAssigneeList", assigneeList);
				return processInputModel.getWf_nextActDefId();
			}

			// 查询存在审核员的层级，设置审核员开始流程逐级审批
			List<ContivuousMultilevelDTO> multilevelStrategys = multilevelStrategyAssigneeList.stream()
					.sorted(Comparator.comparing(ContivuousMultilevelDTO::getLevel)).collect(Collectors.toList());
			for (ContivuousMultilevelDTO contivuousMultilevelDTO : multilevelStrategys) {
				if(Integer.valueOf(contivuousMultilevelDTO.getLevel()) > Integer.valueOf(continuousMultilevel) &&
						contivuousMultilevelDTO.getMultilevelAssigneeList().size() > 0) {
					String nextContinuousMultilevel = contivuousMultilevelDTO.getLevel();
					assigneeList = contivuousMultilevelDTO.getMultilevelAssigneeList();
					// 当同一审核员重复审核同一申请时，是否允许重复审核
					if("once".equals(docShareStrategy.getRepeatAuditType())) {
						filterMultilevelRepeatAuditor(execution, multilevelStrategys, continuousMultilevel, assigneeList);
					}
					if(assigneeList.size() == 0) {
						continue;
					}
					// 连续多级审核员策略配置数据不为空，则通过匹配级别找到级别对应的审核员，构建连续多级审核任务参数进行审批
					buildMultilevelTask(execution, processInputModel, nextContinuousMultilevel, nextActDefId);
					execution.setVariable("dealType", docShareStrategy.getAuditModel());
					execution.setVariable("multilevelAssigneeList", assigneeList);
					break;
				}
			}
		}
		return processInputModel.getWf_nextActDefId();
	}

	/**
	 * by hanj
	 * @param multilevelStrategys
	 * @param continuousMultilevel
	 * @param assigneeList
	 * @return
	 */
	public void filterMultilevelRepeatAuditor(ActivityExecution execution, List<ContivuousMultilevelDTO> multilevelStrategys, String continuousMultilevel,
			List<String> assigneeList) {
		HistoricTaskInstanceQueryImpl query = new HistoricTaskInstanceQueryImpl();
        query.processInstanceId(execution.getProcessInstanceId());
        List<HistoricTaskInstance> historyTasks = Context.getCommandContext().getHistoricTaskInstanceEntityManager()
                .findHistoricTaskInstancesByQueryCriteria(query);
		for (ContivuousMultilevelDTO contivuousMultilevelDTO : multilevelStrategys) {
			if(Integer.valueOf(contivuousMultilevelDTO.getLevel()) > Integer.valueOf(continuousMultilevel)) {
				continue;
			}
			// 连续多级审核员
			List<String> userIdList = contivuousMultilevelDTO.getMultilevelAssigneeList();
			// 加签审核员
			CountersignInfoService countersignInfoService = (CountersignInfoService) ApplicationContextHolder
					.getBean("countersignInfoService");
			List<CountersignInfo> countersignInfoList = countersignInfoService.list(new LambdaQueryWrapper<CountersignInfo>()
	                .eq(CountersignInfo::getProcInstId, execution.getProcessInstanceId()).orderByDesc(CountersignInfo::getBatch));
			List<String> countersignUserIdList = countersignInfoList.stream().map(CountersignInfo::getCountersignAuditor).collect(Collectors.toList());
			userIdList.addAll(countersignUserIdList);

			for(String userId : userIdList) {
				boolean isExist = historyTasks.stream().filter(his -> null != his.getAssignee() && his.getAssignee().equals(userId) && "completed".equals(his.getDeleteReason())).findAny().isPresent();
	            if(isExist && assigneeList.contains(userId)) {
	            	assigneeList.remove(userId);
	            }
			}
		}
	}

	/**
	 * by hanj
	 * @param execution
	 * @param processInputModel
	 * @param nextLevel
	 * @return
	 */
	protected void buildMultilevelTask(ActivityExecution execution, ProcessInputModel processInputModel,
			String nextLevel, String nextActDefId) {
		processInputModel.setWf_curActDefId(processInputModel.getWf_curActDefId());
		processInputModel.setWf_curActDefType(processInputModel.getWf_curActDefType());
		processInputModel.setWf_curActDefName(processInputModel.getWf_curActDefName());
		processInputModel.setWf_nextActDefId(processInputModel.getWf_curActDefId());
		processInputModel.setWf_nextActDefType(processInputModel.getWf_curActDefType());
		processInputModel.setWf_nextActDefName(processInputModel.getWf_curActDefName());
		processInputModel.setWf_webAutoQueryNextActFlag(false);
		execution.setVariable("continuousMultilevel", nextLevel);
		execution.setVariable("multiLevelDescription","multilevel");
		nextActDefId = processInputModel.getWf_curActDefId();
	}


	/**
	 * by lw
	 * @param execution
	 * @param processInputModel
	 * @param nextActDefId
	 * @return
	 */
	protected String autoExeNextTask(ActivityExecution execution,ProcessInputModel processInputModel,String nextActDefId) {
		DocShareStrategyService docShareStrategyService = (DocShareStrategyService) ApplicationContextHolder
				.getBean("docShareStrategyService");
		ExecuteActivityExecutor executeActivityExecutor = (ExecuteActivityExecutor) ApplicationContextHolder
				.getBean("execute_activity");
		processInputModel.setWf_nextActDefId(nextActDefId);
		String noAuditorType = null;
		DocShareStrategy docShareStrategy = null;
		// 连续多级使用原有配置，防止配置变更，保留版本逻辑
		String multiLevelDescription = (String) execution.getVariable("multiLevelDescription");
		try {
			Map<String, Object> fields = processInputModel.getFields();
			Integer docCsfLevel = Integer.valueOf(fields.get("docCsfLevel").toString());
			if(null != multiLevelDescription && "multilevel".equals(multiLevelDescription)) {
				docShareStrategy = (DocShareStrategy) execution.getVariable("docShareStrategy");
			}
			noAuditorType = docShareStrategyService.queryNoAuditorType(processInputModel.getWf_procDefId(), nextActDefId, docCsfLevel,
					processInputModel.getWf_starter(), processInputModel.getWf_procInstId(), docShareStrategy, fields);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return nextActDefId;
		}
		if(null != noAuditorType && noAuditorType.equals("auto_pass")){
			//记录自动执行的环节
			recordAutoTaskExtend(execution,processInputModel);
			//自动获取下一节点
			processInputModel.setWf_curActDefId(processInputModel.getWf_nextActDefId());
			processInputModel.setWf_curActDefType(processInputModel.getWf_nextActDefType());
			processInputModel.setWf_curActDefName(processInputModel.getWf_nextActDefName());
			processInputModel.setWf_nextActDefId(null);
			processInputModel.setWf_nextActDefType(null);
			processInputModel.setWf_nextActDefName(null);
			executeActivityExecutor.autoAct(processInputModel, null);
			processInputModel.setWf_webAutoQueryNextActFlag(false);
			autoExeNextTask( execution, processInputModel,processInputModel.getWf_nextActDefId()) ;
		} else	if(null != noAuditorType && noAuditorType.equals("auto_reject")){
			execution.setVariable("auto_reject","true");
			processInputModel.setWf_nextActDefId("EndEvent_1wqgipp");
			processInputModel.setWf_nextActDefName("流程结束");
			processInputModel.setWf_nextActDefType("endEvent");
			execution.setVariable("auditResult", false); // by ouandyang
			return processInputModel.getWf_nextActDefId();
		}/*
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
	private HistoricTaskInstanceEntity recordAutoTaskExtend(ActivityExecution execution,ProcessInputModel processInputModel) {
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
