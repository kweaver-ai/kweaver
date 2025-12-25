package com.aishu.wf.core.engine.core.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.bpmn.model.SubProcess;
import org.activiti.engine.delegate.Expression;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.NativeHistoricTaskInstanceQueryImpl;
import org.activiti.engine.impl.bpmn.helper.ClassDelegate;
import org.activiti.engine.impl.bpmn.parser.FieldDeclaration;
import org.activiti.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.ReadOnlyProcessDefinition;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.ProcessDefinitionImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.activiti.engine.impl.task.TaskDefinition;
import org.activiti.engine.task.Task;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.script.GroovyScriptEngine;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessModelService;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.util.ComparatorActivityResource;
import com.aishu.wf.core.engine.util.ComparatorTransition;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.aishu.wf.core.engine.util.RedisUtil;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.aishu.wf.core.engine.util.cache.MyProcessDefinitionCache;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ProcessDefinitionResource extends AbstractServiceHelper {

	@Autowired
	ActivityRuleManager activityRuleManager;

	@Autowired
	private OrgService orgService;

	@Autowired
	private UserService userService;

	@Autowired
	private GroovyScriptEngine groovyScriptEngine;

	@Autowired
	private ProcessConfigService processConfigService;

	@Autowired
	private ProcessDefinitionService processDefinitionService;

	@Autowired
	MyProcessDefinitionCache myProcessDefinitionCache;

	@Autowired
	private ProcessModelService processModelService;

	private ActivityImpl getActivityByNextUser(HistoricProcessInstance historicProcessInstance, String processInstId,
			String processDefinitionId, String destActivityId, ReadOnlyProcessDefinition rpd, Map conditionMap) {
		// 获取目标节点
		ActivityImpl destActivity = (ActivityImpl) rpd.findActivity(destActivityId);
		if (destActivity == null) {
			throw new WorkFlowException(ExceptionErrorCode.B2003,
					"activity object not found,activityId:" + destActivityId);
		}

		if (ProcessDefinitionUtils.isSubProcessStartEvent(destActivity)) {// 是否子流开始事件
			destActivity = ProcessDefinitionUtils.getSubProcessInitialActivity(destActivity);
		} else if (ProcessDefinitionUtils.isSubProcessEndEvent(destActivity)) {// 是否子流结束事件
			destActivity = ProcessDefinitionUtils.getSubProcessOutActivity(destActivity);
		} else if (historicProcessInstance != null
				&& ProcessDefinitionUtils.isCallSubProcessEndEvent(historicProcessInstance, destActivity)
				&& !(BpmnXMLConstants.ELEMENT_TASK_SERVICE
						.equals((String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
						&& processConfigService.isThroughBizAppProcess(processDefinitionId, destActivityId))) {// 是否子流结束事件,首先判断是否结束环节且父流程实例ID不为空,同时需要判断不是流程贯穿服务任务过来的数据
			destActivity = getCallSubProcessOutActivity(historicProcessInstance, destActivity, conditionMap, true);
		} else if (BpmnXMLConstants.ELEMENT_CALL_ACTIVITY
				.equals((String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))) {// 是否调用外部子流
			destActivity = getCallSubProcessInActivity(destActivity);
		} else if (BpmnXMLConstants.ELEMENT_TASK_SERVICE
				.equals((String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
				&& processConfigService.isThroughBizAppProcess(// 是否服务任务且设置了流程贯穿属性
						processDefinitionId, destActivityId)) {
			destActivity = getTaskServiceInActivity(destActivity);
		}
		return destActivity;
	}

	/**
	 * 获取环节资源列表,包含人员及人员对应组织机构树(将环节绑定的人员、组织、角色拆分为人员)
	 *
	 * @param processInstId
	 * @param processDefinitionId
	 * @param curActivityId
	 * @param destActivityId
	 * @param userId
	 * @param filterIds
	 * @return
	 */
	public List<ActivityResourceModel> getNextActivityUser(String processInstId, String processDefinitionId,
			String curActInstId, String curActivityId, String destActivityId, String userId, List<String> filterIds,
			Map conditionMap) {
		if (StringUtils.isEmpty(processDefinitionId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "processDefinitionId is empty");
		}
		if (StringUtils.isEmpty(curActivityId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "curActivityId is empty");
		}
		if (StringUtils.isEmpty(destActivityId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "destActivityId is empty");
		}
		List<ActivityResourceModel> treeNodeList = new ArrayList<ActivityResourceModel>();
		// 获取流程定义模型
		ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
		HistoricProcessInstance historicProcessInstance = null;
		if (StringUtils.isNotEmpty(processInstId)) {
			historicProcessInstance = this.historyService.createHistoricProcessInstanceQuery()
					.processInstanceId(processInstId).unfinished().singleResult();
		}
		// 获取目标节点
		ActivityImpl destActivity = getActivityByNextUser(historicProcessInstance, processInstId, processDefinitionId,
				destActivityId, rpd, conditionMap);
		if (destActivity == null) {
			log.warn("目标节点{}为空", destActivityId);
			return treeNodeList;
		}
		TaskDefinition destTaskDefinition = (TaskDefinition) destActivity.getProperty("taskDefinition");
		TransitionImpl destTransition = getTransition(rpd, curActivityId, destActivityId);
		if (destActivity.getProperties().get("callSubProcessOutActivity") != null) {
			destTransition = (TransitionImpl) destActivity.getProperties().get("callSubProcessOutActivity");
		}
		if (destTaskDefinition == null) {
			log.warn("目标节点{}为空", destActivityId);
			return treeNodeList;
		}
		// 获取下一环节资源
		treeNodeList = getResourceList(rpd, destActivity, destActivityId, destTaskDefinition, destTransition,
				curActivityId, userId, filterIds, conditionMap);
		if (treeNodeList.isEmpty())
			log.warn("{}节点资源列表为空", destTransition);
		return treeNodeList;
	}

	/**
	 * 获取流程下一任务环节列表
	 *
	 * @param processDefinitionId 当前流程实例ID
	 * @param activityId          当前流程环节ID
	 * @param conditionMap        表单数据集合,用于环节条件过滤
	 * @return
	 */
	public List<ActivityDefinitionModel> getNextActivity(String processDefinitionId, String activityId,
			String processInstId, Map conditionMap) {
		if (StringUtils.isEmpty(processDefinitionId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "processDefinitionId is empty");
		}
		if (StringUtils.isEmpty(activityId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "activityId is empty");
		}
		List<ActivityDefinitionModel> activityDefinitionModelList = new ArrayList<ActivityDefinitionModel>();
		ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
		PvmActivity pvmActivity = rpd.findActivity(activityId);
		if (pvmActivity == null) {
			throw new WorkFlowException(ExceptionErrorCode.B2003, "activity object not found,activityId:" + activityId);
		}
		List<PvmTransition> pvmTransitions = pvmActivity.getOutgoingTransitions();
		Collections.sort(pvmTransitions, new ComparatorTransition());
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			String destActivityType = (String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);
			if (ProcessDefinitionUtils.isSubProcessStartEvent(destActivity)) {// 是否子流开始事件
				destActivityType = ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
			} else if (ProcessDefinitionUtils.isMultiInstance(destActivity)) {// 是否多实例类型
				destActivityType = ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
			} else if (BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE.equals(destActivityType)) {
				destActivityType = BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE;
			} else if (!(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY.equals(destActivityType))
					&& !ProcessDefinitionUtils.isUserTask(destActivity)
					&& !ProcessDefinitionUtils.isEndEvent(destActivity)) {// 否用户任务、否结束事件
				continue;
			}
			ActivityDefinitionModel activityDefinitionModel = ActivityDefinitionModel.build(destActivity,
					transitionImpl);
			try {
				ActivityInfoConfig activityInfoConfig = processConfigService.getActivityInfoConfig(processDefinitionId,
						destActivity.getId());
				activityDefinitionModel.setActivityInfoConfig(activityInfoConfig);
				if (BpmnXMLConstants.ELEMENT_TASK_SERVICE.equals(destActivityType)) {
					activityDefinitionModel.setMulti(activityInfoConfig.isMulti());
				}
			} catch (Exception e) {
				log.warn("",e);
			}

			activityDefinitionModelList.add(activityDefinitionModel);
		}
		log.info(String.format("获取下一环节,pid:%s,aid:%s,list:%s", processInstId, activityId, activityDefinitionModelList));
		return activityDefinitionModelList;
	}

	/**
	 * 获取流程下一任务环节列表
	 *
	 * @param processDefinitionId 当前流程实例ID
	 * @param activityId          当前流程环节ID
	 * @param conditionMap        表单数据集合,用于环节条件过滤
	 * @return
	 */
	private void setGatewayNextActivity(List activityDefinitionModelList, ActivityImpl pvmActivity,
			String processDefinitionId, String activityId, Map conditionMap) {
		List<PvmTransition> pvmTransitions = pvmActivity.getOutgoingTransitions();
		Collections.sort(pvmTransitions, new ComparatorTransition());
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			String destActivityType = (String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);
			/**
			 * 根据conditionMap与转移条件匹配的变量值来计算是否过滤活动
			 */
			if (filterActivity(processDefinitionId, transitionImpl.getSource(), transitionImpl.getDestination(),
					conditionMap)) {
				continue;
			} else if (BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE.equals(destActivityType)) {
				setGatewayNextActivity(activityDefinitionModelList, transitionImpl.getDestination(),
						processDefinitionId, activityId, conditionMap);
			}
			ActivityDefinitionModel activityDefinitionModel = ActivityDefinitionModel.build(destActivity,
					transitionImpl);
			try {
				ActivityInfoConfig activityInfoConfig = processConfigService.getActivityInfoConfig(processDefinitionId,
						destActivity.getId());
				activityDefinitionModel.setActivityInfoConfig(activityInfoConfig);
				if (BpmnXMLConstants.ELEMENT_TASK_SERVICE.equals(destActivityType)) {
					activityDefinitionModel.setMulti(activityInfoConfig.isMulti());
				}
			} catch (Exception e) {
				log.warn("",e);
			}

			activityDefinitionModelList.add(activityDefinitionModel);
		}
	}

	/**
	 * 获取流程上一任务环节列表
	 *
	 * @param processDefinitionId 当前流程实例ID
	 * @param activityId          当前流程环节ID
	 * @param conditionMap        表单数据集合,用于环节条件过滤
	 * @return
	 */
	public List<ActivityDefinitionModel> getPrevActivity(String processDefinitionId, String activityId,
			Map conditionMap) {
		if (StringUtils.isEmpty(processDefinitionId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "processDefinitionId is empty");
		}
		if (StringUtils.isEmpty(activityId)) {
			throw new WorkFlowException(ExceptionErrorCode.B2001, "activityId is empty");
		}
		List<ActivityDefinitionModel> activityDefinitionModelList = new ArrayList<ActivityDefinitionModel>();
		ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
		PvmActivity pvmActivity = rpd.findActivity(activityId);
		List<PvmTransition> pvmTransitions = pvmActivity.getIncomingTransitions();
		Collections.sort(pvmTransitions, new ComparatorTransition());
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			String destActivityType = (String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);
			if (BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE.equals(destActivityType)) {
				setGatewayNextActivity(activityDefinitionModelList, destActivity, processDefinitionId, activityId,
						conditionMap);
				continue;
			}

			/**
			 * 根据conditionMap与转移条件匹配的变量值来计算是否过滤活动
			 */
			if (filterActivity(processDefinitionId, transitionImpl.getSource(), transitionImpl.getDestination(),
					conditionMap)) {
				continue;
			}

			if (ProcessDefinitionUtils.isSubProcessStartEvent(destActivity)) {// 是否子流开始事件
				destActivityType = ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
				// destActivity=ProcessDefinitionUtils.getSubProcessInitialActivity(destActivity);
			} else if (ProcessDefinitionUtils.isSubProcessEndEvent(destActivity)) {// 是否子流结束事件
				// destActivity=ProcessDefinitionUtils.getSubProcessOutActivity(destActivity);
			} else if (ProcessDefinitionUtils.isMultiInstance(destActivity)) {// 是否多实例类型
				destActivityType = ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
			} else if (BpmnXMLConstants.ELEMENT_GATEWAY_PARALLEL.equals(destActivityType)) {
				destActivityType = BpmnXMLConstants.ELEMENT_GATEWAY_PARALLEL;
			} else if (BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE.equals(destActivityType)) {
				destActivityType = BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE;
			} else if (BpmnXMLConstants.ELEMENT_TASK_SCRIPT.equals(destActivityType)) {
				destActivityType = BpmnXMLConstants.ELEMENT_TASK_SCRIPT;
			} else if (BpmnXMLConstants.ELEMENT_TASK_SERVICE.equals(destActivityType)) {
				destActivityType = BpmnXMLConstants.ELEMENT_TASK_SERVICE;
			} else if (!(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY.equals(destActivityType))
					&& !ProcessDefinitionUtils.isUserTask(destActivity)
					&& !ProcessDefinitionUtils.isEndEvent(destActivity)) {// 否用户任务、否结束事件
				continue;
			}
			activityDefinitionModelList.add(ActivityDefinitionModel.build(destActivity, transitionImpl));

		}
		return activityDefinitionModelList;
	}

	/**
	 * 获取环节资源列表,包含人员及人员对应组织机构树(将环节绑定的人员、组织、角色拆分为人员)
	 *
	 * @param activityDefinitionModel
	 * @return
	 */
	public List<ActivityResourceModel> getResource(String procDefId, String actDefId) {
		ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(procDefId);
		// 获取目标节点
		ActivityImpl destActivity = getActivityByNextUser(null, null, procDefId, actDefId, rpd, null);
		if (destActivity == null) {
			throw new WorkFlowException(ExceptionErrorCode.B2003, "destActivity is null");
		}
		/**
		 * 没有经办人的情况下直接查找destActivity的TaskDefinition绑定的资源
		 */
		TaskDefinition taskDefinition = (TaskDefinition) destActivity.getProperty("taskDefinition");
		if (taskDefinition == null) {
			throw new WorkFlowException(ExceptionErrorCode.B2003, "taskDefinition is null");
		}

		Set<ActivityResourceModel> treeNodeList = new HashSet<ActivityResourceModel>();
		Set<Org> orgTree = new LinkedHashSet<Org>();
		// 设置任务人员资源
		setUsers(taskDefinition, orgTree, null, treeNodeList);
		// 设置任务组织机构资源
		setOrgs(taskDefinition, orgTree, null, treeNodeList);
		// 设置任务角色资源
		setGroups(taskDefinition, orgTree, null, treeNodeList, null);
		for (Org org : orgTree) {
			ActivityResourceModel treeNode = new ActivityResourceModel(String.valueOf(org.getOrgId()),
					String.valueOf(org.getOrgParentId()), org.getOrgName(), org.getOrgLevel(),
					org.getOrgType() != null ? org.getOrgType() : "ORG", org.getOrgSort());
			treeNodeList.add(treeNode);
		}
		List<ActivityResourceModel> tempList = new ArrayList<ActivityResourceModel>();
		tempList.addAll(treeNodeList);
		tempList.sort(new ComparatorActivityResource());
		return tempList;
	}

	/**
	 * 通过环节线绑定的脚本规则来过滤人员
	 *
	 * @param procDefId
	 * @param sourceActId
	 * @param destinationActId
	 * @param conditionMap
	 * @return
	 */
	private Set<ActivityResourceModel> filterActivityResource(String procDefId, String sourceActId,
			String destinationActId, Map conditionMap) {
		Set<ActivityResourceModel> treeNodeList = new HashSet<ActivityResourceModel>();
		try {
			ActivityRule activityRule = activityRuleManager.getActivityRule(procDefId, sourceActId, destinationActId,
					ActivityRule.RULE_TYPE_ACT_RES);
			if (activityRule == null) {
				return treeNodeList;
			}
			String ruleName = activityRule.getRuleName();
			String ruleScript = activityRule.getRuleScript();
			if (conditionMap != null) {
				ProcessInputModel processInputModel = (ProcessInputModel) conditionMap
						.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
				if (processInputModel != null && processInputModel.getFields() != null) {
					Map<String, Object> fieldsMap = processInputModel.getFields();
					for (Map.Entry<String, Object> fieldEntry : fieldsMap.entrySet()) {
						if (conditionMap.get(fieldEntry.getKey()) == null) {
							conditionMap.put(fieldEntry.getKey(), fieldEntry.getValue());
						}
					}
				}

			}
			String userIdAndOrgIdStr = (String) groovyScriptEngine.executeObject(ruleScript, conditionMap);
			Set<String> userIdAndOrgIdSet = new java.util.LinkedHashSet<String>();
			Set<Org> orgTree = new LinkedHashSet<Org>();
			if (userIdAndOrgIdStr.indexOf(",") != -1) {
				userIdAndOrgIdSet.addAll(Arrays.asList(userIdAndOrgIdStr.split(",")));
			} else {
				userIdAndOrgIdSet.add(userIdAndOrgIdStr);
			}
			if (userIdAndOrgIdSet == null || userIdAndOrgIdSet.isEmpty()) {
				return treeNodeList;
			}
			for (String userIdAndOrgId : userIdAndOrgIdSet) {
				if (StringUtils.isEmpty(userIdAndOrgId)) {
					continue;
				}
				String[] userIdAndOrgIds = new String[2];
				if (userIdAndOrgId.indexOf("#") != -1) {
					userIdAndOrgIds = userIdAndOrgId.split("#");
				} else {
					userIdAndOrgIds[0] = userIdAndOrgId;
				}
				User user = null;
				if (userIdAndOrgIds[1] == null) {// 当主兼人员处理
					// user = userService.getUserById(userIdAndOrgIds[0]);
					continue;// 为了与客户端接口保持一致必须传人员和组织ID
				} else {// 兼职人员处理
					user = userService.getUserByCode(userIdAndOrgIds[0], userIdAndOrgIds[1]);
				}
				if (user == null) {
					continue;
				}
				List<Org> orgs = orgService.findParentOrgTree(user.getOrgId());
				if (orgs == null || orgs.isEmpty()) {
					continue;
				}
				orgTree.addAll(orgs);
				ActivityResourceModel treeNode = new ActivityResourceModel(user.getUserId(),
						String.valueOf(user.getOrgId()), user.getUserName(), -1, "USER", user.getUserSort());
				treeNodeList.add(treeNode);
			}
			for (Org org : orgTree) {
				ActivityResourceModel treeNode = new ActivityResourceModel(String.valueOf(org.getOrgId()),
						String.valueOf(org.getOrgParentId()), org.getOrgName(), org.getOrgLevel(),
						org.getOrgType() != null ? org.getOrgType() : "ORG", org.getOrgSort());
				treeNodeList.add(treeNode);
			}
		} catch (Exception e) {
			log.warn("",e);
		}
		return treeNodeList;
	}

	/**
	 * 获取环节经办资源(包含人员及人员对应组织机构树)
	 *
	 * @param rpd
	 * @param processInstId
	 * @param curActivityId
	 * @param destActivityId
	 * @return
	 */
	private Set<ActivityResourceModel> getFormerResource(HistoricProcessInstance historicProcessInstance,
			ReadOnlyProcessDefinition rpd, String processInstId, String curActInstId, String curActivityId,
			String oldDestActivityId, ActivityImpl newDestActivity, Map conditionMap) {
		Set<ActivityResourceModel> treeNodeList = null;
		String destActivityId = newDestActivity.getId();
		try {
			if (StringUtils.isEmpty(processInstId)) {
				return treeNodeList;
			}
			String formerUserId = "";
			if (!oldDestActivityId.equals(newDestActivity.getId())) {
				destActivityId = oldDestActivityId;
			}
			// 获取目标节点
			ActivityImpl destActivity = (ActivityImpl) rpd.findActivity(destActivityId);
			if (destActivity == null) {
				return treeNodeList;
			}
			// 子流程返回经办逻辑
			if (historicProcessInstance != null
					&& ProcessDefinitionUtils.isCallSubProcessEndEvent(historicProcessInstance, destActivity)
					&& !(BpmnXMLConstants.ELEMENT_TASK_SERVICE
							.equals((String) destActivity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
							&& processConfigService.isThroughBizAppProcess(rpd.getId(), destActivityId))) {// 是否子流结束事件,首先判断是否结束环节且父流程实例ID不为空,同时需要判断不是流程贯穿服务任务过来的数据
				// 获取父流程定义
				ReadOnlyProcessDefinition parentRpd = getParentProcessDefinition(historicProcessInstance);
				TransitionImpl destTransition = null;
				if (newDestActivity.getProperties().get("callSubProcessOutActivity") != null) {
					destTransition = (TransitionImpl) newDestActivity.getProperties().get("callSubProcessOutActivity");
					// 通过父流程定义、父流程实例ID、子流程节点ID、子流程的输出节点ID来查找经办人
					formerUserId = findActivityReturnFormer(parentRpd,
							historicProcessInstance.getSuperProcessInstanceId(), curActInstId,
							destTransition.getSource().getId(), destTransition.getDestination().getId());
				} else {
					// 获取子流程节点
					ActivityImpl callActivityImpl = ProcessDefinitionUtils.findCallSubProcessActivity(parentRpd,
							rpd.getKey());
					// 获取子流程的输出节点
					destActivity = getCallSubProcessOutActivityReal(parentRpd, destActivity, conditionMap);
					// 通过父流程定义、父流程实例ID、子流程节点ID、子流程的输出节点ID来查找经办人
					formerUserId = findActivityReturnFormer(parentRpd,
							historicProcessInstance.getSuperProcessInstanceId(), curActInstId, callActivityImpl.getId(),
							callActivityImpl.getId());
				}
			} else if (ProcessDefinitionUtils.isInclusiveGateway(destActivity)) {// 是否包容网关接到
				ActivityImpl destOutActivity = getInclusiveGatewayOutActivity(destActivity, conditionMap);
				// 普通环节经办逻辑
				formerUserId = findActivityReturnFormer(rpd, processInstId, curActInstId, destActivity.getId(),
						destOutActivity.getId());

			} else {
				// 普通环节经办逻辑
				formerUserId = findActivityReturnFormer(rpd, processInstId, curActInstId, curActivityId,
						destActivityId);
			}
			if (StringUtils.isEmpty(formerUserId))
				return treeNodeList;
			User user = userService.getUserById(formerUserId);
			if (user == null) {
				log.warn(
						"获取经办资源->userService.getUserById(formerUserId) return null,processInstId:{},curActivityId:{},destActivityId:{},formerUserId:{}",
						processInstId, curActivityId, destActivityId, formerUserId);
				return treeNodeList;
			}
			List<Org> orgs = orgService.findParentOrgTree(user.getOrgId());
			if (orgs == null || orgs.isEmpty()) {
				log.warn(
						"获取经办资源->orgService.findParentOrgTree(user.getOrgId()) return = null,processInstId:{},curActivityId:{},destActivityId:{},formerUserId:{}",
						processInstId, curActivityId, destActivityId, formerUserId);
				return treeNodeList;
			}
			treeNodeList = new HashSet<ActivityResourceModel>();
			for (Org org : orgs) {
				ActivityResourceModel treeNode = new ActivityResourceModel(String.valueOf(org.getOrgId()),
						String.valueOf(org.getOrgParentId()), org.getOrgName(), org.getOrgLevel(), "ORG",
						org.getOrgSort());
				treeNodeList.add(treeNode);
			}
			ActivityResourceModel userTreeNode = new ActivityResourceModel(user.getUserId(),
					String.valueOf(user.getOrgId()), user.getUserName(), -1, "USER", user.getUserSort());
			treeNodeList.add(userTreeNode);
		} catch (Exception e) {
			String errorMsg = "获取经办资源出现异常,processInstId:" + processInstId + ",curActivityId:" + curActivityId
					+ ",destActivityId:" + destActivityId + "";
			log.warn(errorMsg, e);
			throw new WorkFlowException(ExceptionErrorCode.B2007, errorMsg, e);
		}
		return treeNodeList;
	}

	/**
	 * 查询环节经办人
	 *
	 * @param rpd
	 * @param processInstId
	 * @param curActivityId
	 * @param destActivityId
	 * @return
	 */
	private String findActivityReturnFormer(ReadOnlyProcessDefinition rpd, String processInstId, String curActInstId,
			String curActivityId, String destActivityId) {
		String userId = "";
		TransitionImpl transitionImpl = getTransition(rpd, curActivityId, destActivityId);
		if (transitionImpl == null || transitionImpl.getExpandPropertys().isEmpty())
			return userId;
		ExpandProperty expandProperty = ProcessDefinitionUtils.findTransitionReturnFormer(transitionImpl);
		if (expandProperty == null)
			return userId;
		String formerActivityId = expandProperty.getValue();
		if (StringUtils.isEmpty(formerActivityId)) {
			log.warn(
					"获取经办资源->未找到转移线上经办属性-findTransitionReturnFormer expandProperty value return null,processInstId:{},curActivityId:{},destActivityId:{}",
					processInstId, curActivityId, destActivityId);
		}
		Task task = null;
		List<HistoricTaskInstance> historicTaskInstances = null;
		if (!StringUtils.isEmpty(curActInstId)) {
			task = taskService.createTaskQuery().taskId(curActInstId).active().singleResult();
		}
		SubProcess subProcess = ProcessModelUtils.isSubProcessAct(
				processModelService.getBpmnModelByProcDefId(rpd.getProcessDefinition().getId()), formerActivityId);
		if (subProcess != null && task != null && processInstId != null
				&& !processInstId.equals(task.getExecutionId())) {
			historicTaskInstances = historyService.createHistoricTaskInstanceQuery().executionId(task.getExecutionId())
					.taskDefinitionKey(formerActivityId).finished().orderByHistoricTaskInstanceEndTime().desc().list();
		} else {
			historicTaskInstances = historyService.createHistoricTaskInstanceQuery().processInstanceId(processInstId)
					.taskDefinitionKey(formerActivityId).finished().orderByHistoricTaskInstanceEndTime().desc().list();
		}
		if (historicTaskInstances == null || historicTaskInstances.isEmpty()) {
			log.warn(
					"获取经办资源->未找到经办环节-historicTaskInstances return null,processInstId:{},curActivityId:{},destActivityId:{},formerActivityId:{}",
					processInstId, curActivityId, destActivityId, formerActivityId);
			return userId;
		}
		HistoricTaskInstance historicTaskInstance = ((HistoricTaskInstance) historicTaskInstances.get(0));
		if (historicTaskInstance == null) {
			log.warn(
					"获取经办资源->未找到经办环节-historicTaskInstances return null,processInstId:{},curActivityId:{},destActivityId:{},formerActivityId:{}",
					processInstId, curActivityId, destActivityId, formerActivityId);
			return userId;
		}
		userId = historicTaskInstance.getAssignee();
		return userId;

	}

	/**
	 * 查询环节经办人
	 *
	 * @param rpd
	 * @param processInstId
	 * @param curActivityId
	 * @param destActivityId
	 * @return
	 */
	public List<String> findActivityReturnFormer(String processDefinitionId, String processInstId, String curActInstId,
			String prevActInstId) {

		List<String> userIds = new ArrayList();
		if (StringUtils.isEmpty(prevActInstId)) {
			return userIds;
		}
		List<HistoricTaskInstance> historicTaskInstances = null;
		ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
		processConfigService.getPreTaskAssignee(processInstId, prevActInstId);
		if (historicTaskInstances == null || historicTaskInstances.isEmpty()) {
			return userIds;
		}
		for (HistoricTaskInstance historicTaskInstance2 : historicTaskInstances) {
			userIds.add(historicTaskInstance2.getAssignee());
		}
		return userIds;

	}

	/**
	 * 获取环节资源列表,包含人员及人员对应组织机构树(将环节绑定的人员、组织、角色拆分为人员)
	 *
	 * @param destTaskDefinition
	 * @param curTransition
	 * @param userId
	 * @param filterIds
	 * @return
	 */
	private List<ActivityResourceModel> getResourceList(ReadOnlyProcessDefinition rpd, ActivityImpl destActivity,
			String oldDestActivityId, TaskDefinition destTaskDefinition, TransitionImpl destTransition,
			String curActivityId, String userId, List<String> filterIds, Map conditionMap) {
		Set<ActivityResourceModel> treeNodeList = new HashSet<ActivityResourceModel>();
		// 当环节线绑定了人员规则时,环节绑定资源逻辑失效
		if (treeNodeList.isEmpty()) {
			// 获取当前用户同级别组织限制数据
			Org userSameOrgLevelData = getUserSameOrgLevelData(
					ProcessDefinitionUtils.findTransitionUserSameOrgLevel(destTransition), userId);
			if (userSameOrgLevelData != null) {
				log.info("过滤掉不在[机构名称:{},机构ID:{},机构层级:{}]中的用户数据{}", userSameOrgLevelData.getOrgName(),
						userSameOrgLevelData.getOrgId(), userSameOrgLevelData.getOrgLevel(), userId);
			}
			Set<Org> orgTree = new HashSet<Org>();
			// 获取任务绑定的人员资源
			setUsers(destTaskDefinition, orgTree, userSameOrgLevelData, treeNodeList);
			// 获取任务绑定的组织机构资源
			setOrgs(destTaskDefinition, orgTree, userSameOrgLevelData, treeNodeList);
			// 获取任务绑定的角色资源
			setGroups(destTaskDefinition, orgTree, userSameOrgLevelData, treeNodeList, filterIds);

			if (treeNodeList.size() < 20) {
				log.info(String.format("获取下一环节用户,cactid:%s,actid:%s,list:%s", curActivityId, curActivityId,
						treeNodeList));
			}
			for (Org org : orgTree) {
				ActivityResourceModel treeNode = new ActivityResourceModel(String.valueOf(org.getOrgId()),
						String.valueOf(org.getOrgParentId()), org.getOrgName(), org.getOrgLevel(), "ORG",
						org.getOrgSort());
				treeNodeList.add(treeNode);
			}
		}
		List<ActivityResourceModel> tempList = new ArrayList<ActivityResourceModel>();
		tempList.addAll(treeNodeList);
		Collections.sort(tempList, new ComparatorActivityResource());
		return tempList;
	}

	/**
	 * 查询环节连接线
	 *
	 * @param rpd
	 * @param curActivityId
	 * @param destActivityId
	 * @return
	 */
	private TransitionImpl getTransition(ReadOnlyProcessDefinition rpd, String curActivityId, String destActivityId) {
		PvmActivity pvmActivity = rpd.findActivity(curActivityId);
		if (pvmActivity == null)
			return null;
		List<PvmTransition> pvmTransitions = pvmActivity.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;

			ActivityImpl destActivity = transitionImpl.getDestination();

			if (destActivity.getId().equals(destActivityId)) {
				return transitionImpl;
			}
		}
		return null;
	}

	/**
	 * 根据组织层级过滤
	 *
	 * @param orgLevelStr
	 * @param userId
	 * @return
	 */
	private Org getUserSameOrgLevelData(String orgLevelStr, String userId) {
		Integer orgLevel = null;
		Org userParentOrgTree = null;
		if (StringUtils.isEmpty(orgLevelStr) || StringUtils.isEmpty(userId))
			return userParentOrgTree;
		try {
			orgLevel = Integer.parseInt(orgLevelStr);
			if (StringUtils.isEmpty(userId)) {
				return null;
			}
			User user = userService.getUserById(userId);
			if (orgLevelStr.equals("3")) {// 同级别默认返回当前组织用户所属组织
				return orgService.getOrgById(user.getOrgId());
			}
			List<Org> userParentOrgTrees = orgService.findParentOrgTree(user.getOrgId(), orgLevel);
			if (userParentOrgTrees != null && !userParentOrgTrees.isEmpty()) {
				userParentOrgTree = userParentOrgTrees.get(0);
			}
		} catch (Exception e) {
			log.warn("根据当前用户ID[{}]和用户同组织层次过滤条件[{}]来获取组织失败", userId, orgLevelStr);
			log.warn("", e);
		}
		return userParentOrgTree;
	}

	/**
	 * 基于组织全路径实现同部门过滤
	 *
	 * @param filterIds
	 * @param orgFullPath
	 * @return
	 */
	private boolean isFilterActivityResourceByOrgFullPath(List<String> filterIds, List<String> orgFullPath) {
		if (filterIds == null || filterIds.isEmpty() || orgFullPath.isEmpty()) {
			return false;
		}
		boolean result = true;
		for (String filterId : filterIds) {
			for (String orgId : orgFullPath) {
				if (StringUtils.isEmpty(filterId))
					continue;
				if (orgId.contains(filterId)) {
					result = false;
				}
			}
		}
		return result;

	}

	/**
	 * 基于用户实现同部门过滤
	 *
	 * @param user
	 * @param userSameOrg
	 * @return
	 */
	private boolean isFilterActivityResourceByUser(User user, Org userSameOrg, List<String> orgFullPath) {
		if (userSameOrg == null)
			return false;
		if (user == null)
			return false;
		List<String> orgIds = getOrgIdsByFullPath(user);
		for (String orgId : orgIds) {
			if (String.valueOf(userSameOrg.getOrgId()).equals(orgId)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 基于组织实现同部门过滤
	 *
	 * @param orgs
	 * @param userSameOrg
	 * @return
	 */
	private boolean isFilterActivityResourceByOrg(List<Org> orgs, Org userSameOrg) {
		if (userSameOrg == null)
			return false;
		if (orgs == null || orgs.isEmpty())
			return false;
		for (Org org : orgs) {
			if (userSameOrg.getOrgLevel().intValue() == org.getOrgLevel().intValue() && userSameOrg.getOrgId().equals(org.getOrgId())) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 根据表单数据集合与连接线绑定规则来判断是否过滤环节
	 *
	 * @param transition
	 * @param conditionMap
	 * @return
	 */
	public boolean filterActivity(String procDefId, ActivityImpl sourceAct, ActivityImpl destinationAct,
			Map<String, Object> conditionMap) {
		boolean isFilterActivityFlag = false;
		String ruleScript = "";
		String ruleName = "";
		try {
			if (conditionMap == null || conditionMap.isEmpty()) {
				return isFilterActivityFlag;
			}
			ActivityRule activityRule = activityRuleManager.getActivityRule(procDefId, sourceAct.getId(),
					destinationAct.getId(), ActivityRule.RULE_TYPE_ACT);
			if (activityRule == null) {
				return isFilterActivityFlag;
			}
			ruleName = activityRule.getRuleName();
			ruleScript = activityRule.getRuleScript();
			boolean isFilterFlag = groovyScriptEngine.executeBoolean(ruleScript, conditionMap);
			if (!isFilterFlag) {
				isFilterActivityFlag = true;
				log.warn("已成功根据[{}]的规则脚本过滤调环节sourceAct:{},destinationAct:{},conditionMap:{},ruleScript:{}", ruleName,
						sourceAct, destinationAct, conditionMap, ruleScript);
			}
		} catch (Exception e) {
			log.warn("根据[{}]规则脚本过滤掉环节出现异常,sourceAct:{},destinationAct:{},conditionMap:{},ruleScript:{}", ruleName,
					sourceAct, destinationAct, conditionMap, ruleScript, e);
			isFilterActivityFlag = true;
		}
		return isFilterActivityFlag;
	}

	private List<String> getOrgIdsByFullPath(User user) {
		String orgFullPath = user.getOrgFullPath();
		if (StringUtils.isEmpty(orgFullPath)) {
			orgFullPath = String.valueOf(user.getOrgId());
			List result = new ArrayList();
			result.add(orgFullPath);
			return result;
		}
		orgFullPath = orgFullPath.replaceAll("\\$,", "");
		String[] orgIds = orgFullPath.split(",");
		return Arrays.asList(orgIds);
	}

	/**
	 * 设置任务角色资源
	 *
	 * @param taskDefinition
	 * @param orgTree
	 * @param userSameOrgLevelData
	 * @param treeNodeList
	 * @param filterIds
	 */
	private void setGroups(TaskDefinition taskDefinition, Set<Org> orgTree, Org userSameOrgLevelData,
			Set<ActivityResourceModel> treeNodeList, List<String> filterIds) {
		Set<Expression> candidateGroupIdExpressions = taskDefinition.getCandidateGroupIdExpressions();
		Set<String> orgIds = new HashSet<>();
		for (Expression expression : candidateGroupIdExpressions) {
			List<User> users = userService.findUserIdByRoleCascade(expression.getExpressionText());
			if (users == null || users.isEmpty()) {
				continue;
			}
			for (User user : users) {
				// 用户所属组织的全路径
				List<String> orgFullPath = getOrgIdsByFullPath(user);
				/*
				 * //同组织过滤 if (isFilterActivityResourceByUser(user, userSameOrgLevelData,
				 * orgFullPath)) { continue; } //基于前端id过滤 if
				 * (isFilterActivityResourceByOrgFullPath(filterIds, orgFullPath)) { continue; }
				 */
				orgIds.addAll(orgFullPath);

				ActivityResourceModel treeNode = new ActivityResourceModel(user.getUserId(), user.getUserId(),
						String.valueOf(user.getOrgId()), user.getUserName(), -1, "USER", user.getUserSort());
				treeNodeList.add(treeNode);
			}
		}
		if (!orgIds.isEmpty()) {
			List<Org> orgs = orgService.findOrgByOrgIds(new ArrayList(orgIds));
			orgTree.addAll(orgs);
		}
	}

	/**
     * 设置任务组织机构资源
     *
     * @param taskDefinition
     * @param orgTree
     * @param userSameOrgLevelData 已绑定组织的级别
     * @param treeNodeList
     */
    private void setOrgs(TaskDefinition taskDefinition, Set<Org> orgTree,
                         Org userSameOrgLevelData, Set<ActivityResourceModel> treeNodeList) {
        Set<Expression> candidateOrgIdExpressions = taskDefinition
                .getCandidateOrgIdExpressions();
        /*RedisUtil cache = myProcessDefinitionCache.getProcessDefinitionCache();
        for (Expression expression : candidateOrgIdExpressions) {
            if (cache != null) {
                String cacheValue = cache.get(expression.getExpressionText());
                //读取缓存
                if (StringUtils.isNotBlank(cacheValue)) {
                    JSONObject parseObject = JSON.parseObject(cacheValue);
                    JSONArray orgTree1 = parseObject.getJSONArray("orgTree");
                    if (null != orgTree1) {
                        List<Org> orgs = orgTree1.toJavaList(Org.class);
                        orgTree.addAll(orgs);
                    }
                /*    JSONArray treeNodeList1 = parseObject.getJSONArray("treeNodeList");
                    if (null != treeNodeList1) {
                        List<ActivityResourceModel> list = treeNodeList1.toJavaList(ActivityResourceModel.class);
                        treeNodeList.addAll(list);
                    }
                    continue;
                }
            }
            List<Org> parentOrgs = orgService.findParentOrgTree(expression
                    .getExpressionText(), false);
            Org currentOrg = orgService.getOrgById(expression
                    .getExpressionText());

            if (userSameOrgLevelData != null) {
                //当前过滤级别userSameOrgLevelData大于环节绑定组织的级别currentOrg
                if (userSameOrgLevelData.getOrgLevel() > currentOrg.getOrgLevel()) {
                    if (!orgService.isInOrg(currentOrg.getOrgId(), userSameOrgLevelData.getOrgId())) {
                        continue;
                    }
                    parentOrgs = orgService
                            .findParentOrgTree(userSameOrgLevelData.getOrgId());

                } else if (userSameOrgLevelData != null && isFilterActivityResourceByOrg(parentOrgs,
                        userSameOrgLevelData)) {//绑定组织级别等于当前组织级别且不是同1个组织内
                    continue;
                }
                if (userSameOrgLevelData.getOrgLevel() >= currentOrg.getOrgLevel()) {
                    parentOrgs.addAll(orgService.findSubOrgTree(userSameOrgLevelData.getOrgId()));
                } else {
                    parentOrgs.addAll(orgService.findSubOrgTree(currentOrg.getOrgId()));
                }
            } else {
                parentOrgs.addAll(orgService.findSubOrgTree(currentOrg.getOrgId()));
            }
            orgTree.addAll(parentOrgs);
            filterOrgLevelDy3(parentOrgs, userSameOrgLevelData);
            List<User> users = userService.findUserByOrgIds(parentOrgs);
            for (User user : users) {
                ActivityResourceModel treeNode = new ActivityResourceModel(user.getUserId(),
                        user.getUserCode(), String.valueOf(user.getOrgId()),
                        user.getUserName(), -1, "USER", user.getUserSort());
                treeNodeList.add(treeNode);
            }
        }*/
    }

	private void filterOrgLevelDy3(List<Org> parentOrgs, Org userSameOrgLevelData) {
		if (userSameOrgLevelData == null || userSameOrgLevelData.getOrgLevel() < 3) {
			return;
		}
		for (int i = 0; i < parentOrgs.size(); i++) {
			Org org = parentOrgs.get(i);
			if (org.getOrgLevel() < userSameOrgLevelData.getOrgLevel()) {
				parentOrgs.remove(i);
				i--;
			}
		}

	}

	private Org findDaYuOneOrgLevel(Org userSameOrgLevelData, List<Org> parentOrgs) {
		for (Org org : parentOrgs) {
			if (userSameOrgLevelData.getOrgLevel() > org.getOrgLevel()) {
				return org;
			}
		}
		return null;
	}

	/**
	 * 设置任务人员资源
	 *
	 * @param taskDefinition
	 * @param orgTree
	 * @param userSameOrgLevelData
	 * @param treeNodeList
	 */
	private void setUsers(TaskDefinition taskDefinition, Set<Org> orgTree, Org userSameOrgLevelData,
			Set<ActivityResourceModel> treeNodeList) {
		Set<Expression> candidateUserIdExpressions = taskDefinition.getCandidateUserIdExpressions();
		int index = 1;
		for (Expression expression : candidateUserIdExpressions) {
			User user = new User();
			user.setUserId(expression.getExpressionText());
			user.setUserCode(expression.getExpressionText());
			/*
			 * User user = userService.getUserById(expression.getExpressionText()); if (user
			 * == null) { this.log.error("环节定义绑定的资源已失效,请重新绑定,taskDefKey:" +
			 * taskDefinition.getKey() + ",资源值" + expression.getExpressionText()); continue;
			 * } if (!user.isUserQyStatus()) {
			 * this.log.error("环节定义绑定的资源已禁用,请重新绑定,taskDefKey:" + taskDefinition.getKey() +
			 * ",资源值" + expression.getExpressionText()); continue; }
			 */
			/*
			 * List<Org> orgs = orgService.findParentOrgTree(user.getOrgId()); if
			 * (isFilterActivityResourceByOrg(orgs, userSameOrgLevelData)) { continue; }
			 * orgTree.addAll(orgs);
			 */
			ActivityResourceModel treeNode = new ActivityResourceModel(user.getUserId(), user.getUserId(),
					String.valueOf(user.getOrgId()), user.getUserName(), -1, "USER", index);
			treeNodeList.add(treeNode);
			index++;
		}
	}

	/**
	 * 计算多实例环节完成条件规则
	 *
	 * @param procDefId
	 * @param sourceActId
	 * @param conditionMap
	 * @return
	 */
	public boolean completionConditionByMultiTask(String procDefId, String sourceActId, Map conditionMap) {
		boolean isCompletionFlag = false;
		String ruleScript = "";
		String ruleName = "";
		try {
			if (conditionMap == null || conditionMap.isEmpty()) {
				return isCompletionFlag;
			}
			ActivityRule activityRule = activityRuleManager.getActivityRule(procDefId, sourceActId, null,
					ActivityRule.RULE_TYPE_ACT_FINISH);
			if (activityRule == null) {
				return isCompletionFlag;
			}
			ruleName = activityRule.getRuleName();
			ruleScript = activityRule.getRuleScript();
			Map<String, Object> fieldsMap = null;
			if (conditionMap.containsKey(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY)) {
				ProcessInputModel processInputModel = (ProcessInputModel) conditionMap
						.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
				fieldsMap = processInputModel.getFields();
			}
			if (fieldsMap != null) {
				for (Map.Entry<String, Object> fieldEntry : fieldsMap.entrySet()) {
					if (conditionMap.get(fieldEntry.getKey()) == null) {
						conditionMap.put(fieldEntry.getKey(), fieldEntry.getValue());
					}
				}
			}
			isCompletionFlag = groovyScriptEngine.executeBoolean(ruleScript, conditionMap);
			if (isCompletionFlag) {
				log.info("环节完成规则脚本执行成功,ruleName：{},sourceActId:{},conditionMap:{},ruleScript:{}", ruleName, sourceActId,
						conditionMap, ruleScript);
			}
		} catch (Exception e) {
			log.warn("环节完成规则脚本执行失败,ruleName：{},sourceActId:{},conditionMap:{},ruleScript:{}", ruleName, sourceActId,
					conditionMap, ruleScript, e);
		}
		return isCompletionFlag;
	}

	/**
	 * 获取子流程的第一个输出节点
	 *
	 * @param historicProcessInstance
	 * @param destActivity
	 * @return
	 */
	private ActivityImpl getCallSubProcessOutActivity(HistoricProcessInstance historicProcessInstance,
			ActivityImpl destActivity, Map conditionMap, boolean isFindUser) {
		ActivityImpl activityImpl = null;
		if (StringUtils.isEmpty(historicProcessInstance.getSuperProcessInstanceId())) {
			return activityImpl;
		}
		HistoricProcessInstance parentHistoricProcessInstance = this.historyService.createHistoricProcessInstanceQuery()
				.processInstanceId(historicProcessInstance.getSuperProcessInstanceId()).unfinished().singleResult();
		String procDefId = parentHistoricProcessInstance.getProcessDefinitionId();
		if (isFindUser) {
			activityImpl = getCallSubProcessOutActivityReal(this.getDeployedProcessDefinition(procDefId), destActivity,
					conditionMap);
		} else {
			activityImpl = getCallSubProcessOutActivity(this.getDeployedProcessDefinition(procDefId), destActivity,
					conditionMap);
		}

		return activityImpl;
	}

	/**
	 * 获取网关节点输出环节
	 *
	 * @param parentProcessDefinition
	 * @param endActivity
	 * @return
	 */
	public ActivityImpl getInclusiveGatewayOutActivity(ActivityImpl activity, Map conditionMap) {
		if (activity == null)
			return null;
		List<PvmTransition> pvmTransitions = activity.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			/**
			 * 根据conditionMap与转移条件匹配的变量值来计算是否过滤活动
			 */
			if (filterActivity(activity.getProcessDefinition().getId(), transitionImpl.getSource(),
					transitionImpl.getDestination(), conditionMap)) {
				continue;
			}
			if (ProcessDefinitionUtils.isUserTask(destActivity)) {
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				activity.getProperties().put("name", name);
				return destActivity;
			}
		}
		return null;
	}

	/**
	 * 获取外部子流程输出环节-只是替换名称，不替换节点（用于返回下一环节）
	 *
	 * @param parentProcessDefinition
	 * @param endActivity
	 * @return
	 */
	public ActivityImpl getCallSubProcessOutActivity(ReadOnlyProcessDefinition parentProcessDefinition,
			ActivityImpl endActivity, Map conditionMap) {
		if (endActivity == null || parentProcessDefinition == null)
			return null;

		ProcessDefinitionImpl processDefinitionImpl = endActivity.getProcessDefinition();
		ActivityImpl callActivity = (ActivityImpl) ProcessDefinitionUtils
				.findCallSubProcessActivity(parentProcessDefinition, processDefinitionImpl.getKey());
		List<PvmTransition> pvmTransitions = callActivity.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			/**
			 * 根据conditionMap与转移条件匹配的变量值来计算是否过滤活动
			 */
			if (filterActivity(parentProcessDefinition.getId(), transitionImpl.getSource(),
					transitionImpl.getDestination(), conditionMap)) {
				continue;
			}
			if (ProcessDefinitionUtils.isUserTask(destActivity)) {
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				endActivity.getProperties().put("name", name);
				return endActivity;
			} else if (ProcessDefinitionUtils.isEndEvent(destActivity)) {
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				endActivity.getProperties().put("name", name);
				return endActivity;
			}
		}
		return null;
	}

	/**
	 * 获取外部子流程输出环节-替换为新节点（用于返回下一环节实际人员）
	 *
	 * @param parentProcessDefinition
	 * @param endActivity
	 * @return
	 */
	public ActivityImpl getCallSubProcessOutActivityReal(ReadOnlyProcessDefinition parentProcessDefinition,
			ActivityImpl endActivity, Map conditionMap) {
		if (endActivity == null || parentProcessDefinition == null)
			return null;

		ProcessDefinitionImpl processDefinitionImpl = endActivity.getProcessDefinition();
		ActivityImpl callActivity = (ActivityImpl) ProcessDefinitionUtils
				.findCallSubProcessActivity(parentProcessDefinition, processDefinitionImpl.getKey());
		List<PvmTransition> pvmTransitions = callActivity.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			/**
			 * 根据conditionMap与转移条件匹配的变量值来计算是否过滤活动
			 */
			if (filterActivity(parentProcessDefinition.getId(), transitionImpl.getSource(),
					transitionImpl.getDestination(), conditionMap)) {
				continue;
			}
			if (ProcessDefinitionUtils.isUserTask(destActivity)) {
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				destActivity.getProperties().put("name", name);
				destActivity.getProperties().put("callSubProcessOutActivity", transitionImpl);
				return destActivity;
			} else if (ProcessDefinitionUtils.isEndEvent(destActivity)) {
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				destActivity.getProperties().put("name", name);
				return destActivity;
			}
		}
		return null;
	}

	/**
	 * 获取子流程的第一个输出节点
	 *
	 * @param historicProcessInstance
	 * @param destActivity
	 * @return
	 */
	private ReadOnlyProcessDefinition getParentProcessDefinition(HistoricProcessInstance historicProcessInstance) {
		if (StringUtils.isEmpty(historicProcessInstance.getSuperProcessInstanceId())) {
			return null;
		}
		HistoricProcessInstance parentHistoricProcessInstance = this.historyService.createHistoricProcessInstanceQuery()
				.processInstanceId(historicProcessInstance.getSuperProcessInstanceId()).unfinished().singleResult();
		String procDefId = parentHistoricProcessInstance.getProcessDefinitionId();
		return this.getDeployedProcessDefinition(procDefId);
	}

	/**
	 * 获取子流程的第一个节点
	 *
	 * @param historicProcessInstance
	 * @param destActivity
	 * @return
	 */
	private ActivityImpl getCallSubProcessInActivity(ActivityImpl destActivity) {
		ActivityImpl activityImpl = null;
		String callActivityProcDefKey = ProcessDefinitionUtils.getCallActivityKey(destActivity);
		if (StringUtils.isNotEmpty(callActivityProcDefKey)) {
			// 获取子流最新版本流程定义
			ProcessDefinitionModel processDefinitionModel = processDefinitionService
					.getProcessDefBykey(callActivityProcDefKey);
			// 获取子流流程模型
			ReadOnlyProcessDefinition callActivityRpd = this
					.getDeployedProcessDefinition(processDefinitionModel.getProcDefId());
			// 获取开始节点
			activityImpl = ProcessDefinitionUtils
					.getCallSubProcessInitialActivity((ActivityImpl) callActivityRpd.getInitial());
		}
		return activityImpl;
	}

	/**
	 * 获取服务任务设置的子流程第一个节点
	 *
	 * @param historicProcessInstance
	 * @param destActivity
	 * @return
	 */
	private ActivityImpl getTaskServiceInActivity(ActivityImpl destActivity) {
		ActivityImpl activityImpl = null;
		ClassDelegate classDelegate = (ClassDelegate) destActivity.getActivityBehavior();
		String throughProcDefId = "";
		List<FieldDeclaration> fieldDeclarations = classDelegate.getFieldDeclarations();
		for (FieldDeclaration fieldDeclaration : fieldDeclarations) {
			if ("procDefIdText".equals(fieldDeclaration.getName())) {
				throughProcDefId = ((org.activiti.engine.impl.el.FixedValue) fieldDeclaration.getValue())
						.getExpressionText();
				break;
			}
		}
		ReadOnlyProcessDefinition throughRpd = this.getDeployedProcessDefinition(throughProcDefId);
		activityImpl = ProcessDefinitionUtils.getCallSubProcessInitialActivity((ActivityImpl) throughRpd.getInitial());
		return activityImpl;
	}
}
