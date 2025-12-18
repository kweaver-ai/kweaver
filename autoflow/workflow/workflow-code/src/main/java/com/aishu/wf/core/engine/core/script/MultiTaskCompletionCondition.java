package com.aishu.wf.core.engine.core.script;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
public class MultiTaskCompletionCondition extends AbstractServiceHelper {
	@Autowired
	ActivityRuleManager activityRuleManager;
	@Autowired
	private GroovyScriptEngine groovyScriptEngine;
	private static boolean AUDIT_RESULT_TRUE = true;
	private static boolean AUDIT_RESULT_FALSE = false;
	private static String AUDIT_IDEA_TRUE = "true";
	private static String AUDIT_IDEA_FALSE = "false";
	//同级审核
	private static final String  DEAL_TYPE_TJSH="tjsh";
	//会签审核
	private static final String  DEAL_TYPE_HQSH="hqsh";
	//逐级审核
	private static final String  DEAL_TYPE_ZJSH="zjsh";
	//基于角色审核
	private static final String  DEAL_TYPE_RULE="rule";
	//下一步环节
	private static final String  NEXT_ACT_DEF_ID="nextActDefId";
	//结束节点
	private static final String  END_ACT_ID="EndEvent_1wqgipp";

	/**
	 * 计算多实例环节完成条件规则
	 *
	 * @param procDefId
	 * @param sourceActId
	 * @param conditionMap
	 * @return
	 */
	public boolean completionConditionByMultiTask(ActivityExecution execution, Map conditionMap) {
		boolean isCompletionFlag = false;
		PvmActivity activity = execution.getActivity();
		String dealType = (String) activity.getProperty("dealType");
		if (dealType.equals(DEAL_TYPE_TJSH)) {
			return tjshRule(execution, conditionMap);
		} else if (dealType.equals(DEAL_TYPE_HQSH)) {
			return hqshRule(execution, conditionMap);
		} else if (dealType.equals(DEAL_TYPE_ZJSH)) {
			return zjshRule(execution, conditionMap);
		} else if (dealType.equals(DEAL_TYPE_RULE)) {
			// return tjshRule( execution, conditionMap) ;
			customRule(execution.getProcessDefinitionId(), execution.getCurrentActivityId(), conditionMap);
		}
		return isCompletionFlag;
	}

	/**
	 * 同级审核
	 */
	private boolean tjshRule(ActivityExecution execution, Map conditionMap) {
		boolean auditResult = true;
		try {
			List processInputModels = (List) conditionMap.get("processInputModels");
			// processInputModels为多实例流程提交对象集合
			for (int i = 0; i < processInputModels.size(); i++) {
				// 获取单个实例流程提交对象，processInputModel中有应用提交到流程平台的所有参数，获取方式如getWf_procDefKey
				ProcessInputModel processInputModel = (ProcessInputModel) processInputModels.get(i);
				// 获取单个实例流程提交对象的表单数据，提交流程时传入fields中的数据
				Map<String, Object> bizDataMap = processInputModel.getFields();
				// 获取表单数据-意见类型ideaType
				String auditIdea = (String) bizDataMap.get("auditIdea");
				if (StringUtils.isEmpty(auditIdea)) {
					continue;
				}
				if (auditIdea.equals(AUDIT_IDEA_TRUE)) {
					auditResult = AUDIT_RESULT_TRUE;
				} else {
					auditResult = AUDIT_RESULT_FALSE;
					//拒绝直接跳转至结束节点
					Context.getCommandContext().addAttribute(NEXT_ACT_DEF_ID, END_ACT_ID);
				}
			}
		} catch (Exception e) {
			log.warn("tjshRule error", e);
		}
		execution.setVariable("auditResult", auditResult);
		return true;

	}

	/**
	 * 汇签审核
	 */
	private boolean hqshRule(ActivityExecution execution, Map conditionMap) {
		boolean intoNextAct = false;
		try {
			Integer nrOfInstances = (Integer) conditionMap.get("nrOfInstances");
			Integer nrOfCompletedInstances = (Integer) conditionMap.get("nrOfCompletedInstances");
			ProcessInputModel curProcessInputModel = (ProcessInputModel) conditionMap
					.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
			Map<String, Object> bizDataMap = curProcessInputModel.getFields();
			String auditIdea = (String) bizDataMap.get("auditIdea");
			if (StringUtils.isEmpty(auditIdea)) {
				return intoNextAct;
			}
			if (auditIdea.equals(AUDIT_IDEA_FALSE)) {
				execution.setVariable("auditResult", AUDIT_RESULT_FALSE);
				intoNextAct = true;
				//拒绝直接跳转至结束节点
				Context.getCommandContext().addAttribute(NEXT_ACT_DEF_ID, END_ACT_ID);
			} else if (nrOfInstances.equals(nrOfCompletedInstances)) {
				execution.setVariable("auditResult", AUDIT_RESULT_TRUE);
				intoNextAct = true;
			}
		} catch (Exception e) {
			log.warn("hqshRule error", e);
		}
		return intoNextAct;
	}

	/**
	 * 依次审核 业务代码只需要判断auditIdea为否决即可，所有审核员通过后会自动送下一环节（哪怕intoNextAct为false)
	 */
	private boolean zjshRule(ActivityExecution execution, Map conditionMap) {
		Integer nrOfInstances = (Integer) conditionMap.get("nrOfInstances");
		// Integer loopCounter = (Integer) conditionMap.get("loopCounter");
		Integer nrOfCompletedInstances = (Integer) conditionMap.get("nrOfCompletedInstances");
		boolean intoNextAct = false;
		try {
			ProcessInputModel curProcessInputModel = (ProcessInputModel) conditionMap
					.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
			Map<String, Object> bizDataMap = curProcessInputModel.getFields();
			String auditIdea = (String) bizDataMap.get("auditIdea");
			if (StringUtils.isEmpty(auditIdea)) {
				return intoNextAct;
			}
			if (auditIdea.equals(AUDIT_IDEA_FALSE)) {
				execution.setVariable("auditResult", AUDIT_RESULT_FALSE);
				intoNextAct = true;
				//拒绝直接跳转至结束节点
				Context.getCommandContext().addAttribute(NEXT_ACT_DEF_ID, END_ACT_ID);
			} else if (nrOfCompletedInstances.equals(nrOfInstances)) {
				execution.setVariable("auditResult", AUDIT_RESULT_TRUE);
			}
		} catch (Exception e) {
			log.warn("zjshRule error", e);
		}
		return intoNextAct;
	}

	/**
	 * 自定义规则
	 * 
	 * @param procDefId
	 * @param sourceActId
	 * @param conditionMap
	 * @return
	 */
	private boolean customRule(String procDefId, String sourceActId, Map conditionMap) {
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
			ProcessInputModel processInputModel = (ProcessInputModel) conditionMap
					.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
			if (processInputModel!=null) {
				Map<String, Object> fieldsMap = processInputModel.getFields();
				for (Map.Entry<String, Object> fieldEntry : fieldsMap.entrySet()) {
					if (conditionMap.get(fieldEntry.getKey()) == null) {
						conditionMap.put(fieldEntry.getKey(), fieldEntry.getValue());
					}
				}
			}
			isCompletionFlag = groovyScriptEngine.executeBoolean(ruleScript, conditionMap);
			if (isCompletionFlag) {
				log.info("环节完成规则脚本执行成功,ruleName：{},sourceActId:{},conditionMap:{},ruleScript:{}", ruleName,
						sourceActId, conditionMap, ruleScript);
			}
		} catch (Exception e) {
			log.warn("环节完成规则脚本执行失败,ruleName：{},sourceActId:{},conditionMap:{},ruleScript:{}", ruleName, sourceActId,
					conditionMap, ruleScript, e);
		}
		return isCompletionFlag;
	}

	// by lw
	public void setAssigneeList(ActivityExecution execution) {
		if (execution.getVariableLocal("assigneeList") != null) {
			return;
		}
		ProcessInputModel processInputModel = ProcessDefinitionUtils
				.getWfprocessInputModel((ExecutionEntity) execution);

		// 获取客户端接受人员列表
		String receiver = processInputModel.getWf_receiver();

		if (StringUtils.isNotEmpty(receiver) && !processInputModel.isWf_webAutoQueryNextUserFlag()) {
			// 输入、输出节点都是多实例的情况下,自动创建assigneeList变量
			if (processInputModel.getWf_curActDefType() != null
					&& processInputModel.getWf_curActDefType().equals("multiInstance")) {
				List<String> receiverList = convertReceivers(processInputModel.getWf_receiver());
				execution.createVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST, receiverList);
			}
			return;
		}

		List<String> receiverList = new ArrayList<String>();
		ProcessDefinitionService processDefinitionService = (ProcessDefinitionService) ApplicationContextHolder
				.getBean("processDefinitionServiceImpl");

		List<ActivityResourceModel> users = null;
		if (StringUtils.isEmpty(processInputModel.getWf_curActDefId())) {
			users = processDefinitionService.getResource(execution.getProcessDefinitionId(),
					execution.getCurrentActivityId());
		} else if (processInputModel.getWf_nextActDefType() != null
				&& processInputModel.getWf_nextActDefType().equals(BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE)) {
			users = processDefinitionService.getActivityUserTree(execution.getProcessInstanceId(),
					execution.getProcessDefinitionId(), processInputModel.getWf_curActInstId(),
					processInputModel.getWf_curActDefId(), execution.getCurrentActivityId(),
					processInputModel.getWf_sendUserId(), processInputModel.getWf_sendUserOrgId(), null,
					processInputModel.getFields());

		} else {
			users = processDefinitionService.getActivityUserTree(execution.getProcessInstanceId(),
					execution.getProcessDefinitionId(), processInputModel.getWf_curActInstId(),
					processInputModel.getWf_curActDefId(), processInputModel.getWf_nextActDefId(),
					processInputModel.getWf_sendUserId(), processInputModel.getWf_sendUserOrgId(), null,
					processInputModel.getFields());
		}
		if (users == null || users.isEmpty()) {
			throw new WorkFlowException(ExceptionErrorCode.S0001,
					"multiintsnace setAssigneeList error,getResource is empty,execution:"
							+ execution.getProcessDefinitionId() + "|" + execution.getCurrentActivityId());
		}
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				receiverList.add(treeNode.getRealId());
			}
		}
		execution.setVariableLocal("assigneeList", receiverList);

	}

	protected List<String> convertReceivers(String receiver) {
		String[] receiverArray = null;
		if (receiver.indexOf(",") != -1) {
			receiverArray = receiver.split(",");
		} else {
			receiverArray = new String[] { receiver };
		}
		List<String> receiverList = new ArrayList<String>(receiverArray.length);
		CollectionUtils.addAll(receiverList, receiverArray);
		return receiverList;
	}

}
