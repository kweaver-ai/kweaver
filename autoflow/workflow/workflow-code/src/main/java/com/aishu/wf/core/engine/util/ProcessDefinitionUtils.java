package com.aishu.wf.core.engine.util;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ActivityReceiverModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.impl.ProcessExecuteServiceImpl;
import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.RepositoryServiceImpl;
import org.activiti.engine.impl.bpmn.behavior.CallActivityBehavior;
import org.activiti.engine.impl.bpmn.behavior.ParallelMultiInstanceBehavior;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.ReadOnlyProcessDefinition;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.ProcessDefinitionImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.util.*;

/**
 * 
 * 
 * @author lw
 */
public class ProcessDefinitionUtils {
	private static Logger logger = LoggerFactory.getLogger(ProcessDefinitionUtils.class);

	public static final String WF_ACTIVITY_TYPE_MULTI_INSTANCE="multiInstance";
	public static final String WF_ACTIVITY_TYPE_INITIAL="initial";
	
	
	/**
	 * 转换流程节点类型为中文说明
	 * 
	 * @param type
	 *            英文名称
	 * @return 翻译后的中文名称
	 */
	public static String parseToZhType(String type) {
		Map<String, String> types = new HashMap<String, String>();
		types.put("userTask", "用户任务");
		types.put("serviceTask", "服务任务");
		types.put("scriptTask", "脚本任务");
		types.put("startEvent", "开始节点");
		types.put("endEvent", "结束节点");
		types.put("exclusiveGateway", "条件判断节点(系统自动根据条件处理)");
		types.put("inclusiveGateway", "并行处理任务");
		types.put("callActivity", "子流程");
		return types.get(type) == null ? type : types.get(type);
	}
	
	
	/**
	 * 判断是否子流程
	 * @param processInputModel
	 * @return
	 */
	public static boolean isSubProcessStartEvent(ProcessInputModel processInputModel) {
		boolean isTaskFlag= BpmnXMLConstants.ELEMENT_SUBPROCESS.equals(processInputModel.getWf_nextActDefType());
		return isTaskFlag;
	}
	
	
/*	*//**
	 * 判断是否子流程
	 * @param activity
	 * @return
	 *//*
	public static boolean isSubProcessStartEvent(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_SUBPROCESS.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
	}*/
	
	
	/**
	 * 判断是否用户任务
	 * @param processInputModel
	 * @return
	 */
	public static boolean isUserTask(ProcessInputModel processInputModel) {
		boolean isTaskFlag=BpmnXMLConstants.ELEMENT_TASK_USER.equals(processInputModel.getWf_nextActDefType())
				||WF_ACTIVITY_TYPE_MULTI_INSTANCE.equals(processInputModel.getWf_nextActDefType());
		return isTaskFlag;
	}
	
	/**
	 * 判断是否用户任务
	 * @param processInputModel
	 * @return
	 */
	public static boolean isUserTask(String actDefType) {
		boolean isTaskFlag=BpmnXMLConstants.ELEMENT_TASK_USER.equals(actDefType)
				||WF_ACTIVITY_TYPE_MULTI_INSTANCE.equals(actDefType);
		return isTaskFlag;
	}
	/**
	 * 判断是否条件网关
	 * @param processInputModel
	 * @return
	 */
	public static boolean isExclusiveGateway(String actDefType) {
		boolean isTaskFlag=BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE.equals(actDefType);
		return isTaskFlag;
	}
	
	/**
	 * 判断是否条件网关
	 * @param processInputModel
	 * @return
	 */
	public static boolean isExclusiveGateway(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
	}
	
	/**
	 * 判断是否包容网关
	 * @param processInputModel
	 * @return
	 */
	public static boolean isInclusiveGateway(ActivityImpl activity) {
		if (activity == null)
			return false;
		boolean isTaskFlag=BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
		return isTaskFlag;
	}
	
	/**
	 * 判断是否包容网关
	 * @param processInputModel
	 * @return
	 */
	public static boolean isInclusiveGateway(String actDefType) {
		boolean isTaskFlag=BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE.equals(actDefType);
		return isTaskFlag;
	}

	/**
	 * 判断是否用户任务
	 * @param activity
	 * @return
	 */
	public static boolean isUserTask(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_TASK_USER.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
	}
	
	
	
	/**
	 * 判断是否多实例任务
	 * @param processInputModel
	 * @return
	 */
	public static boolean isMultiInstance(ProcessInputModel processInputModel,RepositoryService repositoryService) {
		RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) repositoryService;
		ReadOnlyProcessDefinition rpd = repositoryServiceImpl
				.getDeployedProcessDefinition(processInputModel.getWf_procDefId());
		PvmActivity pvmActivity = rpd.findActivity(processInputModel.getWf_nextActDefId());
		return isMultiInstance((ActivityImpl) pvmActivity);
	}
	/**
	 * 判断是否多实例任务
	 * @param activity
	 * @return
	 */
	public static boolean isMultiInstance(ActivityImpl activity) {
		if (activity == null)
			return false;
		String multiInstance = (String) activity.getProperty(WF_ACTIVITY_TYPE_MULTI_INSTANCE);
		return StringUtils.isNotEmpty(multiInstance);
	}
	
	/**
	 * 判断是否多实例任务
	 * @param activity
	 * @return
	 */
	public static boolean isMultiInstance(String activityType) {
		if (activityType == null)
			return false;
		return StringUtils.isNotEmpty(activityType)&&ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE.equals(activityType);
	}
	

	/**
	 * 判断是否结束节点
	 * @param activity
	 * @return
	 */
	public static boolean isEndEvent(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_EVENT_END.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
	}
	
	
	
	/**
	 * 判断是子流结束节点
	 * @param activity
	 * @return
	 */
	public static boolean isSubProcessEndEvent(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_EVENT_END.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
				&& (activity.getParentActivity() != null||activity.getOutgoingTransitions().size()>0);
	}
	
	/**
	 * 判断是否子流程开始节点
	 * @param activity
	 * @return
	 */
	public static boolean isSubProcessMultiInstance(ActivityImpl activity) {
		if (activity == null)
			return false;
		ActivityImpl startEvent=activity.getParentActivity();
		if(startEvent!=null&&BpmnXMLConstants.ELEMENT_SUBPROCESS.equals((String) startEvent.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))){
			return isMultiInstance(startEvent);
		}
		return false;
	}
	
	
	/**
	 * 判断是否子流程开始节点
	 * @param activity
	 * @return
	 */
	public static boolean isSubProcessStartEvent(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_SUBPROCESS.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
				&& activity.getProperty(WF_ACTIVITY_TYPE_INITIAL) != null;
	}
	
	/**
	 * 判断是否子流程开始用户任务
	 * @param activity
	 * @return
	 */
	public static boolean isSubProcessStartTask(ActivityImpl activity) {
		if (activity == null)
			return false;
		return activity.getParentActivity()!=null&&BpmnXMLConstants.ELEMENT_SUBPROCESS.equals((String) activity.getParentActivity().getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))
				&& activity.getProperty(WF_ACTIVITY_TYPE_INITIAL) != null;
	}
	/**
	 * 获取子流程开始用户节点
	 * @param activity
	 * @return
	 */
	public static ActivityImpl getSubProcessInitialActivity(
			ActivityImpl activity) {
		if (activity == null)
			return null;
		ActivityImpl startActivity = (ActivityImpl) activity
				.getProperty(WF_ACTIVITY_TYPE_INITIAL);
		if (startActivity != null) {
			List<PvmTransition> pvmTransitions = startActivity
					.getOutgoingTransitions();
			for (PvmTransition pvmTransition : pvmTransitions) {
				TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
				ActivityImpl destActivity = transitionImpl.getDestination();
				if (isUserTask(destActivity))
					return destActivity;
			}
		}
		return null;
	}
	/**
	 * 获取子流程输出环节
	 * @param activity
	 * @return
	 */
	public static ActivityImpl getSubProcessOutActivity(ActivityImpl activity) {
		if (activity == null)
			return null;
		ActivityImpl activityImpl = activity.getParentActivity();
		if (activityImpl != null) {
			List<PvmTransition> pvmTransitions = activityImpl
					.getOutgoingTransitions();
			for (PvmTransition pvmTransition : pvmTransitions) {
				TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
				ActivityImpl destActivity = transitionImpl.getDestination();
				if (isUserTask(destActivity))
					return destActivity;
			}
		}
		return null;
	}
	
	/**
	 * 判断是外部子流程结束节点
	 * @param historicProcessInstance
	 * @param activity
	 * @return
	 */
	public static boolean isCallSubProcessEndEvent(HistoricProcessInstance historicProcessInstance,ActivityImpl activity) {
		if (activity == null)
			return false;
		if(!isEndEvent(activity)){
			return false;
		}
		if(StringUtils.isEmpty(historicProcessInstance.getSuperProcessInstanceId())){
			return false;
		}
		return true;
	}
	
	/**
	 * 判断是外部子流程结束节点
	 * @param historicProcessInstance
	 * @param activity
	 * @return
	 */
	public static boolean isCallSubProcessEndEvent(ProcessInstanceModel processInstanceModel, ActivityImpl activity) {
		if (activity == null)
			return false;
		if(!isEndEvent(activity)){
			return false;
		}
		if(StringUtils.isEmpty(processInstanceModel.getParentProcInstId())){
			return false;
		}
		return true;
	}
	
	/**
	 * 判断是否包容网关
	 * @param processInputModel
	 * @return
	 */
	public static boolean isCallSubProcess(ActivityImpl activity) {
		if (activity == null)
			return false;
		return BpmnXMLConstants.ELEMENT_CALL_ACTIVITY.equals((String) activity.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE));
	}

	
	/**
	 * 获取外部子流程输出环节
	 * @param parentProcessDefinition
	 * @param endActivity
	 * @return
	 */
	public  static ActivityImpl getCallSubProcessOutActivity(ReadOnlyProcessDefinition parentProcessDefinition,
			ActivityImpl endActivity) {
		if (endActivity == null||parentProcessDefinition==null)
			return null;
		ProcessDefinitionImpl processDefinitionImpl=endActivity.getProcessDefinition();
		ActivityImpl callActivity=(ActivityImpl)findCallSubProcessActivity(parentProcessDefinition,processDefinitionImpl.getKey());
		if (callActivity==null)
			return null;
		List<PvmTransition> pvmTransitions = callActivity
				.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			if (isUserTask(destActivity)){
				String activityName = (String) destActivity.getProperty("name");
				String transitionName = (String) transitionImpl.getProperty("name");
				String name = StringUtils.isNotEmpty(transitionName) ? transitionName
						: (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
				destActivity.getProperties().put("name", name);
				return destActivity;
			}else if(ProcessDefinitionUtils.isEndEvent(destActivity)){
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
	 * 获取外部子流程开始用户节点
	 * @param initialActivity
	 * @return
	 */
	public  static ActivityImpl getCallSubProcessInitialActivity(
			ActivityImpl initialActivity) {
		if (initialActivity == null)
			return null;
		List<PvmTransition> pvmTransitions = initialActivity
				.getOutgoingTransitions();
		for (PvmTransition pvmTransition : pvmTransitions) {
			TransitionImpl transitionImpl = (TransitionImpl) pvmTransition;
			ActivityImpl destActivity = transitionImpl.getDestination();
			if (isUserTask(destActivity)){
				return destActivity;
			}
		}
		return null;
	}
	
	/**
	 * 获取外部子流程节点
	 * @param parentProcessDefinition
	 * @param procDefKey
	 * @return
	 */
	public  static ActivityImpl findCallSubProcessActivity(ReadOnlyProcessDefinition parentProcessDefinition,String procDefKey) {
		if (parentProcessDefinition == null)
			return null;
		ActivityImpl destActivity =null;
		List<ActivityImpl> activityImpls=(List<ActivityImpl>) parentProcessDefinition.getActivities();
		for (ActivityImpl activityImpl : activityImpls) {
			if (BpmnXMLConstants.ELEMENT_CALL_ACTIVITY.equals((String) activityImpl.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE))){
				ParallelMultiInstanceBehavior parallelMultiInstanceBehavior=(ParallelMultiInstanceBehavior) activityImpl.getActivityBehavior();
				CallActivityBehavior callActivityBehavior=(CallActivityBehavior)parallelMultiInstanceBehavior.getInnerActivityBehavior();
				if(procDefKey.equals(callActivityBehavior.getProcessDefinitonKey())){
					destActivity=activityImpl;
					break;
				}
			}
		}
		return destActivity;
	}

	/**
	 * 查询输出线上的同组织过滤属性
	 * @param transitionImpl
	 * @return
	 */
	public static String findTransitionUserSameOrgLevel(TransitionImpl transitionImpl) {
		if(transitionImpl==null){
			return "";
		}
		ExpandProperty expandProperty= findTransitionExpandProperty(transitionImpl, WorkFlowContants.ACTIVITY_USER_SAME_ORG_LEVEL);
		if(expandProperty==null)
			return "";
		return expandProperty.getValue();
	}

	/**
	 * 查询输出线上的输出线排序属性
	 * @param transitionImpl
	 * @return
	 */
	public static ExpandProperty findTransitionOrder(TransitionImpl transitionImpl) {
		return findTransitionExpandProperty(transitionImpl,WorkFlowContants.TRANSITION_DISPLAY_ORDER);
	}
	/**
	 * 查询输出线上的输出线排序属性
	 * @param transitionImpl
	 * @return
	 */
	public static ExpandProperty findTransitionOrder(List<ExpandProperty> expandProperties) {
		return findTransitionExpandProperty(expandProperties,WorkFlowContants.TRANSITION_DISPLAY_ORDER);
	}

	/**
	 * 查询输出线上的返回经办环节处理人属性
	 * @param transitionImpl
	 * @return
	 */
	public static ExpandProperty findTransitionReturnFormer(TransitionImpl transitionImpl) {
		return findTransitionExpandProperty(transitionImpl,WorkFlowContants.TRANSITION_RETURN_FORMER);
	}
	
	/**
	 * 获取输出线的扩张属性
	 * @param transitionImpl
	 * @return
	 */
	public static ExpandProperty findTransitionExpandProperty(TransitionImpl transitionImpl,String expandPropertyKey) {
		List<ExpandProperty> expandProperties=transitionImpl.getExpandPropertys();
		if (expandProperties == null || expandProperties.isEmpty()||StringUtils.isEmpty(expandPropertyKey))
			return null;
		for (ExpandProperty expandProperty : expandProperties) {
			if (expandProperty != null
					&& expandPropertyKey
							.equals(expandProperty.getId())) {
				return expandProperty;
			}
		}
		return null;
	}
	/**
	 *  获取扩张属性
	 * @param expandProperties
	 * @param expandPropertyKey
	 * @return
	 */
	public static ExpandProperty findTransitionExpandProperty(List<ExpandProperty> expandProperties,String expandPropertyKey) {
		if (expandProperties == null || expandProperties.isEmpty()||StringUtils.isEmpty(expandPropertyKey))
			return null;
		for (ExpandProperty expandProperty : expandProperties) {
			if (expandProperty != null
					&& expandPropertyKey
							.equals(expandProperty.getId())) {
				return expandProperty;
			}
		}
		return null;
	}
	
	/**
	 * 获取ProcessInputModel
	 * @param variables
	 * @return
	 */
	public static ProcessInputModel getWfprocessInputModel(
			TaskEntity delegateTask) {
		return getWfprocessInputModel(delegateTask
				.getVariables() != null ? delegateTask.getVariables()
						: delegateTask.getExecution().getVariables());
	}
	

	/**
	 * 获取ProcessInputModel
	 * @param variables
	 * @return
	 */
	public static ProcessInputModel getWfprocessInputModel(Map<String,Object> variables) {
		ProcessInputModel processInputModel = null;
		if (variables != null) {
			processInputModel = (ProcessInputModel) variables
					.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
		}
		if (processInputModel == null) {
			processInputModel = new ProcessInputModel();
		}
		return processInputModel;
	}
	
	/**
	 * 获取ProcessInputModel
	 * @param variables
	 * @return
	 */
	public static ProcessInputModel getWfprocessInputModel(ExecutionEntity processInfo) {
		return getWfprocessInputModel(processInfo
				.getVariables() != null ? processInfo.getVariables()
						: processInfo.getParent().getVariables());
	}
	
	/**
	 * 流程是否需要选择人员
	 * 
	 * @param activity
	 * @return
	 */
	public static boolean isNotSelectReceiver(ActivityImpl activity) {
		String actDefType = (String) activity
				.getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);
		return actDefType.equals(BpmnXMLConstants.ELEMENT_EVENT_END)
				|| actDefType.equals(BpmnXMLConstants.ELEMENT_TASK_SCRIPT)
				|| actDefType.equals(BpmnXMLConstants.ELEMENT_TASK_SERVICE)
				|| actDefType
						.equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE)
				|| actDefType.equals(BpmnXMLConstants.ELEMENT_GATEWAY_PARALLEL)
				|| actDefType
						.equals(BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE);
	}
	
	
	public  static boolean isStartUserTask(TaskEntity delegateTask){
		boolean isStartUserTask=false;
		if(delegateTask.getExecution().getProcessDefinition()!=null&&delegateTask.getExecution().getProcessDefinition().getInitial()!=null){
			List<PvmTransition> pvmTransitions=delegateTask.getExecution().getProcessDefinition().getInitial().getOutgoingTransitions();
			for (PvmTransition pvmTransition : pvmTransitions) {
				PvmActivity pvmStartActivity = pvmTransition.getDestination();
				if(pvmStartActivity!=null&&pvmStartActivity.getId().equals(delegateTask.getTaskDefinitionKey())){
					isStartUserTask=true;
					break;
				}
			}
		}
		return isStartUserTask;
	}

	public  static boolean isStartUserTask(String procDefId,String actId){
		boolean isStartUserTask=false;
		ProcessExecuteServiceImpl abstractServiceHelper=(ProcessExecuteServiceImpl) ApplicationContextHolder.getBean("processExecuteServiceImpl");
		ProcessDefinitionImpl processDefinition=(ProcessDefinitionImpl) abstractServiceHelper.getProcessDefinition(procDefId);
		if(processDefinition!=null&&processDefinition.getInitial()!=null){
			PvmTransition pvmTransition = processDefinition.getInitial().getOutgoingTransitions().get(
					0);
			PvmActivity pvmStartActivity = pvmTransition.getDestination();
			if(pvmStartActivity!=null&&pvmStartActivity.getId().equals(actId)){
				isStartUserTask=true;
			}
		}
		return isStartUserTask;
	}

	public  static boolean isStartUserTask(HistoricTaskInstance historicTask){
		boolean isStartUserTask=false;
		AbstractServiceHelper abstractServiceHelper=(AbstractServiceHelper) ApplicationContextHolder.getBean("abstractServiceHelper");
		ProcessDefinitionImpl processDefinition=(ProcessDefinitionImpl) abstractServiceHelper.getProcessDefinition(historicTask.getProcessDefinitionId());
		if(processDefinition!=null&&processDefinition.getInitial()!=null){
			PvmTransition pvmTransition = processDefinition.getInitial().getOutgoingTransitions().get(
					0);
			PvmActivity pvmStartActivity = pvmTransition.getDestination();
			if(pvmStartActivity!=null&&pvmStartActivity.getId().equals(historicTask.getTaskDefinitionKey())){
				isStartUserTask=true;
			}
		}
		return isStartUserTask;
	}
	
	
	public static void convertWf_receivers(ProcessInputModel processInputModel) {
		String receiver="";
		if(processInputModel.getWf_receivers()==null||processInputModel.getWf_receivers().isEmpty()){
			return;
		}
		for (ActivityReceiverModel activityReceiverModel : processInputModel.getWf_receivers()) {
			if(StringUtils.isEmpty(activityReceiverModel.getReceiveUserId())||StringUtils.isEmpty(activityReceiverModel.getReceiveUserOrgId())) {
				continue;
			}
			String accountId=activityReceiverModel.getReceiveUserId();
			receiver+=accountId+",";
		}
		receiver=receiver.lastIndexOf(",")!=-1?receiver.substring(0,receiver.lastIndexOf(",")):receiver;
		processInputModel.setWf_receiver(receiver);
	}
	
	public static void convertWf_receiver(ProcessInputModel processInputModel) {
		if(StringUtils.isEmpty(processInputModel.getWf_receiver())){
			return;
		}
		String[] receivers=null;
		if(processInputModel.getWf_receiver().indexOf(",")!=-1){
			receivers=processInputModel.getWf_receiver().split(",");
		}else{
			receivers=new String[]{processInputModel.getWf_receiver()};
		}
		List<ActivityReceiverModel> activityReceiverModels=new ArrayList<ActivityReceiverModel>();
		//UserService userService=(UserService) com.aishu.wf.core.common.util.ApplicationContextHolder.getBean("userServiceImpl");
		for (String receiver : receivers) {
			if(StringUtils.isEmpty(receiver)) {
				continue;
			}
			//User user=userService.getUserById(receiver);
			ActivityReceiverModel activityReceiverModel=new ActivityReceiverModel();
			activityReceiverModel.setReceiveUserId(receiver);
			/*activityReceiverModel.setReceiveUserId(user.getUserCode());
			activityReceiverModel.setReceiveUserOrgId(user.getOrgId());*/
			activityReceiverModels.add(activityReceiverModel);
		}
		processInputModel.setWf_receivers(activityReceiverModels);
	}
	
	public static String getCallActivityKey(ActivityImpl destActivity){
		String callActivityProcDefKey="";
		//普通子流
		if(destActivity.getActivityBehavior() instanceof CallActivityBehavior){
			callActivityProcDefKey=((CallActivityBehavior) destActivity
					.getActivityBehavior()).getProcessDefinitonKey();
		}else if(destActivity.getActivityBehavior() instanceof ParallelMultiInstanceBehavior){//多实例子流
			callActivityProcDefKey=((CallActivityBehavior) ((ParallelMultiInstanceBehavior) destActivity
					.getActivityBehavior()).getInnerActivityBehavior()).getProcessDefinitonKey();
		}
		return callActivityProcDefKey;
	}
	public static String base64ToString(String base)  {
		String str= null;
		try {
			str = new String(Base64.getDecoder().decode(base),"UTF-8");
		} catch (UnsupportedEncodingException e) {
		}
		String decode = java.net.URLDecoder.decode(str);
        return decode;
	}	
}
