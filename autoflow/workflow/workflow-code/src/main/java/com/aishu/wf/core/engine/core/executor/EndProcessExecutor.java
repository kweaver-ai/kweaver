package com.aishu.wf.core.engine.core.executor;

import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.core.cmd.EndProcessInstanceCmd;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 结束流程执行类
 * @version:  1.0
 * @author lw 
 */
@Service(WorkFlowContants.ACTION_TYPE_END_PROCESS)
public class EndProcessExecutor  extends AbstractProcessExecutor  implements ProcessExecutor{
	
	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel)
			throws WorkFlowException {
		if(processInputModel.getWf_sendUserId()!=null){
			identityService.setAuthenticatedUserId(processInputModel.getWf_sendUserId());
		}
		ProcessInstance processInstance=getProcessInstance(processInputModel.getWf_procInstId()) ;
		HistoricProcessInstance historicProcessInstance = getHisProcessInstance(processInputModel.getWf_procInstId());
		ProcessDefinition processDefinition = getProcessDefinition(processInstance.getProcessDefinitionId());
		Command<Void> endProcessInstanceCmd = new EndProcessInstanceCmd(processInstance, 
				processInputModel.getWf_sendUserId(), processInputModel.getWf_curComment(),
				processInputModel.getWf_commentDisplayArea());
		this.managementService.executeCommand(endProcessInstanceCmd);
		ProcessInstanceModel processInstanceModel = processInstanceModellBuilder
				.builderCancelProcess(processInputModel, processInstance,processDefinition);
		return processInstanceModel;
	}

}
