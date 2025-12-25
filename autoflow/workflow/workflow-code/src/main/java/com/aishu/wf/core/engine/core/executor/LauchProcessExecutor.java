package com.aishu.wf.core.engine.core.executor;

import java.util.HashMap;
import java.util.Map;

import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.stereotype.Service;
/**
 * 新建流程执行类
 * @version:  1.0
 * @author lw 
 */
@Service(WorkFlowContants.ACTION_TYPE_LAUCH_PROCESS)
public class LauchProcessExecutor extends AbstractProcessExecutor implements ProcessExecutor{
	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel)
			throws WorkFlowException {

		validateProcessInputModel(processInputModel);
		ProcessDefinition processDefinition = getProcessDefinition(processInputModel.getWf_procDefId());
		additionalProcessInputModel(processInputModel, processDefinition);
		processInputModel.setWf_starter(processInputModel.getWf_sender());
		Map<String, Object> workflowMap = new HashMap<String, Object>();
		workflowMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY,
				processInputModel);
		String receiver = processInputModel.getWf_receiver();
		String sender = processInputModel.getWf_sender();
		// 设置流程发起人
		identityService
				.setAuthenticatedUserId(processInputModel.getWf_sender());
		// 起草流程特殊处理
		processInputModel.setWf_receiver(sender);
		// 启动流程
		ProcessInstance processInstance = runtimeService
				.startProcessInstanceById(processInputModel.getWf_procDefId(),
						processInputModel.getWf_businessKey(), workflowMap);
		// 根据sender获取起草环节的任务
		Task task = this.findTaskByAssignee(processInstance.getId(), sender);
		// 起草有点特殊,有2条数据
		processInputModel.setWf_receiver(receiver);
		processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_EXECUTE_ACTIVITY);
		autoAct(processInputModel,workflowMap);
		autoUser(processInputModel,workflowMap);
		// 完成当前任务并触发下一步任务
		ProcessTransitionFreeService baseWfService = new ProcessTransitionFreeService(
				processEngineConfiguration);

		ProcessInstanceModel processInstanceModel = null;
		try {
			// 完成任务后做一些业务逻辑
			if (StringUtils.isNotBlank(processInputModel.getWf_curComment())) {
				taskService.addComment(task.getId(),
						task.getProcessInstanceId(),
						processInputModel.getWf_curComment(),"");
			}
			baseWfService.commitProcess(task.getId(),
						processInputModel.getWf_nextActDefId(), workflowMap);
			processInstanceModel = processInstanceModellBuilder
					.builderProcessInfo(processInputModel,
							processInstance,processDefinition);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,String.format(
					"流程发起失败,task[%s],processInputModel[%s]", task,
					processInputModel), e);
		}
		// 设置返回参数
		return processInstanceModel;

	}

}
