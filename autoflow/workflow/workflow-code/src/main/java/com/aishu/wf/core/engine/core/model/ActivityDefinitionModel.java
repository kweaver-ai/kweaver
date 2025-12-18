package com.aishu.wf.core.engine.core.model;

import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.core.model.cache.ProcessMgrDataShare;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.activiti.engine.task.Task;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 流程环节定义模型
 *
 * @author lw
 */
@Data
@ApiModel(value = "流程环节定义对象")
public class ActivityDefinitionModel implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "流程定义ID", example = "Process_QM57BLUS:4:d3cc8f02-7c92-11eb-9bd1-00ff1601c9e0")
    String procDefId;

    @ApiModelProperty(value = "流程定义名称", example = "文件共享流程")
    String procDefName;

    @ApiModelProperty(value = "环节定义ID", example = "UserTask_1eit5rd")
    String actDefId;

    @ApiModelProperty(value = "环节定义名称", example = "审核")
    String actDefName;

    @ApiModelProperty(value = "描述", example = "我是环节定义描述")
    String description;

    @ApiModelProperty(value = "优先级", example = "1")
    int priority;

    @ApiModelProperty(value = "环节类型", example = "")
    String actType;

    @ApiModelProperty(value = "审核模式", example = "")
    String dealType;

    @ApiModelProperty(value = "是否多人处理", example = "true")
    boolean isMulti;

    @ApiModelProperty(value = "是否同步模型", example = "false")
    boolean isAsync;

    @ApiModelProperty(value = "客户端是否可以不传递人员来执行流程", example = "false")
    boolean isNotSelectReceiver;

    @ApiModelProperty(value = "环节配置对象")
    private ActivityInfoConfig activityInfoConfig;

    @ApiModelProperty(value = "环节配置对象")
    private List<ActivityResourceModel> activityResources;

    @ApiModelProperty(value = "环节定义变量")
    protected Map<String, Object> variables;


    public static ActivityDefinitionModel build(PvmActivity pvmActivity) {
        ActivityDefinitionModel activityDefinition = new ActivityDefinitionModel();
        if (pvmActivity == null) {
            /**
             * 当流程管理中删除流程定义时,如果该流程的环节ID有变更,那么pvmActivity对象可能为Null
             * 为了不影响删除逻辑此处不抛出异常(通过前端在ProcessMgrDataShare中设置PROCESS_DEF_DEL_MANAGE_OPT标识来判断)
             * ProcessMgrDataShare.setProcessMgrData(PROCESS_DEF_DEL_MANAGE_OPT)在ProcessDefinitionController.delete()方法中
             */
            Object obj = ProcessMgrDataShare.getProcessMgrData();
            if (obj != null && WorkFlowContants.PROCESS_DEF_DEL_MANAGE_OPT.equals(obj)) {
                return null;
            }
            throw new WorkFlowException(ExceptionErrorCode.B2003, "activity is not found");
        }
        ActivityImpl activityImpl = (ActivityImpl) pvmActivity;
        activityDefinition.actDefId = activityImpl.getId();
        String actDefName = (String) activityImpl.getProperty("name");
        if (StringUtils.isEmpty(actDefName)) {
            actDefName = "结束";
        }
        activityDefinition.actDefName = actDefName;
        String destActivityType = (String) activityImpl
                .getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);

        if (ProcessDefinitionUtils.isMultiInstance(activityImpl)) {// 是否多实例类型
            destActivityType = ProcessDefinitionUtils.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
        }
        activityDefinition.isMulti = ProcessDefinitionUtils.isMultiInstance(activityImpl);
        activityDefinition.isNotSelectReceiver = ProcessDefinitionUtils.isNotSelectReceiver(activityImpl);
        activityDefinition.isAsync = pvmActivity.isAsync();
        activityDefinition.actType = destActivityType;
        activityDefinition.procDefId = activityImpl.getProcessDefinition().getId();
        activityDefinition.procDefName = activityImpl.getProcessDefinition().getName();
        activityDefinition.variables = new HashMap();
        activityDefinition.dealType= Optional.ofNullable(activityImpl.getProperty("dealType")).orElse("").toString();
        //super.build((ProcessDefinition) activityImpl.getProcessDefinition());
        return activityDefinition;
    }


    public static ActivityDefinitionModel build(PvmActivity pvmActivity,
                                                TransitionImpl transitionImpl) {
        ActivityDefinitionModel activityDefinition = new ActivityDefinitionModel();
        if (pvmActivity == null)
            return activityDefinition;
        ActivityImpl activityImpl = (ActivityImpl) pvmActivity;
        activityDefinition.actDefId = activityImpl.getId();
        // 环节名称:当转移线上的名称不为空时,使用它作为环节名称,否则使用任务定义名称
        String activityName = (String) activityImpl.getProperty("name");
        String transitionName = (String) transitionImpl.getProperty("name");
        activityDefinition.variables = new HashMap<String, Object>();
        String nextActAlias = "";
        if (transitionImpl != null && !transitionImpl.getExpandPropertys().isEmpty()) {
            ExpandProperty expandProperty = ProcessDefinitionUtils
                    .findTransitionExpandProperty(transitionImpl, "TRANSITION_NEXTACT_ALIAS");
            if (expandProperty != null) {
                nextActAlias = expandProperty.getValue();
                activityDefinition.variables.put("nextActAlias", nextActAlias);
            }
        }
        String name = StringUtils.isNotEmpty(transitionName) ? transitionName
                : (StringUtils.isNotEmpty(activityName) ? activityName : "送结束");
        activityDefinition.actDefName = name;
        activityDefinition.actType = (String) activityImpl
                .getProperty(BpmnXMLConstants.ATTRIBUTE_TYPE);
        activityDefinition.isAsync = pvmActivity.isAsync();
        activityDefinition.isMulti = ProcessDefinitionUtils.isMultiInstance(activityImpl);
        ;
        activityDefinition.isNotSelectReceiver = ProcessDefinitionUtils.isNotSelectReceiver(activityImpl);
        activityDefinition.setDescription(activityName);
        //super.build((ProcessDefinition) activityImpl.getProcessDefinition());

        return activityDefinition;
    }


    public static ActivityDefinitionModel build(Task tempTask) {
        ActivityDefinitionModel activityDefinition = new ActivityDefinitionModel();
        TaskEntity task = null;
        if (tempTask == null)
            return activityDefinition;
        task = (TaskEntity) tempTask;
        activityDefinition.actDefId = task.getTaskDefinitionKey();
        String actDefName = task.getName();
        if (StringUtils.isEmpty(actDefName)) {
            actDefName = "结束";
        }
        activityDefinition.actDefName = actDefName;
	/*	String destActivityType = (String) task.get
				.getProperty(WorkFlowContants.WF_ACTIVITY_TYPE_KEY);

		if (ProcessDefinitionUtils.isMultiInstance(activityImpl)) {// 是否多实例类型
			destActivityType = WorkFlowContants.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
		}
		this.isMulti = ProcessDefinitionUtils.isMultiInstance(activityImpl);
		this.isAsync=pvmActivity.isAsync();
		this.activityType = destActivityType;*/
        activityDefinition.procDefName = task.getProcessDefinitionName();
        activityDefinition.procDefId = task.getProcessDefinitionId();
        activityDefinition.variables = new HashMap();
        return activityDefinition;
    }

    public ActivityDefinitionModel build(HistoricTaskInstance tempTask) {
        ActivityDefinitionModel activityDefinition = new ActivityDefinitionModel();
        HistoricTaskInstance task = null;
        if (tempTask == null)
            return activityDefinition;
        task = (HistoricTaskInstance) tempTask;
        activityDefinition.actDefId = task.getTaskDefinitionKey();
        String actDefName = task.getName();
        if (StringUtils.isEmpty(actDefName)) {
            actDefName = "结束";
        }
        activityDefinition.actDefName = actDefName;
	/*	String destActivityType = (String) task.get
				.getProperty(WorkFlowContants.WF_ACTIVITY_TYPE_KEY);

		if (ProcessDefinitionUtils.isMultiInstance(activityImpl)) {// 是否多实例类型
			destActivityType = WorkFlowContants.WF_ACTIVITY_TYPE_MULTI_INSTANCE;
		}
		this.isMulti = ProcessDefinitionUtils.isMultiInstance(activityImpl);
		this.isAsync=pvmActivity.isAsync();
		this.activityType = destActivityType;*/
        activityDefinition.procDefId = task.getProcessDefinitionId();
        activityDefinition.procDefName = task.getProcessDefinitionName();
        activityDefinition.variables = new HashMap();
        return activityDefinition;
    }

}
