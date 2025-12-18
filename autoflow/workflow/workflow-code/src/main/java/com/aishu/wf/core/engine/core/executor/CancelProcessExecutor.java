package com.aishu.wf.core.engine.core.executor;

import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.core.cmd.CancelProcessInstanceCmd;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 作废流程执行类
 * @version:  1.0
 * @author lw 
 */
@Service(WorkFlowContants.ACTION_TYPE_CANCEL_PROCESS)
public class CancelProcessExecutor  extends AbstractProcessExecutor  implements ProcessExecutor{
	
	@Override
	public ProcessInstanceModel execute(ProcessInputModel processInputModel)
			throws WorkFlowException {
		if(processInputModel.getWf_sender()!=null){
			identityService.setAuthenticatedUserId(processInputModel.getWf_sender());
		}
		ProcessInstance processInstance=getProcessInstance(processInputModel.getWf_procInstId()) ;
		HistoricProcessInstance historicProcessInstance = getHisProcessInstance(processInputModel.getWf_procInstId());
		/*
		 * if(!historicProcessInstance.getStartUserId().equals(processInputModel.
		 * getWf_sender())) { throw new WorkFlowException(ExceptionErrorCode.B2001,
		 * "流程作废必须是发起人"); }
		 */
		ProcessDefinition processDefinition = getProcessDefinition(processInstance.getProcessDefinitionId());
		Command<Void> cancelProcessInstanceCmd = new CancelProcessInstanceCmd(processInstance, processInputModel.getWf_curComment());
		this.managementService.executeCommand(cancelProcessInstanceCmd);
		ProcessInstanceModel processInstanceModel = processInstanceModellBuilder
				.builderCancelProcess(processInputModel, processInstance,processDefinition);
		return processInstanceModel;
	}

}
