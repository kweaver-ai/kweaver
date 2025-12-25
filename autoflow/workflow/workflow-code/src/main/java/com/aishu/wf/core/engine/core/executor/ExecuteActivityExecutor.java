package com.aishu.wf.core.engine.core.executor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.task.Task;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 流程流转(执行下一步活动)执行类
 * 
 * @version: 1.0
 * @author lw
 */
@Service(WorkFlowContants.ACTION_TYPE_EXECUTE_ACTIVITY)
public class ExecuteActivityExecutor extends AbstractProcessExecutor implements
		ProcessExecutor {
	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel) throws WorkFlowException {
		validateProcessInputModel(processInputModel);
		// 根据wfCurActInstId获取当前任务实例
		Task task = findTaskById(processInputModel.getWf_curActInstId());
		ProcessDefinition processDefinition = getProcessDefinition(task.getProcessDefinitionId());
		additionalProcessInputModel(processInputModel, task);
		Map<String, Object> workflowMap = new HashMap<String, Object>();
		workflowMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY,
				processInputModel);
		identityService.setAuthenticatedUserId(processInputModel.getWf_sender());
		// 下一步环节为空时,根据规则自动查询出下一步环节
		if (StringUtils.isEmpty(processInputModel.getWf_nextActDefId())) {
			autoSetNextActDefId(processInputModel, workflowMap);
			processInputModel.setWf_webAutoQueryNextActFlag(true);
		}
		if ((ProcessDefinitionUtils.isUserTask(processInputModel)
				&& !ProcessDefinitionUtils.isMultiInstance(processInputModel, repositoryService))
				|| BpmnXMLConstants.ELEMENT_TASK_SERVICE.equals(processInputModel.getWf_nextActDefType())) {
			// 下一步人员为空,自动路由到环节绑定的资源中的最前一个人
			List<ActivityResourceModel> users = processDefinitionService.getActivityUserTree(
					processInputModel.getWf_procInstId(), processInputModel.getWf_procDefId(), task.getId(),
					processInputModel.getWf_curActDefId(), processInputModel.getWf_nextActDefId(),
					processInputModel.getWf_sendUserId(), processInputModel.getWf_sendUserOrgId(), null, workflowMap);
			processInputModel.setWf_receiver(getTreeNodeOneUser(users));
			processInputModel.setWf_webAutoQueryNextUserFlag(true);
		}
		// }
		// 完成当前任务并触发下一步任务
		ProcessTransitionFreeService baseWfService = new ProcessTransitionFreeService(processEngineConfiguration);
		ProcessInstanceModel processInstanceModel = null;
		try {
			// 完成任务后做一些业务逻辑
			if (StringUtils.isNotBlank(processInputModel.getWf_commentDisplayArea())) {
				taskService.addComment(task.getId(), task.getProcessInstanceId(), processInputModel.getWf_curComment(),
						processInputModel.getWf_commentDisplayArea());
			}
			baseWfService.commitProcess(task.getId(), processInputModel.getWf_nextActDefId(), workflowMap);
			HistoricProcessInstance processInstance = getHisProcessInstance(processInputModel.getWf_procInstId());
			processInstanceModel = processInstanceModellBuilder.builderProcessInfo(processInputModel, processInstance,
					processDefinition);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,
					String.format("流程执行失败,task[%s],processInputModel[%s]", task, processInputModel), e);
		}
		// 设置返回参数
		return processInstanceModel;
	}

}
