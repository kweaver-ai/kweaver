package com.aishu.wf.core.engine.core.executor;

import java.util.HashMap;
import java.util.Map;

import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.core.cmd.DeleteMultiInstanceCmd;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 多实例（内嵌子例程）撤销执行类
 * @version:  1.0
 * @author lw 
 */
@Service(WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY)
public class DeleteMultiInstanceActivityExecutor  extends AbstractProcessExecutor  implements ProcessExecutor{

	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel)
			throws WorkFlowException {
		ProcessDefinition processDefinition=getProcessDefinition(processInputModel.getWf_procDefId());
		additionalProcessInputModel( processInputModel, processDefinition);
		ProcessInstance processInstance = getProcessInstance(processInputModel.getWf_procInstId());
		Map<String, Object> workflowMap = new HashMap<String, Object>();
		// 设置参数到引擎变量中
		workflowMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY,
				processInputModel);
		workflowMap.putAll(processInputModel.getWf_variables());
		Command<Void> deleteMultiInstanceCmd =null;
		if(processInstance.getId().equals(processInstance.getTopProcessInstanceId())){//多实例
			deleteMultiInstanceCmd = new DeleteMultiInstanceCmd(processInstance.getId(),processInputModel.getWf_nextActDefId(),processInputModel.getWf_curActInstId(),
					convertReceivers(processInputModel.getWf_receiver()), workflowMap, processInputModel.getWf_curComment());
		}else{//子流程
			/*
			 * deleteMultiInstanceCmd = new
			 * DeleteCallActivityCmd(processInstance.getId(),processInputModel.
			 * getWf_nextActDefId(),processInputModel.getWf_curActInstId(),
			 * convertReceivers(processInputModel.getWf_receiver()), workflowMap);
			 */
		}
		this.managementService.executeCommand(deleteMultiInstanceCmd);
		ProcessInstanceModel processInstanceModel = processInstanceModellBuilder
				.builderProcessInfo(processInputModel, processInstance,processDefinition);
		return processInstanceModel;
	}

}
