package com.aishu.wf.core.engine.core.service;

import java.io.InputStream;
import java.util.List;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.validation.ValidationError;

import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * @description 流程模型Service
 * @author lw
 */
public interface ProcessModelService extends ActivitiService {
	
	/**
	 * 将流程对象模型转换成字节码
	 * 
	 * @param modelData
	 * @return byte[]
	 */
	public byte[] convertBpmnModelToByte(BpmnModel bpmnModel) throws WorkFlowException;

	/**
	 * 将流程对象模型转换成字节码
	 * 
	 * @param bpmnModel
	 * @param processDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public byte[] convertBpmnModelToByte(BpmnModel bpmnModel, String processDefId) throws WorkFlowException;

	/**
	 * 将流程文件转换成流程对象模型
	 * 
	 * @param modelData
	 * @return byte[]
	 */
	public BpmnModel convertFileToBpmnModel(InputStream in) throws WorkFlowException;

	public BpmnModel convertByteToBpmnModel(byte[] bpmnBytes, String processDefId);

	/**
	 * 获取流程对象模型
	 * 
	 * @param procDefId
	 * @return
	 */
	public BpmnModel getBpmnModelByProcDefId(String procDefId);

	/**
	 * 验证BPMN文件
	 * 
	 * @param in
	 * @return
	 */
	public List<ValidationError> validateBpmnXml(InputStream in);

	/**
	 * 验证BPMN模型
	 * 
	 * @param in
	 * @return
	 */
	public List<ValidationError> validateBpmnModel(BpmnModel bpmnModel);
	/**
	 * 同步流程对象模型至数据库表
	 *
	 * @param processDefinition
	 * @return
	 */
	public boolean syncBpmnModelToDb(ProcessDefinitionModel processDefinition, BpmnModel bpmnModel, String typeName, String userId,
									 String template, String tenantId);

	/**
	 * 根据Model部署流程
	 */
	public String deploy(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
						 List<DocShareStrategy> shareStrategyList, String type, String typeName,
						 String description, String userId, boolean isCopy,String template);

	/**
	 * 直接覆盖已有流程定义版本，并更新流程定义的缓存
	 */
	public String deployCascadeUpdate(byte[] bpmnBytes, String procDefId, String procDefName, List<DocShareStrategy> shareStrategyList,
			String type, String typeName, String description, String userId);


}
