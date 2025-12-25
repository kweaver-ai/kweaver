package com.aishu.wf.core.engine.core.executor;

import java.util.HashMap;
import java.util.Map;

import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 暂存活动(包含新建暂存、待办暂存逻辑)执行类
 * @version:  1.0
 * @author lw 
 */
@Service(WorkFlowContants.ACTION_TYPE_SAVE_ACTIVITY)
public class SaveActivityExecutor  extends AbstractProcessExecutor  implements ProcessExecutor{

	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel) throws WorkFlowException {
		Map<String, Object> workflowMap = new HashMap<String, Object>();
		ProcessDefinition processDefinition = getProcessDefinitionByKey(processInputModel.getWf_procDefKey());
		additionalProcessInputModel(processInputModel, processDefinition);
		processInputModel.setWf_starter(processInputModel.getWf_sender());
		// 设置参数到引擎变量中
		workflowMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, processInputModel);
		String sender = processInputModel.getWf_sender();
		// 设置流程发起人
		identityService.setAuthenticatedUserId(processInputModel.getWf_sender());
		// ----------------------------------
		ProcessInstanceModel processInstanceModel = null;
		ProcessInstance processInstance = null;
		// 新建暂存
		if (StringUtils.isEmpty(processInputModel.getWf_curActInstId())
				|| StringUtils.isEmpty(processInputModel.getWf_procInstId())) {
			processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_LAUCH_SAVE_PROCESS);
			if (StringUtils.isEmpty(processInputModel.getWf_receiver())) {
				processInputModel.setWf_webAutoQueryNextUserFlag(true);
			}else {
				// 起草流程特殊处理
				processInputModel.setWf_receiver(sender);
			}
			// 启动流程
			processInstance = this.runtimeService.startProcessInstanceById(processInputModel.getWf_procDefId(),
					processInputModel.getWf_businessKey(), workflowMap);
		} else {// 待办暂存
			// 查询流程
			processInstance = getProcessInstance(processInputModel.getWf_procInstId());
		}
		processInstanceModel = processInstanceModellBuilder.builderProcessInfo(processInputModel,
				processInstance,processDefinition);
		
		return processInstanceModel;
	}


}
