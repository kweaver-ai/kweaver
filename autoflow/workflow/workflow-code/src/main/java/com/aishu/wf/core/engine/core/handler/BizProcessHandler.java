package com.aishu.wf.core.engine.core.handler;

import java.util.List;
import java.util.Map;

import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;

/**
 * 业务应用回调处理接口
 * @version:  1.0
 * @author lw 
 */
public interface BizProcessHandler {
	/**
	 * 流程提交之后的业务回调方法
	 * @param processInputModel		流程输入模型
	 */
	void submitProcessAfter(ProcessInstanceModel processInstanceModel);
	/**
	 * 流程提交之前的业务回调方法
	 * @param processInputModel		流程输出模型
	 */
	void submitProcessBefore(ProcessInputModel processInputModel);
	
	/**
	 * 选择下一步环节时在此方法中可过滤掉下一环节人员
	 * @param activityResources		流程平台传入下一环节待选人员
	 * @param processInstanceModel	流程实例模型
	 * @param userId				当前登录用户ID
	 * @param conditionMap			界面传入的fields
	 */
	void filterNextStepUserTree(List<ActivityResourceModel> activityResources,ProcessInstanceModel processInstanceModel,String userId,Map<String,Object> fieldsMap);
	/**
	 * 选择下一步环节时在此方法中可过滤掉下一环节
	 * @param activityDefinitionModel		流程平台传入下一环节
	 * @param processInstanceModel	流程实例模型
	 * @param conditionMap			界面传入的fields
	 */
	void filterNextStep(List<ActivityDefinitionModel> activityDefinitionModel,ProcessInstanceModel processInstanceModel,Map<String,Object> fieldsMap);

	
}
