package com.aishu.wf.core.engine.util;

import java.util.ArrayList;
import java.util.List;

import org.activiti.bpmn.converter.BpmnXMLConverter;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.bpmn.model.ExtensionAttribute;
import org.activiti.bpmn.model.FieldExtension;
import org.activiti.bpmn.model.FlowElement;
import org.activiti.bpmn.model.Process;
import org.activiti.bpmn.model.SequenceFlow;
import org.activiti.bpmn.model.StartEvent;
import org.activiti.bpmn.model.SubProcess;
import org.activiti.bpmn.model.UserTask;
import org.apache.commons.lang3.StringUtils;

public class ProcessModelUtils {
	
	/**
	 * 查询第一个开始用户任务
	 * @param bpmnModel
	 * @return
	 */
	public static UserTask findStartUserTask(BpmnModel bpmnModel) {
		List<FlowElement> flowElements=(List<FlowElement>) bpmnModel.getMainProcess().getFlowElements();
	    for (FlowElement flowElement : flowElements) {
	    	if (!StartEvent.class.isInstance(flowElement)) {
				continue;
			}
	    	StartEvent startEvent = (StartEvent) flowElement;
	    	List<SequenceFlow> sequenceFlows=startEvent.getOutgoingFlows();
	    	for (SequenceFlow sequenceFlow : sequenceFlows) {
	    		UserTask userTask=findUserTask(bpmnModel,sequenceFlow.getTargetRef());
				if(userTask!=null){
					return userTask;
				}
			}
			
		}
	    return null;
	}
	/**
	 * 查询用户任务
	 * @param bpmnModel
	 * @param actId
	 * @return
	 */
	public static UserTask findUserTask(BpmnModel bpmnModel, String actId) {
		UserTask userTask = null;
		if (bpmnModel == null) {
			return userTask;
		}
		FlowElement flowElement = bpmnModel.getFlowElement(actId);
		if (flowElement == null) {
			return userTask;
		}
		if (!UserTask.class.isInstance(flowElement)) {
			return userTask;
		}
		userTask = (UserTask) flowElement;
		return userTask;
	}
	/**
	 * 判断是否子流程节点
	 * @param bpmnModel
	 * @param actId
	 * @return
	 */
	public static SubProcess isSubProcessAct(BpmnModel bpmnModel, String actId) {
		SubProcess subProcess = null;
		FlowElement foundFlowElement = null;
		for (Process process : bpmnModel.getProcesses()) {
			for (FlowElement flowElement : process
					.findFlowElementsOfType(SubProcess.class)) {
				foundFlowElement = getFlowElementInSubProcess(actId,
						(SubProcess) flowElement);
				if (foundFlowElement != null) {
					subProcess = (SubProcess) flowElement;
					break;
				}
			}
		}
		return subProcess;
	}
	
	
	/**
	 * 判断是否子流程开始节点
	 * @param bpmnModel
	 * @param actId
	 * @return
	 */

	public static SubProcess isSubProcessStartAct(BpmnModel bpmnModel,
			String actId) {
		SubProcess subProcess = null;
		FlowElement foundFlowElement = null;
		for (Process process : bpmnModel.getProcesses()) {
			for (FlowElement flowElement : process
					.findFlowElementsOfType(SubProcess.class)) {
				foundFlowElement = getFlowElementInSubProcess(actId,
						(SubProcess) flowElement);
				if (foundFlowElement != null) {
					subProcess = (SubProcess) flowElement;
					break;
				}
			}
		}
		if (subProcess == null) {
			return subProcess;
		}

		for (FlowElement flowElement : subProcess.getFlowElements()) {
			if (flowElement instanceof UserTask) {
				UserTask userTask = (UserTask) flowElement;
				List<SequenceFlow> sequenceFlows = userTask.getIncomingFlows();
				for (SequenceFlow sequenceFlow : sequenceFlows) {
					if ((bpmnModel.getFlowElement(sequenceFlow.getSourceRef()) instanceof StartEvent)
							&& userTask.getId().equals(actId)) {
						return subProcess;
					}
				}
			}
		}
		return null;
	}

	/**
	 * 判断节点ID是否属于某个子流程
	 * @param id
	 * @param subProcess
	 * @return
	 */
	public static FlowElement getFlowElementInSubProcess(String id,
			SubProcess subProcess) {
		FlowElement foundFlowElement = subProcess.getFlowElement(id);
		if (foundFlowElement == null) {
			for (FlowElement flowElement : subProcess.getFlowElements()) {
				if (flowElement instanceof SubProcess) {
					foundFlowElement = getFlowElementInSubProcess(id,
							(SubProcess) flowElement);
					if (foundFlowElement != null) {
						break;
					}
				}
			}
		}
		return foundFlowElement;
	}
	
	/**
	 * 查询扩展字段
	 * @param fieldExtensions
	 * @param id
	 * @return
	 */
	public static FieldExtension findFieldExtension(
			List<FieldExtension> fieldExtensions, String id) {
		FieldExtension fieldExtension = null;
		for (FieldExtension temp : fieldExtensions) {
			if (StringUtils.isEmpty(temp.getFieldName())) {
				continue;
			}
			if (temp.getFieldName().equals(id)) {
				fieldExtension = temp;
				break;
			}
		}
		return fieldExtension;
	}
	
	/**
	 * 删除扩展字段
	 * @param fieldExtensions
	 * @param id
	 */
	public static void removeFieldExtension(
			List<FieldExtension> fieldExtensions, String id) {

		for (int i = 0; i < fieldExtensions.size(); i++) {
			FieldExtension fieldExtension = fieldExtensions.get(i);
			if (StringUtils.isEmpty(fieldExtension.getFieldName())) {
				continue;
			}
			if (fieldExtension.getFieldName().equals(id)) {
				fieldExtensions.remove(i);
				break;
			}
		}
	}
	
	/**
	 * 查询自定义扩展字段
	 * @param expandPropertys
	 * @param expandPropertyId
	 * @return
	 */
	public static String getActDealType(FlowElement flowElement) {
		 ExpandProperty expandProperty = ProcessModelUtils.findExpandProperties(flowElement.getExpandProperties(),
 				"dealType");
		 String actDealType="";
 		if (expandProperty != null) {
 			actDealType=expandProperty.getValue();
 		}
		return actDealType;
	}
	
	/**
	 * 查询自定义扩展字段
	 * @param expandPropertys
	 * @param expandPropertyId
	 * @return
	 */
	public static ExpandProperty findExpandProperties(
			List<ExpandProperty> expandPropertys, String expandPropertyId) {
		ExpandProperty editExpandProperty = null;
		for (ExpandProperty expandProperty : expandPropertys) {
			if (StringUtils.isEmpty(expandProperty.getId())) {
				continue;
			}
			if (expandProperty.getId().equals(expandPropertyId)) {
				editExpandProperty = expandProperty;
				break;
			}
		}
		return editExpandProperty;
	}
	/**
	 * 新增自定义扩展字段
	 * @param sequenceFlow
	 * @param id
	 * @param value
	 * @param type
	 */
	public static void addExpandProperties(SequenceFlow sequenceFlow,
			String id, String value, String type) {
		removeExpandProperties(sequenceFlow.getExpandProperties(), id);
		if (StringUtils.isEmpty(value)) {
			return;
		}
		ExpandProperty TRANSITION_RETURN_FORMER = new ExpandProperty();
		TRANSITION_RETURN_FORMER.setId(id);
		TRANSITION_RETURN_FORMER.setType(type);
		TRANSITION_RETURN_FORMER.setValue(value);
		sequenceFlow.getExpandProperties().add(TRANSITION_RETURN_FORMER);
	}

	/**
	 * 过滤掉ACTIVITY_USER_SAME_ORG_LEVEL,TRANSITION_DISPLAY_ORDER,TRANSITION_RETURN_FORMER扩展字段
	 * @param sequenceFlow
	 */
	public static void filterExpandProperties(SequenceFlow sequenceFlow) {
		List<ExpandProperty> tempExpandPropertys = sequenceFlow
				.getExpandProperties();
		List<ExpandProperty> expandPropertys = new ArrayList<ExpandProperty>();
		for (ExpandProperty expandProperty : tempExpandPropertys) {
			if (!("ACTIVITY_USER_SAME_ORG_LEVEL".equals(expandProperty.getId())
					|| "TRANSITION_DISPLAY_ORDER"
							.equals(expandProperty.getId()) || "TRANSITION_RETURN_FORMER"
						.equals(expandProperty.getId()))) {
				expandPropertys.add(expandProperty);
			}
		}
		tempExpandPropertys.clear();
		tempExpandPropertys.addAll(expandPropertys);

	}
	
	/**
	 * 删除自定义扩展字段
	 * @param expandPropertys
	 * @param expandPropertyId
	 */
	public static void removeExpandProperties(
			List<ExpandProperty> expandPropertys, String expandPropertyId) {

		for (int i = 0; i < expandPropertys.size(); i++) {
			ExpandProperty expandProperty = expandPropertys.get(i);
			if (StringUtils.isEmpty(expandProperty.getId())) {
				continue;
			}
			if (expandProperty.getId().equals(expandPropertyId)) {
				expandPropertys.remove(i);
				break;
			}
		}
	}
	

	
	/**
	 * 过滤掉procDefIdText扩展字段
	 * @param tempFieldExtensions
	 */
	public static void filterFieldExtension(
			List<FieldExtension> tempFieldExtensions) {
		List<FieldExtension> fieldExtensions = new ArrayList<FieldExtension>();
		for (FieldExtension fieldExtension : tempFieldExtensions) {
			if (!("procDefIdText".equals(fieldExtension.getFieldName()))) {
				fieldExtensions.add(fieldExtension);
			}
		}
		tempFieldExtensions.clear();
		tempFieldExtensions.addAll(fieldExtensions);

	}


	public static byte[] convertBpmnModel(BpmnModel bpmnModel) {
		BpmnXMLConverter converter = new BpmnXMLConverter();
		return converter.convertToXML(bpmnModel);
	}
	
	
	public ExtensionAttribute setExtensionAttribute(String name,String value) {
		ExtensionAttribute extensionAttribute = new ExtensionAttribute();
		extensionAttribute.setName(name);
		extensionAttribute.setValue(value);
		extensionAttribute.setNamespace(org.activiti.bpmn.converter.util.BpmnXMLUtil.ACTIVITI_EXTENSIONS_NAMESPACE);
		extensionAttribute.setNamespacePrefix(org.activiti.bpmn.converter.util.BpmnXMLUtil.ACTIVITI_EXTENSIONS_PREFIX);
		return extensionAttribute;
	}
}
