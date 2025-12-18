package com.aishu.wf.core.engine.core.model;

import java.util.Date;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import javax.annotation.Resource;

import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.core.model.cache.TaskEntityDataShare;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
/**
 * 流程实例构造类
 * 
 * @version: 1.0
 * @author lw
 */
@Service
public class ProcessInstanceModellBuilder extends AbstractServiceHelper {
	
	@Resource(name="processInstanceServiceImpl")
    ProcessInstanceService processInstanceService;
	@Resource(name="processDefinitionServiceImpl")
    ProcessDefinitionService processDefinitionService;
	
	/**
	 * 构建发起流程对象-接口返回
	 * @param processInputModel
	 * @param processDefinition
	 * @param processInstance
	 * @return
	 */
	public ProcessInstanceModel builderProcessInfo(ProcessInputModel processInputModel,ProcessInstance processInstance,ProcessDefinition processDefinition) {
		ExecutionEntity executionEntity = (org.activiti.engine.impl.persistence.entity.ExecutionEntity) processInstance;
		ProcessInstanceModel processInfo = ProcessInstanceModel.build(executionEntity);
		processInfo.processInputModel = processInputModel;
		// 构建待办环节
		if (!(WorkFlowContants.ACTION_TYPE_CANCEL_PROCESS.equals(processInputModel.getWf_actionType())
				|| WorkFlowContants.ACTION_TYPE_SAVE_ACTIVITY.equals(processInputModel.getWf_actionType()))) {
			processInfo.nextActivity = new CopyOnWriteArrayList<>(TaskEntityDataShare.getTask());
			List<ActivityInstanceModel> hisTasks=new CopyOnWriteArrayList<>(TaskEntityDataShare.getHisTask());
			processInfo.currentActivity = hisTasks.isEmpty()?null:hisTasks.get(0);
			TaskEntityDataShare.clear();
		}
		processInfo.setProcessDefinition(ProcessDefinitionModel.build(processDefinition));
		return processInfo;
	}
	
	/**
	 * 构建作废流程对象-接口返回
	 * @param processInputModel
	 * @param processDefinition
	 * @param processInstance
	 * @return
	 */
	public ProcessInstanceModel builderCancelProcess(ProcessInputModel processInputModel, ProcessInstance processInstance,ProcessDefinition processDefinition) {
		ExecutionEntity executionEntity = (org.activiti.engine.impl.persistence.entity.ExecutionEntity) processInstance;
		ProcessInstanceModel processInfo = ProcessInstanceModel.build(executionEntity);
		processInfo.setFinishTime(new Date());
		processInfo.setProcState(String.valueOf(SuspensionState.CANCELED.getStateCode()));
		processInfo.processInputModel = processInputModel;
		processInfo.setProcessDefinition(ProcessDefinitionModel.build(processDefinition));
		return processInfo;
	}
	/**
	 * 构建运行中流程对象-接口返回
	 * @param processInputModel
	 * @param processDefinition
	 * @param processInstance
	 * @return
	 */
	public ProcessInstanceModel builderProcessInfo(ProcessInputModel processInputModel,HistoricProcessInstance processInstance,ProcessDefinition processDefinition) {
		ProcessInstanceModel processInfo = ProcessInstanceModel.build(processInstance);
		processInfo.processInputModel = processInputModel;
		// 构建待办环节
		if (!(WorkFlowContants.ACTION_TYPE_CANCEL_PROCESS.equals(processInputModel.getWf_actionType())
				|| WorkFlowContants.ACTION_TYPE_SAVE_ACTIVITY.equals(processInputModel.getWf_actionType()))) {
			processInfo.nextActivity = new CopyOnWriteArrayList<>(TaskEntityDataShare.getTask());
			List<ActivityInstanceModel> hisTasks=new CopyOnWriteArrayList<>(TaskEntityDataShare.getHisTask());
			processInfo.currentActivity = hisTasks.isEmpty()?null:hisTasks.get(0);
			TaskEntityDataShare.clear();
		}
		processInfo.setProcessDefinition(ProcessDefinitionModel.build(processDefinition));
		return processInfo;
	}
	
}
