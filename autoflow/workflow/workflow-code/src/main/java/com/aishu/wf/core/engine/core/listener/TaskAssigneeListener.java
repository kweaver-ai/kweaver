package com.aishu.wf.core.engine.core.listener;

import java.util.List;
import java.util.Map;

import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessModelService;
import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.persistence.entity.VariableInstanceEntity;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ActivityReceiverModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * 全局设置任务接收人监听器
 * 
 * @version: 1.0
 * @author lw
 */
public class TaskAssigneeListener implements TaskListener {
	private static final long serialVersionUID = 1L;
	private Logger logger = LoggerFactory.getLogger(getClass());
	private int MULTI_INSTANCE_USER_TASK = 2;
	private int MULTI_INSTANCE_CALL_ACTIVITY = 0;
	private int MULTI_INSTANCE_NOMAL = 1;

	@Override
	public void notify(DelegateTask delegate) {
		if (!delegate.getEventName().equals(TaskListener.EVENTNAME_CREATE))
			return;
		TaskEntity delegateTask = (TaskEntity) delegate;
		logger.debug("触发了全局监听器, pid={}, tid={}, event={}", new Object[] {
				delegateTask.getProcessInstanceId(), delegateTask.getId(),
				delegateTask.getEventName() });
		try {
			// 获取客户端输入对象
			ProcessInputModel processInputModel = ProcessDefinitionUtils
					.getWfprocessInputModel(delegateTask);// 同步子流会返回数据
			logger.debug("分配人员processInputModel对象,processInputModel={}", new Object[] {processInputModel});
			// 获取客户端接受人员列表
			String receiver = processInputModel.getWf_receiver();
			receiver = (receiver == null ? "" : receiver);
			int isMultiFlag = isMultiFlag(delegateTask, receiver);
			ActivityImpl prevTask = delegateTask.getExecution()
					.getProcessDefinition()
					.findActivity(delegateTask.getPreTaskDefKey());
			boolean isPrevTaskService=prevTask!=null&&BpmnXMLConstants.ELEMENT_TASK_SERVICE
					.equals(prevTask.getProperty("type"));
			if ((StringUtils.isEmpty(receiver)
					&& isMultiFlag == MULTI_INSTANCE_NOMAL)||isPrevTaskService) {// 当客户端没有提交接受人且当前环节不是多实例任务时,自己找到环节绑定的资源
				// 系统自动查找接受人
				receiver = getGroupFirstReceiver(
						delegateTask.getProcessInstanceId(),
						delegateTask.getProcessDefinitionId(),
						delegateTask.getId(), delegateTask.getPreTaskDefKey(),
						delegateTask.getTaskDefinitionKey(),
						delegateTask.getSender(), delegate.getVariables());
				if (StringUtils.isEmpty(receiver)) {
					throw new WorkFlowException(ExceptionErrorCode.S0001,"自动查询环节人员为空，请检测环节配置或接口参数,delegate:"
							+ delegate);
				}
			}
			
			// 规则1:普通用户任务设置人员逻辑
			if (isMultiFlag == MULTI_INSTANCE_NOMAL) {
				if(receiver.indexOf(',')!=-1)
					throw new WorkFlowException(ExceptionErrorCode.B2063,"error receiver["+receiver+"] count.");
				setAssignee(delegateTask, processInputModel, receiver, MULTI_INSTANCE_NOMAL);
			} else if (isMultiFlag == MULTI_INSTANCE_CALL_ACTIVITY) {// 规则2:调用外部子流程-多实例任务设置人员逻辑
				ExecutionEntity executionEntity = delegateTask.getExecution()
						.getSuperExecution() != null ? delegateTask
						.getExecution().getSuperExecution() : delegateTask
						.getExecution();
				VariableInstanceEntity assigneeVar = (VariableInstanceEntity) executionEntity
						.getVariableInstances().get(
								WorkFlowContants.ELEMENT_ASSIGNEE);
				//setSubBusinessKey(delegateTask.getExecution(),processInputModel,assigneeVar.getTextValue());
				setAssignee(delegateTask, processInputModel,
						assigneeVar.getTextValue(), MULTI_INSTANCE_CALL_ACTIVITY);
			} else if (isMultiFlag == MULTI_INSTANCE_USER_TASK) {// 单环节多实例和内嵌子流程设置人员逻辑
				setAssignee(delegateTask, processInputModel,
						delegateTask.getAssignee(), MULTI_INSTANCE_USER_TASK);
			}
			// 设置上下文
			setTaskVariables(delegateTask);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2061,"setAssignee error,delegate:"
					+ delegate, e);
		}
	}

	/**
	 * 分配接受人
	 * 
	 * @param delegateTask
	 * @param processInputModel
	 * @param procDefKey
	 * @param tempReceiver
	 * @param type
	 */
	private void setAssignee(TaskEntity delegateTask,ProcessInputModel processInputModel,
			String tempReceiver, int type) {
		validateReceiver(tempReceiver);
		String receiver =tempReceiver;
		if (type == MULTI_INSTANCE_CALL_ACTIVITY) {
			delegateTask.setAssignee(receiver, true, false);
			logger.info("执行子流程分配人员策略, receiver={}, curtActInstId={},curtActDefId={}, preActDefId={}", new Object[] {
					receiver, delegateTask.getId(),delegateTask.getTaskDefinitionKey(),delegateTask.getPreTaskDefKey()});
		} else if (type == MULTI_INSTANCE_NOMAL) {
			// 不记录IdentityLink的设置接受人
			delegateTask.setAssigneeNotRecordIdentityLink(receiver);
			logger.info("执行单环节分配人员策略, receiver={}, curtActInstId={},curtActDefId={}, preActDefId={}", new Object[] {
					receiver, delegateTask.getId(),delegateTask.getTaskDefinitionKey(),delegateTask.getPreTaskDefKey()});
		} else if (type == MULTI_INSTANCE_USER_TASK && !receiver.equals(tempReceiver)) {// 处理单环节多实例逻辑,有委托才会需要重新设置一次接受人
			delegateTask.setAssigneeNotRecordIdentityLink(receiver);
			logger.info("执行单环节多实例和内嵌子流程分配人员策略, receiver={}, curtActInstId={},curtActDefId={}, preActDefId={}", new Object[] {
					receiver, delegateTask.getId(),delegateTask.getTaskDefinitionKey(),delegateTask.getPreTaskDefKey()});
		}
	}

	/**
	 * 获取环节绑定资源的第一个资源值
	 * 
	 * @param procInstId
	 * @param proceDefId
	 * @param curtTaskId
	 * @param curtActDefId
	 * @param nextActDefId
	 * @param userId
	 * @param conditionMap
	 * @return
	 */
	public String getGroupFirstReceiver(String procInstId, String proceDefId,
			String curtTaskId, String curtActDefId, String nextActDefId,
			String userId, Map conditionMap) {
		ProcessDefinitionService processDefinitionService = (ProcessDefinitionService) ApplicationContextHolder
					.getBean("processDefinitionServiceImpl");
		List<ActivityResourceModel> users = null;
		if (StringUtils.isEmpty(curtActDefId)) {
			users = processDefinitionService.getResource(proceDefId,
					nextActDefId);
		} else {
			users = processDefinitionService.getActivityUserTree(procInstId,
					proceDefId, curtTaskId, curtActDefId, nextActDefId,
					userId, "", null, conditionMap);
		}
		String reicever="";
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				reicever=  treeNode.getRealId();
				break;
			}
		}
		logger.info("执行自动查询人员策略, reicever={}, curtActDefId={}, nextActDefId={},curUserId={}", new Object[] {
				reicever, curtActDefId,nextActDefId,userId});
		return reicever;
	}

	/**
	 * 设置任务上下文变量
	 * 
	 * @param delegateTask
	 */
	private void setTaskVariables(TaskEntity delegateTask) {
		Map<String, Object> taskVariables = delegateTask.getVariables() != null ? delegateTask.getVariables()
				: delegateTask.getExecution().getVariables();
		for (Map.Entry<String, Object> variable : taskVariables.entrySet()) {
			if (StringUtils.isEmpty(variable.getKey()) || variable.getValue() == null) {
				continue;
			}
			if (!((variable.getKey().equals(WorkFlowContants.WF_BUSINESS_DATA_OBJECT_KEY))
					|| (variable.getKey().equals(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY)))) {
				continue;
			}
			// by lw start usertask not store WF_PROCESS_INPUT_VARIABLE_KEY

			if (WorkFlowContants.ACTION_TYPE_LAUCH_PROCESS.equals(delegateTask.getActionType())
					|| WorkFlowContants.ACTION_TYPE_LAUCH_SAVE_PROCESS.equals(delegateTask.getActionType())) {
				continue;
			}
			delegateTask.setVariableLocal(variable.getKey(), variable.getValue());
		}
	}

	private void validateReceiver(String receiver) {
		if (StringUtils.isEmpty(receiver) || "null".equals(receiver)
				|| "undefined".equals(receiver)) {
			throw new WorkFlowException(ExceptionErrorCode.B2062,"receiver的值为空或非法,receiver:" + receiver);
		}
	}

	private int isMultiFlag(TaskEntity delegateTask, String receiver) {
		boolean isCallActivityMultiInstance = false;
		boolean isSubProcessMultiInstance = false;
		//当通过流程管理重新分配人员,再执行下一步,再进行退回上一步时人员出错的逻辑判断
		if(WorkFlowContants.ACTION_TYPE_CALLBACK_PREV_ACTIVITY.equals(delegateTask.getActionType())&&StringUtils.isNotEmpty(receiver)){
			return MULTI_INSTANCE_NOMAL;
		}
		ActivityImpl curActivity = delegateTask.getExecution()
				.getProcessDefinition()
				.findActivity(delegateTask.getTaskDefinitionKey());
		// 获取是否单环节多人处理标记
		String multiInstance = (String) curActivity
				.getProperty(WorkFlowContants.ELEMENT_MULTIINSTANCE);
		if (StringUtils.isNotEmpty(multiInstance)) {
			return MULTI_INSTANCE_USER_TASK;
		}
		
		boolean isParallelGeteway = isGateway(delegateTask);
		// 调用外部子流程-多实例任务触发时,此时已是子流程的Execution,需要向上查找SuperExecution
		if (!isParallelGeteway
				&& delegateTask.getExecution().getSuperExecution() != null) {
			ExecutionEntity supperExecutionEntity = ((ExecutionEntity) delegateTask
					.getExecution().getSuperExecution());
			if (supperExecutionEntity != null) {
				isCallActivityMultiInstance = StringUtils
						.isNotEmpty((String) supperExecutionEntity
								.getActivity().getProperty(
										WorkFlowContants.ELEMENT_MULTIINSTANCE));
			}
			if (isCallActivityMultiInstance) {
				boolean isStartUserTask = ProcessDefinitionUtils
						.isStartUserTask(delegateTask);
				isCallActivityMultiInstance = isStartUserTask ? true : false;
			}
		} else if (delegateTask.getExecution().getParent() != null) {// 内部嵌套子流程多人处理
			ProcessModelService processModelService = (ProcessModelService) ApplicationContextHolder
					.getBean("processModelServiceImpl");
			ActivityImpl subActivity = delegateTask.getExecution().getParent()
					.getActivity();
			subActivity = subActivity == null ? delegateTask.getExecution()
					.getActivity().getParentActivity() : subActivity;
					if(subActivity!=null){
			boolean isSubProcess = BpmnXMLConstants.ELEMENT_SUBPROCESS
					.equals(subActivity.getProperty("type"));
			if (isSubProcess) {
				isSubProcessMultiInstance = StringUtils
						.isNotEmpty((String) subActivity
								.getProperty(WorkFlowContants.ELEMENT_MULTIINSTANCE))
						&& ProcessModelUtils.isSubProcessStartAct(
								processModelService
										.getBpmnModelByProcDefId(delegateTask
												.getProcessDefinitionId()),
								delegateTask.getTaskDefinitionKey()) != null;
			}
					}

		}
		if (isCallActivityMultiInstance) {
			return MULTI_INSTANCE_CALL_ACTIVITY;
		} else if (isSubProcessMultiInstance) {
			return MULTI_INSTANCE_USER_TASK;
		} else {
			return MULTI_INSTANCE_NOMAL;
		}

	}

	private boolean isGateway(TaskEntity delegateTask) {
		boolean isParallelGeteway = false;
		if (StringUtils.isNotEmpty(delegateTask.getPreTaskDefKey())) {
			ActivityImpl activityImpl = delegateTask.getExecution()
					.getProcessDefinition()
					.findActivity(delegateTask.getPreTaskDefKey());
			if (activityImpl != null) {
				isParallelGeteway = BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE
						.equals(activityImpl.getProperty("type"))
						|| BpmnXMLConstants.ELEMENT_GATEWAY_PARALLEL
								.equals(activityImpl.getProperty("type"));
			}
		}
		return isParallelGeteway;
	}
	

}