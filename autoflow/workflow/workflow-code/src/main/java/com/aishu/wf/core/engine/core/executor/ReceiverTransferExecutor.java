package com.aishu.wf.core.engine.core.executor;

import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

import lombok.extern.slf4j.Slf4j;
/**
 * 转办处理类
 * @version:  1.0
 * @author lw
 */
@Service(WorkFlowContants.ACTION_TYPE_RECEIVER_TRANSFER)
@Slf4j
public class ReceiverTransferExecutor extends AbstractProcessExecutor implements ProcessExecutor{
	@Autowired
	ExecuteActivityExecutor executeActivityExecutor;
	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel) throws WorkFlowException {
		if (processInputModel.getWf_receiver().contains(",")) {
			throw new WorkFlowException(ExceptionErrorCode.B2056, String.format("转办任务不允许有多个接收人！任务实例ID[%s],接收人[%s]",
					processInputModel.getWf_curActInstId(), processInputModel.getWf_receiver()));
		} else if (StringUtils.isEmpty(processInputModel.getWf_receiver())) {
			throw new WorkFlowException(ExceptionErrorCode.B2054, String.format("接收人为空！任务实例ID[%s],接收人[%s]",
					processInputModel.getWf_curActInstId(), processInputModel.getWf_receiver()));
		}
		validateProcessInputModel(processInputModel);
		ProcessDefinition processDefinition = getProcessDefinition(processInputModel.getWf_procDefId());
		ProcessInstance processInstance = getProcessInstance(processInputModel.getWf_procInstId());

		additionalProcessInputModel(processInputModel, processDefinition);
		// ----------------------------------
		// 根据wfCurActInstId获取当前任务实例
		Task task = this.findTaskById(processInputModel.getWf_curActInstId());

		if (processInputModel.getWf_sender() != null) {
			identityService.setAuthenticatedUserId(processInputModel.getWf_sender());
		}
		ProcessInstanceModel processInstanceModel = null;
		try {
			String receiver =processInputModel.getWf_receiver();
			// 将当前待办的接收人修改最新的receiver
			this.taskService.setAssignee(task.getId(), receiver, true);
			processInstanceModel = processInstanceModellBuilder.builderProcessInfo(processInputModel,
					processInstance,processDefinition);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,
					String.format("流程执行失败,task[%s],processInputModel[%s]", task, processInputModel), e);
		}
		// by siyu.chen 2023/8/11 Not logging, which will result in comments not being updated after approval
		// if (StringUtils.isNotBlank(processInputModel.getWf_curComment())) {
		// 	taskService.addComment(task.getId(), task.getProcessInstanceId(), "transfer_comment",
		// 			processInputModel.getWf_curComment(), "");
		// }
		try {
			ProcessInputModel tempProcessInputModel = (ProcessInputModel) processInstanceService
					.getTaskVariables(task.getId()).get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
			tempProcessInputModel.setWf_receiver(processInputModel.getWf_receiver());
			ProcessDefinitionUtils.convertWf_receiver(processInputModel);
			tempProcessInputModel.setWf_receivers(processInputModel.getWf_receivers());
			this.runtimeService.setVariableLocal(task.getProcessInstanceId(),  WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY,
			tempProcessInputModel);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,
					String.format("流程转办失败,task[%s],processInputModel[%s]", task, processInputModel), e);
		}
		// 设置返回参数
		return processInstanceModel;
	}
}
