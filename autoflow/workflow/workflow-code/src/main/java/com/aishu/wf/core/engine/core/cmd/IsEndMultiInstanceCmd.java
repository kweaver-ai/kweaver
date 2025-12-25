package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;
import java.util.List;

import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;


/**
 * 判断是否最后一条多实例执行
 * @author lw
 * @version 1.0
 * @created 07-四月-2013 15:39:01
 */
public class IsEndMultiInstanceCmd implements Command<Boolean>, Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	protected String executionId;
	protected String processInstanceId;


	public IsEndMultiInstanceCmd(String processInstanceId, String executionId) {
		this.processInstanceId = processInstanceId;
		this.executionId = executionId;
	}

	public Boolean execute(CommandContext commandContext) {
		Integer nrOfInstances=null;
		Integer nrOfActiveInstances=null;
		Integer nrOfCompletedInstances=null;
        List<HistoricVariableInstance> list = commandContext.getProcessEngineConfiguration().getHistoryService().createHistoricVariableInstanceQuery().excludeTaskVariables().processInstanceId(processInstanceId).list();
		for (HistoricVariableInstance var : list) {
			if (var.getVariableName().equals("nrOfInstances")) {
				nrOfInstances = (Integer) var.getValue();
			} else if (var.getVariableName().equals("nrOfActiveInstances")) {
				nrOfActiveInstances = (Integer) var.getValue();
			} else if (var.getVariableName().equals("nrOfCompletedInstances")) {
				nrOfCompletedInstances = (Integer) var.getValue();
			}
		}
		if(nrOfInstances == null || nrOfActiveInstances == null && nrOfCompletedInstances == null){
			return false;
		}
		if(nrOfInstances.intValue() == nrOfCompletedInstances.intValue() && nrOfActiveInstances == 0){
			return true;
		}
		return false;
	}

}
