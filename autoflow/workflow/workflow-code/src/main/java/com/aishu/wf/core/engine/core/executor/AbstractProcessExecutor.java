package com.aishu.wf.core.engine.core.executor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.task.Task;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModellBuilder;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 流程执行基类类
 * 
 * @version: 1.0
 * @author lw
 */
@Service
public abstract class AbstractProcessExecutor extends AbstractServiceHelper {
	@Resource(name = "processConfigServiceImpl")
    ProcessConfigService processConfigService;
	@Resource(name = "processDefinitionServiceImpl")
    ProcessDefinitionService processDefinitionService;
	@Resource(name = "processInstanceServiceImpl")
    ProcessInstanceService processInstanceService;
	@Autowired
	UserService userService;
	@Autowired
	OrgService orgService;
	@Resource(name = "processInstanceModellBuilder")
	ProcessInstanceModellBuilder processInstanceModellBuilder;

	/**
	 * 验证前端传入流程参数
	 * 
	 * @param processInputModel
	 * @throws WorkFlowException
	 */
	protected void validateProcessInputModel(ProcessInputModel processInputModel) throws WorkFlowException {
		if (processInputModel == null) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "流程输入参数对象{processInputModel}不能为空");
		}
		if (StringUtils.isEmpty(processInputModel.getWf_sendUserId())) {
			throw new WorkFlowException(ExceptionErrorCode.B2001,
					String.format("流程输入参数{发送人:wf_sendUserId}不能为空,processInputModel[%s]", processInputModel));
		} else if (StringUtils.isEmpty(processInputModel.getWf_curActInstId())) {
			throw new WorkFlowException(ExceptionErrorCode.B2001,
					String.format("流程输入参数{环节实例ID:wf_curActInstId()}不能为空,processInputModel[%s]", processInputModel));
		}
	}

	

	
	
	/**
	 * 补全前端传入的参数
	 * 
	 * @param processInputModel
	 * @param processDefinition
	 * @throws WorkFlowException
	 */
	protected void additionalProcessInputModel(ProcessInputModel processInputModel, ProcessDefinition processDefinition)
			throws WorkFlowException {
		processInputModel.setWf_procDefId(processDefinition.getId());
		processInputModel.setWf_procDefKey(processDefinition.getKey());
		processInputModel.setWf_procDefName(processDefinition.getName());
		processInputModel.setWf_appId(processDefinition.getTenantId());
		processInputModel.setWf_sender(processInputModel.getWf_sendUserId());
		if (processInputModel.getWf_businessDataObject() != null) {
			processInputModel.getWf_variables().put(WorkFlowContants.WF_BUSINESS_DATA_OBJECT_KEY,
					processInputModel.getWf_businessDataObject());
		}
		if (processInputModel.getWf_throughBizDataObject() != null) {
			processInputModel.getWf_variables().put(WorkFlowContants.WF_THROUGH_BUSINESS_DATA_OBJECT_KEY,
					processInputModel.getWf_throughBizDataObject());
		}

	}
	
	/**
	 * 补全前端传入的参数
	 * 
	 * @param processInputModel
	 * @param processDefinition
	 * @throws WorkFlowException
	 */
	protected void additionalProcessInputModel(ProcessInputModel processInputModel,Task task)
			throws WorkFlowException {
		processInputModel.setWf_procInstId(task.getProcessInstanceId());
		processInputModel.setWf_procDefId(task.getProcessDefinitionId());
		processInputModel.setWf_procDefName(task.getProcessDefinitionName());
		processInputModel.setWf_appId(task.getTenantId());
		processInputModel.setWf_curActDefId(task.getTaskDefinitionKey());
		ActivityDefinitionModel curActModel = this.processDefinitionService.getActivity(processInputModel.getWf_procDefId(),
				processInputModel.getWf_curActDefId());
		if (curActModel == null) {
			throw new RestException(ExceptionErrorCode.B2003.name(), "current activity definition not found, procid="
					+ processInputModel.getWf_procDefId() + ",actid=" + processInputModel.getWf_curActDefId());
		} else {
			processInputModel.setWf_curActDefName(curActModel.getActDefName());
			processInputModel.setWf_curActDefType(curActModel.getActType());
		}
		if (!StringUtils.isEmpty(processInputModel.getWf_nextActDefId())) {
			ActivityDefinitionModel destActModel = processDefinitionService.getActivity(processInputModel.getWf_procDefId(),
					processInputModel.getWf_nextActDefId());
			processInputModel.setWf_nextActDefName(destActModel.getActDefName());
			processInputModel.setWf_nextActDefType(destActModel.getActType());
		}

	}

	protected void autoSetNextActDefId(ProcessInputModel processInputModel, Map<String, Object> workflowMap)
			throws WorkFlowException {
		// 必须没有选择下一步环节
		if (StringUtils.isNotBlank(processInputModel.getWf_nextActDefId())) {
			return;
		}
		Map<String, Object> copyMap = new HashMap<String, Object>();
		copyMap.putAll(processInputModel.getFields());
		copyMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, processInputModel);
		// 自动查询下一环节
		List<ActivityDefinitionModel> activityDefinitionModels = processDefinitionService.getNextActivity(
				processInputModel.getWf_procInstId(), processInputModel.getWf_procDefId(),
				processInputModel.getWf_curActDefId(), copyMap);
		if (activityDefinitionModels == null || activityDefinitionModels.isEmpty()) {
			throw new WorkFlowException(ExceptionErrorCode.B2005,
					String.format("无法找到当前环节输出环节,流程流转失败,processInputModel[%s]", processInputModel));
		}
		ActivityDefinitionModel activityDefinitionModel = activityDefinitionModels.get(0);
		processInputModel.setWf_nextActDefId(activityDefinitionModel.getActDefId());
		processInputModel.setWf_nextActDefType(activityDefinitionModel.getActType());
		processInputModel.setWf_nextActDefName(activityDefinitionModel.getActDefName());
	}
	
	public void autoAct(ProcessInputModel processInputModel,Map workflowMap) {
		// 下一步环节为空时,根据规则自动查询出下一步环节
		if (StringUtils.isEmpty(processInputModel.getWf_nextActDefId())) {
			autoSetNextActDefId(processInputModel,workflowMap);
			processInputModel.setWf_webAutoQueryNextActFlag(true);
		}
		
	}
	
	public void autoUser(ProcessInputModel processInputModel,Map workflowMap) {
		if (StringUtils.isNotBlank(processInputModel.getWf_receiver())) {
			// 处理下一环节为多实例
			if (ProcessDefinitionUtils.isMultiInstance(processInputModel,
					repositoryService)) {
				List<String> receiverList = convertReceivers(processInputModel
						.getWf_receiver());
				workflowMap.put(WorkFlowContants.ELEMENT_ASSIGNEE_LIST,
						receiverList);
			}
		} else if (ProcessDefinitionUtils.isUserTask(processInputModel)
				|| BpmnXMLConstants.ELEMENT_TASK_SERVICE
						.equals(processInputModel.getWf_nextActDefType())) {
			// 下一步人员为空,自动路由到环节绑定的资源中的最前一个人
			List<ActivityResourceModel> users = processDefinitionService
					.getActivityUserTree("",
							processInputModel.getWf_procDefId(), null,
							processInputModel.getWf_curActDefId(),
							processInputModel.getWf_nextActDefId(),
							processInputModel.getWf_sendUserId(),
							processInputModel.getWf_sendUserOrgId(), null,
							workflowMap);
			processInputModel.setWf_receiver(getTreeNodeOneUser(users));
			processInputModel.setWf_webAutoQueryNextUserFlag(true);
		}
	}
	

	protected List<String> convertReceivers(String receiver) {
		if (StringUtils.isBlank(receiver)) {
			throw new WorkFlowException(ExceptionErrorCode.B2062, "receiver不能为空");
		}
		String[] receiverArray;
		if (receiver.contains(",")) {
			receiverArray = receiver.split(",");
		} else {
			receiverArray = new String[] { receiver };
		}
		List<String> receiverList = new ArrayList<>(receiverArray.length);
		CollectionUtils.addAll(receiverList, receiverArray);
		return receiverList;
	}

	protected List<String> convertReceivers(List<ActivityResourceModel> users) {
		List<String> receivers = new ArrayList<>();
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				receivers.add(treeNode.getRealId());
			}
		}
		return receivers;
	}

	protected String getTreeNodeOneUser(List<ActivityResourceModel> users) {
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				return treeNode.getRealId();
			}
		}
		return "";
	}

	protected String getTreeNodeUser(List<ActivityResourceModel> users) {
		String userStrs = "";
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				userStrs += treeNode.getRealId() + ",";
			}
		}
		return userStrs.substring(0, userStrs.lastIndexOf(",") - 1);
	}
}
