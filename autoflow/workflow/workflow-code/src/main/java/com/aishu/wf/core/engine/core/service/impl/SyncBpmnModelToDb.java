package com.aishu.wf.core.engine.core.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.CallActivity;
import org.activiti.bpmn.model.ExclusiveGateway;
import org.activiti.bpmn.model.FlowElement;
import org.activiti.bpmn.model.ManualTask;
import org.activiti.bpmn.model.Process;
import org.activiti.bpmn.model.ReceiveTask;
import org.activiti.bpmn.model.ScriptTask;
import org.activiti.bpmn.model.ServiceTask;
import org.activiti.bpmn.model.SubProcess;
import org.activiti.bpmn.model.UserTask;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.aishu.wf.core.common.util.BeanUtils;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ActivityInfoConfigManager;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.cmd.SetProcessDefinitionNameCmd;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(propagation = Propagation.SUPPORTS)
@Slf4j
public class SyncBpmnModelToDb {

	@Autowired
	private ProcessDefinitionService processDefinitionService;

	@Autowired
	private ActivityInfoConfigManager activityInfoConfigManager;

	@Autowired
	private ProcessInfoConfigManager processInfoConfigManager;

	@Autowired
	ActivityRuleManager activityRuleManager;

	@Autowired
	UserService userService;

	public boolean syncProcess(BpmnModel bpmnModel, ProcessDefinitionModel processDefinition,
			ProcessInfoConfig prevVersionProcessConfig, String typeName, String userId,String template) {
		ProcessInfoConfig processInfoConfig = processInfoConfigManager.getById(processDefinition.getProcDefId());
		ProcessInfoConfig addProcessInfoConfig = new ProcessInfoConfig();
		String newProcessDefName = bpmnModel.getProcesses().get(0).getName();
		//流程名称变更逻辑处理
		if (!newProcessDefName.equals(processDefinition.getProcDefName())) {
			activityInfoConfigManager.updateByProcessDefName(processDefinition.getProcDefId(), newProcessDefName);
			processDefinitionService.getManagementService().executeCommand(
					new SetProcessDefinitionNameCmd(processDefinition.getProcDefId(), newProcessDefName));
			processDefinition.setProcDefName(newProcessDefName);
		}
		// 待新增、更新的环节节点
		if (processInfoConfig == null) {
			if (prevVersionProcessConfig != null) {
				prevVersionProcessConfig.setLastUpdateTime(new Date());
				prevVersionProcessConfig.setCreateTime(new Date());
				BeanUtils.copyProperties(addProcessInfoConfig, prevVersionProcessConfig);
				addProcessInfoConfig.setProcessDefId(processDefinition.getProcDefId());
				addProcessInfoConfig.setProcessDefKey(processDefinition.getProcDefKey());
				addProcessInfoConfig.setProcessDefName(processDefinition.getProcDefName());
				addProcessInfoConfig.setDeploymentId(processDefinition.getDeploymentId());
				addProcessInfoConfig.setProcessVersion(processDefinition.getVersion());
				addProcessInfoConfig.setProcessTypeId(processDefinition.getCategory());
				addProcessInfoConfig.setProcessTypeName(typeName);
				addProcessInfoConfig.setRemark(processDefinition.getDescription());
				Date nowDate = new Date();
				addProcessInfoConfig.setCreateTime(nowDate);
				addProcessInfoConfig.setLastUpdateTime(nowDate);
				try {
					List<ActivityRule> activityRules = activityRuleManager
							.findActivityRules(prevVersionProcessConfig.getProcessDefId(), "");
					for (ActivityRule activityRule : activityRules) {
						activityRule.setProcDefId(processDefinition.getProcDefId());
						activityRuleManager.save(activityRule);
					}
				} catch (Exception e) {
					log.warn("sync ActivityRule error", e);
				}
			} else {
				addProcessInfoConfig = ProcessInfoConfig.build(processDefinition);
				addProcessInfoConfig.setProcessTypeName(typeName);
			}
			addProcessInfoConfig.setTemplate(template);
			addProcessInfoConfig.setCreateUser(userId);
			addProcessInfoConfig.setProcessStartIsshow("Y");
			addProcessInfoConfig.setProcessMgrState("UNRELEASE");
			addProcessInfoConfig.setProcessModelSyncState("Y");
			addProcessInfoConfig.setProcessMgrIsshow("Y");
			try {
				if(StrUtil.isNotBlank(userId)){
					User user = userService.getUserById(userId);
					if(null != user){
						addProcessInfoConfig.setCreateUserName(user.getUserName());
					}
				}
			} catch (Exception e) {
				log.warn("获取流程创建者信息失败userId=====", userId);
			}
			processInfoConfigManager.save(addProcessInfoConfig);
		} else {
			processInfoConfig.setLastUpdateTime(new Date());
			processInfoConfig.setProcessDefName(processDefinition.getProcDefName());
			processInfoConfig.setProcessVersion(processDefinition.getVersion());
			processInfoConfig.setDeploymentId(processDefinition.getDeploymentId());
			processInfoConfig.setRemark(processDefinition.getDescription());
			processInfoConfig.setProcessTypeId(processDefinition.getCategory());
			processInfoConfig.setProcessTypeName(typeName);
			processInfoConfig.setProcessDefKey(processDefinition.getProcDefKey());
			processInfoConfigManager.updateById(processInfoConfig);
		}
		return true;
	}

	public boolean syncActivity(BpmnModel bpmnModel, ProcessDefinitionModel processDefinition,
			ProcessInfoConfig prevVersionProcessConfig) {
		List<ActivityInfoConfig> activityInfoConfigs = activityInfoConfigManager
				.findActivityInfoConfigs(processDefinition.getProcDefId());
		// 待新增、更新的环节节点
		for (Process process : bpmnModel.getProcesses()) {

			List<FlowElement> allFlowElements = new ArrayList<FlowElement>();
			//递归找出所有流程环节,主要递归内部嵌套子流程
			addAllFlowElement((List<FlowElement>) process.getFlowElements(), allFlowElements);
			// 待新增、更新的环节节点
			syncActivityByAddOrUpdate(process.getName(), allFlowElements, activityInfoConfigs, processDefinition,
					prevVersionProcessConfig);
			// 待删除的环节节点
			syncActivityByDelete(activityInfoConfigs, allFlowElements);
		}
		return true;
	}

	private void syncActivityByDelete(List<ActivityInfoConfig> activityInfoConfigs, List<FlowElement> flowElements) {
		// 待删除的环节节点
		for (ActivityInfoConfig actInfoConfig : activityInfoConfigs) {
			int isDel = 0;
			for (FlowElement flowElement : flowElements) {
				//过滤掉不处理的任务节点
				if (this.isFilterTask(flowElement)) {
					continue;
				}
				if (flowElement.getId().equalsIgnoreCase(actInfoConfig.getActivityDefId())) {
					// isDel=0时表示未查询到actInfoConfig,执行删除操作
					isDel++;
					break;
				}
			}
			if (isDel == 0) {
				activityInfoConfigManager.remove(actInfoConfig.getProcessDefId(), actInfoConfig.getActivityDefId());
			}
		}
	}

	private void addAllFlowElement(List<FlowElement> flowElements, List<FlowElement> allFlowElements) {
		for (FlowElement flowElement : flowElements) {
			//过滤掉不处理的任务节点
			if (this.isFilterTask(flowElement)) {
				continue;
			}
			if (SubProcess.class.isInstance(flowElement)) {
				addAllFlowElement((ArrayList<FlowElement>) ((SubProcess) flowElement).getFlowElements(),
						allFlowElements);
				continue;
			}
			allFlowElements.add(flowElement);
		}
	}

	private void syncActivityByAddOrUpdate(String processName, List<FlowElement> flowElements,
			List<ActivityInfoConfig> activityInfoConfigs, ProcessDefinitionModel processDefinition,
			ProcessInfoConfig prevVersionProcessConfig) {
		int actOrder = 1;
		for (FlowElement flowElement : flowElements) {
			//过滤掉不处理的任务节点
			if (this.isFilterTask(flowElement)) {
				continue;
			}
			// Task task = (Task) flowElement;
			String flowElementId = flowElement.getId();
			String flowElementName = flowElement.getName();
			// 更新标记
			int isUpdate = 0;
			ActivityInfoConfig updateActInfoConfig = null;
			for (ActivityInfoConfig actInfoConfig : activityInfoConfigs) {
				if (flowElementId.equalsIgnoreCase(actInfoConfig.getActivityDefId())) {
					// isUpdate>0说明查询到actInfoConfig,执行更新操作,否则执行新增操作
					isUpdate++;
					updateActInfoConfig = actInfoConfig;
					break;
				}
			}
			if (isUpdate > 0) {
				ActivityInfoConfig.buildUpdate(flowElement, updateActInfoConfig);
				ActivityInfoConfig params = new ActivityInfoConfig();
				params.setActivityDefId(updateActInfoConfig.getActivityDefId());
				params.setProcessDefId(updateActInfoConfig.getProcessDefId());
				QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(params);
				activityInfoConfigManager.update(updateActInfoConfig, queryWrapper);
				// updateActInfoConfigs.add(temepActInfoConfig);
			} else {
				// 暂时只新增流程定义ID和名称、环节ID和名称
				ActivityInfoConfig addActInfoConfig = null;
				if (prevVersionProcessConfig != null) {
					ActivityInfoConfig prevVesionActivityInfoConfig = activityInfoConfigManager
							.getActivityInfoConfig(prevVersionProcessConfig.getProcessDefId(), flowElementId);
					if (prevVesionActivityInfoConfig != null) {
						addActInfoConfig = prevVesionActivityInfoConfig;
						addActInfoConfig.setActivityDefDealType(ProcessModelUtils.getActDealType(flowElement));
						addActInfoConfig.setProcessDefId(processDefinition.getProcDefId());
						addActInfoConfig.setProcessDefName(processName);
						addActInfoConfig.setActivityDefId(flowElementId);
						addActInfoConfig.setActivityDefName(flowElementName);
					}
				}
				if (addActInfoConfig == null) {
					addActInfoConfig = ActivityInfoConfig.build(flowElement, processDefinition.getProcDefId(),
							processName);
				}
				if (addActInfoConfig.getActivityOrder() == null) {
					addActInfoConfig.setActivityOrder(actOrder);
				}
				activityInfoConfigManager.save(addActInfoConfig);
				actOrder++;
			}
		}

	}
	
	  /**
     * 过滤掉不处理的任务节点
     *
     * @param flowElement
     * @return
     */
    private boolean isFilterTask(FlowElement flowElement) {
        if (!ExclusiveGateway.class.isInstance(flowElement)
                && !UserTask.class.isInstance(flowElement)
                && !SubProcess.class.isInstance(flowElement)
                && !ScriptTask.class.isInstance(flowElement)
                && !ServiceTask.class.isInstance(flowElement)
                && !CallActivity.class.isInstance(flowElement)
                && !ReceiveTask.class.isInstance(flowElement)
                && !ManualTask.class.isInstance(flowElement)) {
            return true;
        }
        return false;
    }

}
