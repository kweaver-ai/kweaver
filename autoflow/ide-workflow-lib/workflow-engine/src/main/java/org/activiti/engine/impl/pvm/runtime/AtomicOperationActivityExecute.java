/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.activiti.engine.impl.pvm.runtime;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.json.JsonObject;

import org.activiti.engine.delegate.event.ActivitiEventType;
import org.activiti.engine.delegate.event.impl.ActivitiEventBuilder;
import org.activiti.engine.impl.bpmn.behavior.ParallelMultiInstanceBehavior;
import org.activiti.engine.impl.bpmn.behavior.SequentialMultiInstanceBehavior;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.pvm.PvmException;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.logging.LogMDC;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.aishu.wf.core.doc.model.dto.ContivuousMultilevelDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyConfigService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.impl.TaskResourceService;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WfEngineUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;


/**
 * @author Tom Baeyens
 */
public class AtomicOperationActivityExecute implements AtomicOperation {

  private static Logger log = LoggerFactory.getLogger(AtomicOperationActivityExecute.class);

  public boolean isAsync(InterpretableExecution execution) {
    return false;
  }

	public void execute(InterpretableExecution execution) {
		ActivityImpl activity = (ActivityImpl) execution.getActivity();
		//by lw 2021-08
		changeActivityBehavior(execution, activity);
		ActivityBehavior activityBehavior = activity.getActivityBehavior();
		try {
			if (Context.getProcessEngineConfiguration() != null
					&& Context.getProcessEngineConfiguration().getEventDispatcher().isEnabled()) {
				Context.getProcessEngineConfiguration().getEventDispatcher()
						.dispatchEvent(ActivitiEventBuilder.createActivityEvent(ActivitiEventType.ACTIVITY_STARTED,
								execution.getActivity().getId(), (String) execution.getActivity().getProperty("name"),
								execution.getId(), execution.getProcessInstanceId(), execution.getProcessDefinitionId(),
								(String) activity.getProperties().get("type"),
								activity.getActivityBehavior().getClass().getCanonicalName()));
			}

			activityBehavior.execute(execution);
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			LogMDC.putMDCExecution(execution);
			throw new PvmException("couldn't execute activity <" + activity.getProperty("type") + " id=\""
					+ activity.getId() + "\" ...>: " + e.getMessage(), e);
		}
	}

	/**
	 * change activityBehavior by lw 2021-08
	 *
	 * @param execution
	 * @param activity
	 */
	private void changeActivityBehavior(InterpretableExecution execution, ActivityImpl activity) {
		ActivityBehavior activityBehavior = activity.getActivityBehavior();
		if (activityBehavior == null) {
			throw new PvmException("no behavior specified in " + activity);
		}
		if("startEvent".equals(activity.getProperty("type"))||"endEvent".equals(activity.getProperty("type"))){
			return;
		}
		// 若当前环节实例为连续多级，且审核结果不为拒绝，则不变更后续行为逻辑，直接返回
		// by hanj 2022-07
		String multiLevelDescription = (String) execution.getVariable("multiLevelDescription");
		if(null != multiLevelDescription && "multilevel".equals(multiLevelDescription)
				&& !"false".equals(String.valueOf(execution.getVariable("auditResult")))) {
			String dealType = (String) execution.getVariable("dealType");
			activity.setProperty("dealType", dealType);
			return;
		}
		if(execution.getBusinessKey()!=null&&execution.getBusinessKey().indexOf("gns")==-1) {
			return;
		}
		log.debug("{} executes {}: {}", execution, activity, activityBehavior.getClass().getName());
		ProcessInputModel input = WfEngineUtils.getWfprocessInputModel(execution.getVariables());
		// 注释租户为"as_workflow"逻辑限制，适配客户端流程中心（租户为个人）
		// by hanj 2022-05
		/*if (!input.getWf_appId().equals("as_workflow")) {
			return;
		}*/
		Map<String, Object> fields = input.getFields();
		DocShareStrategyService docShareStrategyService = (DocShareStrategyService) ApplicationContextHolder
				.getBean("docShareStrategyService");

		DocShareStrategyConfigService docShareStrategyConfigService = (DocShareStrategyConfigService) ApplicationContextHolder
				.getBean("docShareStrategyConfigService");

		DocShareStrategy docShareStrategy = null;
		try {
			docShareStrategy = docShareStrategyService.queryDocShareStrategy(input.getWf_procDefId(),
					activity.getId(), (String) fields.get("docId"), input.getWf_sendUserId(),(String) fields.get("docLibType"));
			List<DocShareStrategyConfig> strategyConfigs = docShareStrategyConfigService.listDocShareStrategyConfigByProcDefIDAndName(input.getWf_procDefId(), "sendBackSwitch");
			strategyConfigs = strategyConfigs.stream().filter(item -> item.getActDefId().equals(activity.getId())).collect(Collectors.toList());
			if (strategyConfigs.size() > 0) {
				docShareStrategy.setSendBackSwitch(strategyConfigs.get(0).getValue());
			}
		} catch (Exception e) {
			log.error("", e);
		}
		if (docShareStrategy == null || StringUtils.isEmpty(docShareStrategy.getAuditModel())) {
			return;
		}

		// 加签执行参数处理
		// by hanj 2023-01-29
		countersignExecutionVariable(execution, docShareStrategy);

		// 转审执行参数处理
		// by siyu.chen 2023/7/23
		transferExecutionVariable(execution, docShareStrategy);

		// 审核退回参数处理
		// by siyu.chen 2024/7/5
		sendBackExecutionVariable(execution, docShareStrategy);

		// 通过环节审核策略获取策略类型为连续多级，且审核结果不为拒绝，则构建当前环节实例参数，级别初始为1、审核员默认取第1级审核员、缓存连续多级审核员策略配置数据、
		// 审核模式（用于后续每个层级使用同一审核模式）、连续多级标识信息，
		// by hanj 2022-07
		if("multilevel".equals(docShareStrategy.getStrategyType()) && !"false".equals(String.valueOf(execution.getVariable("auditResult")))) {
			List<ContivuousMultilevelDTO> multilevelStrategyAssigneeList = docShareStrategyService.queryContinuousMultilevelStrategy(input.getWf_procDefId(),
					activity.getId(), input.getWf_starter());
			execution.setVariable("docShareStrategy", docShareStrategy);
			execution.setVariable("dealType", docShareStrategy.getAuditModel());
			activity.setProperty("dealType", docShareStrategy.getAuditModel());
			input.setWf_nextActDefType(docShareStrategy.getAuditModel());

			multilevelBehavior(execution, activity, multilevelStrategyAssigneeList);
			return;
		}

		// 逐级审核处理行为变更
		if (docShareStrategy.getAuditModel().equals("zjsh")) {
			if (activityBehavior instanceof SequentialMultiInstanceBehavior) {
				return;
			}
			ParallelMultiInstanceBehavior pmult=(ParallelMultiInstanceBehavior)activityBehavior;
			SequentialMultiInstanceBehavior sqmult=new SequentialMultiInstanceBehavior(activity,pmult.getInnerActivityBehavior());
			sqmult.setCollectionElementVariable(pmult.getCollectionElementVariable());
			sqmult.setCollectionExpression(pmult.getCollectionExpression());
			sqmult.setCompletionConditionExpression(pmult.getCompletionConditionExpression());
			sqmult.setCollectionVariable(pmult.getCollectionVariable());
			sqmult.setLoopCardinalityExpression(sqmult.getLoopCardinalityExpression());
			activity.setActivityBehavior(sqmult);
			activity.setProperty("multiInstance", "sequential");
		}
		activity.setProperty("dealType", docShareStrategy.getAuditModel());
		input.setWf_nextActDefType(docShareStrategy.getAuditModel());
	}

	/**
	 * multilevelBehavior by hanj 2022-07
	 *
	 * @param execution
	 * @param activity
	 * @param multilevelStrategyAssigneeList
	 */
	private void multilevelBehavior(InterpretableExecution execution, ActivityImpl activity,
			List<ContivuousMultilevelDTO> multilevelStrategyAssigneeList) {
		// 获取连续多级按过滤规则（文件密级、禁用的用户、不能审核自己等）进行过滤后的审核员集合
		TaskResourceService taskResourceService = (TaskResourceService) ApplicationContextHolder.getBean("taskResourceService");
		ProcessInputModel processInputModel = ProcessDefinitionUtils
				.getWfprocessInputModel((ExecutionEntity) execution);
		processInputModel.setWf_curActDefId(execution.getActivity().getId());
		List<String> userList = taskResourceService.getNextActivityUser(processInputModel);
		// 连续多级审核策略配置过滤各层级失效的审核员（按过滤规则过滤的审核员）
		for (ContivuousMultilevelDTO contivuousMultilevelDTO : multilevelStrategyAssigneeList) {
			List<String> multilevelAssigneeList = contivuousMultilevelDTO.getMultilevelAssigneeList();
			List<String> itemAssigneeList = new ArrayList<>();
			for (String multilevelAssignee : multilevelAssigneeList) {
				  boolean isExist = userList.stream().filter(userId -> multilevelAssignee.equals(userId)).findAny().isPresent();
				  if(isExist) {
					  itemAssigneeList.add(multilevelAssignee);
				  }
			}
			contivuousMultilevelDTO.setMultilevelAssigneeList(itemAssigneeList);
		}
		// 查询存在审核员的层级，设置审核员开始流程逐级审批
		String continuousMultilevel = null;
		List<String> assigneeList = new ArrayList<String>();
		List<ContivuousMultilevelDTO> multilevelStrategys = multilevelStrategyAssigneeList.stream()
				.sorted(Comparator.comparing(ContivuousMultilevelDTO::getLevel)).collect(Collectors.toList());
		for (ContivuousMultilevelDTO contivuousMultilevel : multilevelStrategys) {
			if(contivuousMultilevel.getMultilevelAssigneeList().size() > 0) {
				continuousMultilevel = contivuousMultilevel.getLevel();
				assigneeList = contivuousMultilevel.getMultilevelAssigneeList();
				break;
			}
		}
		execution.setVariable("continuousMultilevel", continuousMultilevel);
		execution.setVariable("multilevelAssigneeList", assigneeList);
		execution.setVariable("multilevelStrategyAssigneeList", JSONUtil.parseArray(multilevelStrategyAssigneeList));
		execution.setVariable("multiLevelDescription","multilevel");
	}

	/**
	 * countersignBehavior by hanj 2023-01
	 *
	 * @param execution
	 * @param docShareStrategy
	 */
	private void countersignExecutionVariable(InterpretableExecution execution, DocShareStrategy docShareStrategy) {
		if(docShareStrategy.getProcDefId().contains(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY) ||
				docShareStrategy.getProcDefId().contains(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)) {
			DictService dictService = (DictService) ApplicationContextHolder
					.getBean("dictService");
			String procDefKey = docShareStrategy.getProcDefId().contains(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY) ?
					WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY : WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY;
			DocShareStrategy shareStrategy = dictService.getShareCountersignStrategy(procDefKey);
			JSONObject jsonObj = new JSONObject();
			jsonObj.put("customType", "countersign");
			jsonObj.put("countersignSwitch", shareStrategy.getCountersignSwitch());
			jsonObj.put("maxCount", shareStrategy.getCountersignCount());
			jsonObj.put("maxAuditors", shareStrategy.getCountersignAuditors());
			execution.setVariable("customDescription", JSONUtil.toJsonStr(jsonObj));
		} else {
			JSONObject jsonObj = new JSONObject();
			jsonObj.put("customType", "countersign");
			jsonObj.put("countersignSwitch", docShareStrategy.getCountersignSwitch());
			jsonObj.put("maxCount", docShareStrategy.getCountersignCount());
			jsonObj.put("maxAuditors", docShareStrategy.getCountersignAuditors());
			execution.setVariable("customDescription", JSONUtil.toJsonStr(jsonObj));
		}

	}

	/**
	 * transferExecutionVariable by siyu.chen 2023-07
	 *
	 * @param execution
	 * @param docShareStrategy
	 */
	private void transferExecutionVariable(InterpretableExecution execution, DocShareStrategy docShareStrategy){
		JSONObject jsonObj = JSONUtil.parseObj(execution.getVariable("customDescription"));
		if(docShareStrategy.getProcDefId().contains(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY) ||
				docShareStrategy.getProcDefId().contains(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)) {
			DictService dictService = (DictService) ApplicationContextHolder
					.getBean("dictService");
			String procDefKey = docShareStrategy.getProcDefId().contains(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY) ?
					WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY : WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY;
			DocShareStrategy shareStrategy = dictService.getShareAdvancedConfigStrategy(procDefKey);
			JSONObject objInfo = new JSONObject();
			objInfo.put("transferSwitch", shareStrategy.getTransferSwitch());
			objInfo.put("maxCount", shareStrategy.getTransferCount());
			jsonObj.put("transfer", objInfo);
			execution.setVariable("customDescription", JSONUtil.toJsonStr(jsonObj));
		} else {
			JSONObject objInfo = new JSONObject();
			objInfo.put("transferSwitch", docShareStrategy.getTransferSwitch());
			objInfo.put("maxCount", docShareStrategy.getTransferCount());
			jsonObj.put("transfer", objInfo);
			execution.setVariable("customDescription", JSONUtil.toJsonStr(jsonObj));
		}
	}

	/**
	 * sendBackExecutionVariable by siyu.chen 2024-07
	 *
	 * @param execution
	 * @param docShareStrategy
	 */
	private void sendBackExecutionVariable(InterpretableExecution execution, DocShareStrategy docShareStrategy){
		JSONObject jsonObj = JSONUtil.parseObj(execution.getVariable("customDescription"));
		jsonObj.set("sendBackSwitch", docShareStrategy.getSendBackSwitch());
		execution.setVariable("customDescription", JSONUtil.toJsonStr(jsonObj));
	}
}
