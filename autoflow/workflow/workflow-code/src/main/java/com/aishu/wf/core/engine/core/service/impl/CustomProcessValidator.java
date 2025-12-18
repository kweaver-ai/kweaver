package com.aishu.wf.core.engine.core.service.impl;

import java.util.Collection;

import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.CallActivity;
import org.activiti.bpmn.model.FlowElement;
import org.activiti.bpmn.model.Process;
import org.activiti.bpmn.model.SubProcess;
import org.activiti.bpmn.model.UserTask;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.core.service.ProcessModelService;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User;


@Service
public class CustomProcessValidator {

	@Autowired
	private ProcessModelService processModelService;

	@Autowired
	private RoleService roleService;

	@Autowired
	private UserService userService;

	@Autowired
	private OrgService orgService;

	public String validate(String processDefId) {
		BpmnModel bpmnModel = processModelService.getBpmnModelByProcDefId(processDefId);
		Process process = bpmnModel.getMainProcess();
		StringBuffer resultBuf = new StringBuffer();
		validate(process.getFlowElements(),resultBuf);
		return resultBuf.toString();
	}
	
	private void validate(Collection<FlowElement> flowElements,StringBuffer resultBuf){
		for (FlowElement flowElement : flowElements) {
			if (!UserTask.class.isInstance(flowElement)&&!SubProcess.class.isInstance(flowElement)) {
				continue;
			}
			if(SubProcess.class.isInstance(flowElement)){
				validate(((SubProcess)flowElement).getFlowElements(),resultBuf);
				continue;
			}
			if(CallActivity.class.isInstance(flowElement)){
				CallActivity callActivity = (CallActivity) flowElement;
				if(StringUtils.isEmpty(callActivity.getCalledElement())){
					resultBuf.append(String.format("当前流程环节[%S(%S)]未绑定关联流程,请您重新绑定！%n",callActivity.getName(),callActivity.getId()));
					continue;
				}
			}
			UserTask userTask = (UserTask) flowElement;
			if (userTask.getCandidateUsers().isEmpty()
					&& userTask.getCandidateOrgs().isEmpty()
					&& userTask.getCandidateGroups().isEmpty()
					&& StringUtils.isEmpty(userTask.getAssignee())) {
				resultBuf.append(String.format("当前流程环节[%S(%S)]未绑定任何资源[如人员或角色或组织],请您重新绑定！%n",userTask.getName(),userTask.getId()));
			}
			for (String candidateUser : userTask.getCandidateUsers()) {
				User user=this.userService.getUserById(candidateUser);
				if(user==null){
					resultBuf.append(String.format("当前流程环节[%S(%S)]绑定的人员资源[%s]已失效,请您重新绑定！%n",userTask.getName(),userTask.getId(),candidateUser));
				}
			}for (String candidateOrg : userTask.getCandidateOrgs()) {
				Org org=this.orgService.getOrgById(candidateOrg);
				if(org==null){
					resultBuf.append(String.format("当前流程环节[%S(%S)]绑定的组织资源[%s]已失效,请您重新绑定！%n",userTask.getName(),userTask.getId(),candidateOrg));
				}
			}
			for (String candidateGroup : userTask.getCandidateGroups()) {
				Role role=this.roleService.getRoleById(candidateGroup);
				if(role==null){
					resultBuf.append(String.format("当前流程环节[%S(%S)]绑定的角色资源[%s]已失效,请您重新绑定！%n",userTask.getName(),userTask.getId(),candidateGroup));
				}
			}
			if(userTask.getIncomingFlows().isEmpty()){
				resultBuf.append(String.format("当前流程环节[%S(%S)]未绑定连接到上一任务节点,请您在流程设计中连接上一任务节点！%n",userTask.getName(),userTask.getId()));
			}
			if(userTask.getOutgoingFlows().isEmpty()){
				resultBuf.append(String.format("当前流程环节[%S($S)]未绑定连接到下一任务节点,请您在流程设计中连接下一任务节点！%n",userTask.getName(),userTask.getId()));
			}
			
		}
	}

}
