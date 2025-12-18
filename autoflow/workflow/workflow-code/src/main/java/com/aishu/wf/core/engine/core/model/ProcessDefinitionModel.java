package com.aishu.wf.core.engine.core.model;

import java.io.Serializable;
import java.util.Date;

import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.repository.Deployment;
import org.activiti.engine.repository.ProcessDefinition;
import org.apache.commons.lang3.StringUtils;

import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.util.WorkFlowException;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 流程定义模型
 *
 * @author lw
 * @version: 1.0
 */
@ApiModel(value = "流程定义模型")
@Data
public class ProcessDefinitionModel implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "流程定义ID", example = "Process_FXZ59TKT:1:7286e791-78a6-11eb-8fc3-0242ac12000f")
    String procDefId;

    @ApiModelProperty(value = "流程定义KEY", example = "Process_FXZ59TKT")
    String procDefKey;

    @ApiModelProperty(value = "流程名称", example = "流程配置对象")
    String procDefName;

    @ApiModelProperty(value = "流程分组ID", example = "353675-7bf7-11eb-a791-0242ac120007")
    String category;

    @ApiModelProperty(value = "流程描述", example = "我是流程描述")
    String description;

    @ApiModelProperty(value = "流程版本", example = "1")
    int version;

    @ApiModelProperty(value = "流程定义创建时间", example = "2021-02-22 13:41:50")
    Date pdCreateTime;

    @ApiModelProperty(value = "流程部署ID", example = "68101ee8-80cd-11eb-b83a-0242ac12000c")
    String deploymentId;

    @ApiModelProperty(value = "租户ID", example = "workflow")
    String tenantId;

    @ApiModelProperty(value = "流程配置对象")
    private ProcessInfoConfig processInfoConfig;

    public ProcessDefinitionModel build(ProcessDefinitionModel processDefinitionModel) {
        if (processDefinitionModel == null)
            return this;
        return processDefinitionModel;
    }

    /**
     * 构建ProcessDefinitionModel对象属性
     *
     * @param processDefinition
     * @return
     */
    public static ProcessDefinitionModel build(ProcessDefinition processDefinition) {
        ProcessDefinitionModel processDefinitionModel = new ProcessDefinitionModel();
        if (processDefinition == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "processDefinition is null");
        }
        if (StringUtils.isEmpty(processDefinition.getId())) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "processDefinition id is null");
        }
        processDefinitionModel.procDefId = processDefinition.getId();
        processDefinitionModel.procDefKey = processDefinition.getKey();
        processDefinitionModel.procDefName = processDefinition.getName();
        processDefinitionModel.version = processDefinition.getVersion();
        processDefinitionModel.tenantId = processDefinition.getTenantId();
        processDefinitionModel.description = processDefinition.getDescription();
        processDefinitionModel.deploymentId = processDefinition.getDeploymentId();
        processDefinitionModel.category=processDefinition.getCategory();
        return processDefinitionModel;
    }


    /**
     * 构建ProcessDefinitionModel对象属性
     *
     * @param
     * @return
     */
    public static ProcessDefinitionModel build(HistoricProcessInstance processInstance) {
        ProcessDefinitionModel processDefinitionModel = new ProcessDefinitionModel();
        if (processInstance == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "processInstance is null");
        }
        if (StringUtils.isEmpty(processInstance.getProcessDefinitionId())) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "processDefinition id is null");
        }
        processDefinitionModel.procDefId = processInstance.getProcessDefinitionId();
        processDefinitionModel.procDefKey = processInstance.getProcessDefinitionName();
		
		/*this.processDefinitionKey=processDefinition.getKey();
		this.processDefinitionName=processDefinition.getName();
		this.hasStartFormKey=processDefinition.hasStartFormKey();
		this.isSuspended=processDefinition.isSuspended();
		this.version=processDefinition.getVersion();
		this.tenantId=processDefinition.getTenantId();
		this.diagramResourceName=processDefinition.getDiagramResourceName();
		this.resourceName=processDefinition.getResourceName();
		this.description=processDefinition.getDescription();
		this.category=processDefinition.getCategory();
		this.deploymentId=processDefinition.getDeploymentId();*/
        return processDefinitionModel;
    }

    /**
     * 构建ProcessDefinitionModel对象属性
     *
     * @param processDefinition
     * @return
     */
    public static ProcessDefinitionModel build(ProcessDefinition processDefinition, Deployment deployment) {
        ProcessDefinitionModel processDefinitionModel = new ProcessDefinitionModel();
        if (processDefinition == null || deployment == null)
            return processDefinitionModel;
        processDefinitionModel.procDefId = processDefinition.getId();
        processDefinitionModel.procDefKey = processDefinition.getKey();
        processDefinitionModel.procDefName = processDefinition.getName();
        processDefinitionModel.version = processDefinition.getVersion();
        processDefinitionModel.tenantId = processDefinition.getTenantId();
        processDefinitionModel.description = processDefinition.getDescription();
        processDefinitionModel.deploymentId = processDefinition.getDeploymentId();
        processDefinitionModel.pdCreateTime = deployment.getDeploymentTime();

        //this.category=processDefinition.getCategory();
	/*	this.isSuspended=processDefinition.isSuspended();
		this.diagramResourceName=processDefinition.getDiagramResourceName();
		this.resourceName=processDefinition.getResourceName();
		this.deploymentId=processDefinition.getDeploymentId();
		//deployment property
		this.deploymentName=deployment.getName();
		this.deploymentCategory=deployment.getCategory();*/
        return processDefinitionModel;
    }

}
