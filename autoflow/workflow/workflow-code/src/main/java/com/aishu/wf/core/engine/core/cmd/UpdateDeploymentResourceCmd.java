package com.aishu.wf.core.engine.core.cmd;

import java.io.ByteArrayInputStream;
import java.io.Serializable;

import org.activiti.bpmn.converter.BpmnXMLConverter;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.engine.ProcessEngineConfiguration;
import org.activiti.engine.delegate.event.ActivitiEventType;
import org.activiti.engine.delegate.event.impl.ActivitiEventBuilder;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.DeploymentEntity;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.persistence.entity.ResourceEntity;
import org.activiti.engine.impl.persistence.entity.ResourceEntityManager;
import org.activiti.engine.impl.util.IoUtil;
import org.activiti.engine.impl.util.io.InputStreamSource;
import org.activiti.image.ProcessDiagramGenerator;
import org.activiti.image.impl.DefaultProcessDiagramGenerator;
import org.apache.commons.lang3.StringUtils;

/**
 * 更新流程模型
 * @author lw
 */
public class UpdateDeploymentResourceCmd implements Command<Void>, Serializable {

	private static final long serialVersionUID = 1L;
	protected String processDefinitionId;
	protected String deploymentId;
	protected byte[] resource;
	protected boolean isUpdateImage;

	public UpdateDeploymentResourceCmd(String deploymentId,String processDefinitionId, byte[] resource,boolean isUpdateImage) {
		this.deploymentId = deploymentId;
		this.processDefinitionId=processDefinitionId;
		this.resource=resource;
		this.isUpdateImage=isUpdateImage;
	}

	public Void execute(CommandContext commandContext) {
		if (deploymentId == null || processDefinitionId == null
				|| resource == null)
			return null;
		DeploymentEntity deployment = commandContext
				.getDeploymentEntityManager().findDeploymentById(deploymentId);
		ProcessDefinitionEntity processDefinitionEntity = commandContext
				.getProcessDefinitionEntityManager().findProcessDefinitionById(
						processDefinitionId);
		String diagramResourceName=processDefinitionEntity.getDiagramResourceName();
		if(StringUtils.isEmpty(diagramResourceName)) {
			diagramResourceName=processDefinitionEntity.getName()+"."+processDefinitionEntity.getKey()+".png";
			// Update name
			processDefinitionEntity.setDiagramResourceName(diagramResourceName);
			commandContext.getDbSqlSession().update(processDefinitionEntity);
			if (commandContext.getEventDispatcher().isEnabled()) {
				commandContext.getEventDispatcher().dispatchEvent(
						ActivitiEventBuilder
								.createEntityEvent(
										ActivitiEventType.ENTITY_UPDATED,
										processDefinitionEntity));
			}
		}
		// 更新流程模型
		deleteAndInsertResource(commandContext, deployment,
				processDefinitionEntity.getResourceName(), this.resource);
		ProcessEngineConfiguration processEngineConfiguration=commandContext.getProcessEngineConfiguration();
		/*
		 * if (isUpdateImage) { try { // 更新流程图片 BpmnXMLConverter converter = new
		 * BpmnXMLConverter(); BpmnModel bpmnModel = converter.convertToBpmnModel( new
		 * InputStreamSource( new ByteArrayInputStream(resource)), true, false);
		 * ProcessDiagramGenerator processDiagramGenerator = new
		 * DefaultProcessDiagramGenerator(); byte[] diagramBytes =
		 * IoUtil.readInputStream( processDiagramGenerator.generateDiagram(bpmnModel,
		 * "png", processEngineConfiguration.getActivityFontName(),
		 * processEngineConfiguration.getLabelFontName(), diagramResourceName,
		 * processEngineConfiguration.getClassLoader()), null);
		 * deleteAndInsertResource(commandContext,
		 * deployment,diagramResourceName,diagramBytes); } catch (Exception e) {
		 *  } }
		 */
		return null;
	}
	
	private void deleteAndInsertResource(CommandContext commandContext,DeploymentEntity deployment,String resourceName,byte[] bytes){
		ResourceEntityManager resourceEntityManager=commandContext.getResourceEntityManager();
		//删除老的bpmnResourceEntity
		ResourceEntity bpmnResourceEntity=resourceEntityManager.findResourceByDeploymentIdAndResourceName(deployment.getId(), resourceName);
		if(bpmnResourceEntity!=null) {
			commandContext.getByteArrayEntityManager().deleteByteArrayById(bpmnResourceEntity.getId());
		}else {
			bpmnResourceEntity=new ResourceEntity();
			bpmnResourceEntity.setName(resourceName);
		}
		//新增新的bpmnResourceEntity
		bpmnResourceEntity.setId(null);
		bpmnResourceEntity.setBytes(bytes);
		bpmnResourceEntity.setDeploymentId(deployment.getId());
		resourceEntityManager.insertResource(bpmnResourceEntity);
	}

}
