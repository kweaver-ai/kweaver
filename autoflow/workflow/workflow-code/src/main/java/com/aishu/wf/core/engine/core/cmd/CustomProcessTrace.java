package com.aishu.wf.core.engine.core.cmd;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.history.HistoricActivityInstance;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.HistoricActivityInstanceQueryImpl;
import org.activiti.engine.impl.Page;
import org.activiti.engine.impl.RepositoryServiceImpl;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.process.ActivityImpl;

import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;

/**
 *获取流程轨迹，用于监控展现
 * @author lw
 */
public class CustomProcessTrace {
	private static String RUNNING = "1";//运行中
	private static String HISTORY = "2";//已执行
	private static String CANCELED = "5";//已作废
	private static String FINISH = "3";//已结束
	
	private static String ACTMULTI="multi";//多人处理环节
	private static String ACTCALL="call";//子流程处理环节
	

	public CustomProcessTrace() {
	}

	/**
	 * 获取某个流程轨迹，包含所有节点，执行状态等
	 * 
	 * @param processInstanceId
	 * @return
	 */
	public List<Map<String, Object>> getProcessTrace(String processInstanceId) {
		HistoricProcessInstance historicProcessInstance = Context.getCommandContext()
				.getHistoricProcessInstanceEntityManager().findHistoricProcessInstance(processInstanceId);
		String processDefinitionId = historicProcessInstance.getProcessDefinitionId();

		ProcessDefinitionEntity definition = Context.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		HistoricActivityInstanceQueryImpl historicActivityInstanceQueryImpl = new HistoricActivityInstanceQueryImpl();
		historicActivityInstanceQueryImpl.processInstanceId(processInstanceId)
				.orderByHistoricActivityInstanceStartTime().asc();
		Page page = new Page(0, 1000);
		List<HistoricActivityInstance> activityInstances = Context.getCommandContext()
				.getHistoricActivityInstanceEntityManager()
				.findHistoricActivityInstancesByQueryCriteria(historicActivityInstanceQueryImpl, page);
		Map<String, List<HistoricActivityInstance>> hisCallActivityMap = new HashMap<String, List<HistoricActivityInstance>>();
		Map<String, List<HistoricActivityInstance>> hisMultiActivityMap = new HashMap<String, List<HistoricActivityInstance>>();

		List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();

		for (HistoricActivityInstance historicActivityInstance : activityInstances) {
			Map<String, Object> hisActInstMap = new HashMap<String, Object>();
			String historicActivityId = historicActivityInstance.getActivityId();
			ActivityImpl activity = definition.findActivity(historicActivityId);
			boolean isCallSubProcessFlag = ProcessDefinitionUtils.isCallSubProcess(activity);
			boolean isMultiActivityFlag = ProcessDefinitionUtils.isMultiInstance(activity);
			if (isCallSubProcessFlag) {
				if (hisCallActivityMap.containsKey(historicActivityInstance.getExecutionId())) {
					((List<HistoricActivityInstance>) hisCallActivityMap.get(historicActivityInstance.getExecutionId()))
							.add(historicActivityInstance);
				} else {
					List<HistoricActivityInstance> hisCallActivitys = new ArrayList<HistoricActivityInstance>();
					hisCallActivitys.add(historicActivityInstance);
					hisCallActivityMap.put(historicActivityInstance.getExecutionId(), hisCallActivitys);
				}
			} else if (isMultiActivityFlag) {
				String key = historicActivityInstance.getProcessInstanceId() + historicActivityInstance.getActivityId();
				if (hisMultiActivityMap.containsKey(key)) {
					((List<HistoricActivityInstance>) hisMultiActivityMap.get(key)).add(historicActivityInstance);
				} else {
					List<HistoricActivityInstance> hisMultiActivitys = new ArrayList<HistoricActivityInstance>();
					hisMultiActivitys.add(historicActivityInstance);
					hisMultiActivityMap.put(key, hisMultiActivitys);
				}
			}
			if (activity != null && !(isCallSubProcessFlag || isMultiActivityFlag)) {
				String nodeColor = null;
				if (historicActivityId.equals(historicProcessInstance.getEndActivityId())
						&& SuspensionState.CANCELED.getStateCode() == historicProcessInstance.getProcState()) {// 节点已经作废
					nodeColor = CANCELED;
				} else if (historicActivityInstance.getEndTime() == null) { // 节点正在运行中
					nodeColor = RUNNING;
				} else {// 节点已经结束
					nodeColor = HISTORY;
				}
				hisActInstMap.put("activityId", historicActivityInstance.getActivityId());
				hisActInstMap.put("activityName", historicActivityInstance.getActivityName());
				hisActInstMap.put("status", nodeColor);
				hisActInstMap.put("type", activity.getProperty("type"));
				result.add(hisActInstMap);
			}
		}
		handleHistoryCallActivity(historicProcessInstance, hisMultiActivityMap, definition, result,ACTMULTI);
		handleHistoryCallActivity(historicProcessInstance, hisCallActivityMap, definition, result,ACTCALL);
		handleHistoryFlow(historicProcessInstance, activityInstances, processInstanceId, result);
		return result;
	}

	/**
	 * 处理多人节点、多子流程
	 * @param historicProcessInstance
	 * @param hisCallActivityMap
	 * @param definition
	 * @param result
	 * @param type 
	 */
	private void handleHistoryCallActivity(HistoricProcessInstance historicProcessInstance,
			Map<String, List<HistoricActivityInstance>> hisCallActivityMap, ProcessDefinitionEntity definition,
			List<Map<String, Object>> result, String type) {
		if (hisCallActivityMap.isEmpty()) {
			return;
		}
		for (Map.Entry<String, List<HistoricActivityInstance>> hisCallActivityEntry : hisCallActivityMap.entrySet()) {
			Map<String, Object> hisActInstMap = new HashMap<String, Object>();
			boolean isEnd = true;
			ActivityImpl activity = null;
			List<HistoricActivityInstance> hisCallActivitys = hisCallActivityEntry.getValue();
			for (HistoricActivityInstance historicActivityInstance : hisCallActivitys) {
				String historicActivityId = historicActivityInstance.getActivityId();
				activity = definition.findActivity(historicActivityId);
				if (null != activity) {
					if (historicActivityInstance.getEndTime() == null) {
						isEnd = false;
						break;
					}
				}
			}
			String nodeColor = null;
			if (null != activity && activity.getId().equals(historicProcessInstance.getEndActivityId())
					&& SuspensionState.CANCELED.getStateCode() == historicProcessInstance.getProcState()) {// 节点已经作废
				nodeColor = CANCELED;
			} else if (isEnd) {
				// 节点已经结束
				nodeColor = HISTORY;
			} else {
				nodeColor = RUNNING;
			}
			hisActInstMap.put("activityId", hisCallActivityEntry.getValue().get(0).getActivityId());
			hisActInstMap.put("activityName", hisCallActivityEntry.getValue().get(0).getActivityName());
			hisActInstMap.put("status", nodeColor);
			hisActInstMap.put("type", type);
			result.add(hisActInstMap);
		}

	}

	/**
	 * 处理节点输出线
	 * @param historicProcessInstance
	 * @param historicActivityInstances
	 * @param processInstanceId
	 * @param result
	 */
	private void handleHistoryFlow(HistoricProcessInstance historicProcessInstance,
			List<HistoricActivityInstance> historicActivityInstances, String processInstanceId,
			List<Map<String, Object>> result) {
		String processDefinitionId = historicProcessInstance.getProcessDefinitionId();

		ProcessDefinitionEntity processDefinition = Context.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		List<String> historicActivityInstanceList = new ArrayList<String>();

		for (HistoricActivityInstance hai : historicActivityInstances) {
			historicActivityInstanceList.add(hai.getActivityId());
		}

		List<ActivityImpl> activityImpls = new ArrayList<ActivityImpl>();
		addAllActivityImpl(processDefinition.getActivities(), activityImpls);
		// activities and their sequence-flows
		for (ActivityImpl activity : activityImpls) {
			int index = historicActivityInstanceList.indexOf(activity.getId());

			// 说明经过了这个节点，并且这个节点不是最后一个节点，所以可能有后续高亮的连线
			if ((index >= 0) && ((index + 1) < historicActivityInstanceList.size())) {
				List<PvmTransition> pvmTransitionList = activity.getOutgoingTransitions();

				for (HistoricActivityInstance srcHistoricActivityInstance : historicActivityInstances) {
					if ((!activity.getId().equals(srcHistoricActivityInstance.getActivityId()))
							|| (srcHistoricActivityInstance.getEndTime() == null)) {
						continue;
					}

					for (PvmTransition pvmTransition : pvmTransitionList) {
						String destinationFlowId = pvmTransition.getDestination().getId();
						Map<String, Object> hisActInstMap = new HashMap<String, Object>();
						for (HistoricActivityInstance destHistoricActivityInstance : historicActivityInstances) {
							long destStartTime = destHistoricActivityInstance.getStartTime().getTime();
							long srcEndTime = srcHistoricActivityInstance.getEndTime().getTime();
							long offset = destStartTime - srcEndTime;
							String type = destHistoricActivityInstance.getActivityType();

							if (type != null && type.equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE)) {
								// continue;
								// 不做处理
							} else if ((!destinationFlowId.equals(destHistoricActivityInstance.getActivityId()))
									|| (offset < 0) || (offset > 1000 && !srcHistoricActivityInstance.getActivityType()
											.equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE))) {
								// if(!srcHistoricActivityInstance.getActivityType().equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE)){
								continue;
								// }
							}
							if (!destinationFlowId.equals(destHistoricActivityInstance.getActivityId())) {
								continue;
							}
							hisActInstMap.put("activityId", pvmTransition.getId());
							hisActInstMap.put("activityName", "line");
							hisActInstMap.put("status", HISTORY);
							hisActInstMap.put("type", "SEQ");
							result.add(hisActInstMap);
						}
					}
				}
			}
		}
	}

	private void addAllActivityImpl(List<ActivityImpl> flowElements, List<ActivityImpl> allFlowElements) {
		for (ActivityImpl activityImpl : flowElements) {
			if ("subProcess".equals(activityImpl.getProperty("type"))) {
				allFlowElements.add(activityImpl);
				addAllActivityImpl(activityImpl.getActivities(), allFlowElements);
				continue;
			}
			allFlowElements.add(activityImpl);
		}
	}

}
