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

import org.activiti.engine.ActivitiException;
import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.delegate.BpmnError;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.impl.pvm.process.ActivityImpl;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.script.MultiTaskCompletionCondition;
import com.aishu.wf.core.engine.core.service.impl.TaskResourceService;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WfEngineUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;

/**
 * @author Joram Barrez
 * @author Falko Menge
 */
public class SequentialMultiInstanceBehavior extends MultiInstanceActivityBehavior {
	private static final long serialVersionUID = 1L;

	public SequentialMultiInstanceBehavior(ActivityImpl activity, AbstractBpmnActivityBehavior innerActivityBehavior) {
		super(activity, innerActivityBehavior);
	}

	/**
	 * Handles the sequential case of spawning the instances. Will only create one
	 * instance, since at most one instance can be active.
	 */
	protected void createInstances(ActivityExecution execution) throws Exception {
		// by lw
		setMutilAssignee(execution);
		int nrOfInstances = resolveNrOfInstances(execution);
		if (nrOfInstances < 0) {
			throw new ActivitiIllegalArgumentException(
					"Invalid number of instances: must be a non-negative integer value" + ", but was " + nrOfInstances);
		}

		setLoopVariable(execution, NUMBER_OF_INSTANCES, nrOfInstances);
		setLoopVariable(execution, NUMBER_OF_COMPLETED_INSTANCES, 0);
		setLoopVariable(execution, getCollectionElementIndexVariable(), 0);
		setLoopVariable(execution, NUMBER_OF_ACTIVE_INSTANCES, 1);
		logLoopDetails(execution, "initialized", 0, 0, 1, nrOfInstances);

		if (nrOfInstances > 0) {
			executeOriginalBehavior(execution, 0);
		}
	}

	/**
	 * Called when the wrapped {@link ActivityBehavior} calls the
	 * {@link AbstractBpmnActivityBehavior#leave(ActivityExecution)} method. Handles
	 * the completion of one instance, and executes the logic for the sequential
	 * behavior.
	 */
	public void leave(ActivityExecution execution) {
		int loopCounter = getLoopVariable(execution, getCollectionElementIndexVariable()) + 1;
		int nrOfInstances = getLoopVariable(execution, NUMBER_OF_INSTANCES);
		int nrOfCompletedInstances = getLoopVariable(execution, NUMBER_OF_COMPLETED_INSTANCES) + 1;
		int nrOfActiveInstances = getLoopVariable(execution, NUMBER_OF_ACTIVE_INSTANCES);

		setLoopVariable(execution, getCollectionElementIndexVariable(), loopCounter);
		setLoopVariable(execution, NUMBER_OF_COMPLETED_INSTANCES, nrOfCompletedInstances);
		logLoopDetails(execution, "instance completed", loopCounter, nrOfCompletedInstances, nrOfActiveInstances,
				nrOfInstances);
		boolean condition = completionCondition(execution);
		if (!condition && loopCounter != nrOfInstances) {
			callActivityEndListeners(execution);
		}

		if (condition || loopCounter >= nrOfInstances) {
			ProcessInputModel curProcessInputModel = WfEngineUtils.getWfprocessInputModel(execution.getVariables());
			/**
			 * by lw 多实例输出按前端指定下一环节跳转
			 */
			String nextActDefId = (String) Context.getCommandContext().getAttribute("nextActDefId");
			//自动执行逻辑
			autoExeNextTask(execution, curProcessInputModel, nextActDefId);
			nextActDefId=curProcessInputModel.getWf_nextActDefId();
			Context.getCommandContext().addAttribute("nextActDefId",nextActDefId);
			execution.setVariable(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, curProcessInputModel);
			execution.getParent().setVariable(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, curProcessInputModel);
			super.leave(execution);
		} else {
			try {
				executeOriginalBehavior(execution, loopCounter);
			} catch (BpmnError error) {
				// re-throw business fault so that it can be caught by an Error Intermediate
				// Event or Error Event Sub-Process in the process
				throw error;
			} catch (Exception e) {
				throw new ActivitiException("Could not execute inner activity behavior of multi instance behavior", e);
			}
		}
	}

	@Override
	public void execute(ActivityExecution execution) throws Exception {
		super.execute(execution);

		if (innerActivityBehavior instanceof SubProcessActivityBehavior) {
			// ACT-1185: end-event in subprocess may have inactivated execution
			if (!execution.isActive() && execution.isEnded()
					&& (execution.getExecutions() == null || execution.getExecutions().isEmpty())) {
				execution.setActive(true);
			}
		}
	}

	public boolean completionCondition(ActivityExecution execution) {
		MultiTaskCompletionCondition condition = (MultiTaskCompletionCondition) ApplicationContextHolder
				.getBean("multiTaskCompletionCondition");
		return condition.completionConditionByMultiTask(execution, execution.getVariables());
	}

	// by lw
	public void setMutilAssignee(ActivityExecution execution) throws Exception {
		// runtime change Behavior
		((ExecutionEntity) execution).setBusinessKey((String) execution.getActivity().getProperty("dealType"));
		if (execution.getVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST) == null) {
			TaskResourceService taskResourceService = (TaskResourceService) ApplicationContextHolder
					.getBean("taskResourceService");
			ProcessInputModel processInputModel = ProcessDefinitionUtils
					.getWfprocessInputModel((ExecutionEntity) execution);
			processInputModel.setWf_curActDefId(execution.getActivity().getId());
			execution.setVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST,
					taskResourceService.getNextActivityUser(processInputModel));
		}
	}

}
