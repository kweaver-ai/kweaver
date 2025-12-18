/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */

package com.aishu.wf.core.engine.core.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.*;
import com.aishu.wf.core.engine.core.service.impl.ProcessExecuteServiceFacde;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.HistoryService;
import org.activiti.engine.history.HistoricVariableInstance;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @description DocFlowService
 * @author ouandyang
 */
@Slf4j
@Service
public class WorkFlowClinetService {
	@Autowired
	private ProcessDefinitionService processDefinitionService;
	@Autowired
	private ProcessExecuteServiceFacde processExecuteService;
	@Autowired
	private ProcessInstanceService processInstanceService;
	@Autowired
	protected HistoryService historyService;
	@Autowired
	private UserManagementService userManagementService;
	@Resource
	private ProcessTraceService processTraceService;
	@Autowired
	private UserService userService;

	/**
	 * 提交流程
	 * @param model
	 * @return
	 */
	public ProcessInstanceModel submitProcess(ProcessInputModel model) {
		if (StringUtils.isEmpty(model.getWf_curActInstId())) {
			return this.create(model);
		}
		return this.nextExcute(model);
	}

	/**
	 * 创建流程
	 * @param model ProcessInputModel
	 * @return ProcessInstanceModel
	 */
	public ProcessInstanceModel create(ProcessInputModel model){
		Map<String, Object> result;
		if (StringUtils.isEmpty(model.getWf_sendUserId())) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_sendUserId is null");
		}
		if (StringUtils.isEmpty(model.getWf_procTitle())) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_procTitle is null");
		}
		String procDefId = model.getWf_procDefId();
		String procDefKey = model.getWf_procDefKey();
		if (StringUtils.isEmpty(procDefId) && StringUtils.isEmpty(procDefKey)) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_procDefId and wf_procDefKey is null");
		}
		if(!StringUtils.isEmpty(model.getWf_curActInstId())) {
			ActivityInstanceModel curActInstModel = this.processInstanceService.getTask(model.getWf_curActInstId());
			model.setWf_procInstId(curActInstModel.getProcInstId());
		}
		model.setWf_actionType(WorkFlowContants.ACTION_TYPE_SAVE_ACTIVITY);
		result = processExecuteService.nextExecute(model);
		if(result.get("processInstanceModel") != null) {
			return (ProcessInstanceModel) result.get("processInstanceModel");
		}else {
			throw new RestException(((ExceptionErrorCode)result.get("executeErrorCode")).name() , (String)result.get("executeErrorMsg"));
		}
	}

	/**
	 * 流程执行
	 *
	 * @param model ProcessInputModel
	 * @return ProcessInstanceModel
	 */
	public ProcessInstanceModel nextExcute(ProcessInputModel model) {
		Map<String, Object> result;
		if (StringUtils.isEmpty(model.getWf_sendUserId())) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_sendUserId is null");
		}
		if (StringUtils.isEmpty(model.getWf_procTitle())) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_procTitle is null");
		}
		if (StringUtils.isEmpty(model.getWf_curActInstId())) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "wf_curActInstId is null");
		}
		model.setWf_actionType(WorkFlowContants.ACTION_TYPE_EXECUTE_ACTIVITY);
		result = processExecuteService.nextExecute(model);
		if (result.get("processInstanceModel") != null) {
			return (ProcessInstanceModel) result.get("processInstanceModel");
		} else {
			throw new RestException(((ExceptionErrorCode) result.get("executeErrorCode")).name(),
					(String) result.get("executeErrorMsg"));
		}
	}

	/**
	 * 流程作废
	 * @param procInstId
	 * @param comment
	 * @return
	 */
	public ProcessInstanceModel cancel(String procInstId,String sender,String comment) {
		if(StrUtil.isEmpty(procInstId)) {
			throw new RestException(ExceptionErrorCode.B2001.name(), "procInstId is null");
		}
		/*
		 * ProcessInstance processInstance=processInstanceService.getRuntimeService().
		 * createProcessInstanceQuery().processInstanceId(procInstId).singleResult();
		 * if(processInstance == null) { throw new
		 * RestException(ExceptionErrorCode.B2051.name(),
		 * "process instance not found, id=" + procInstId); } List<Task>
		 * tasks=processInstanceService.getTaskService().createTaskQuery().
		 * processInstanceId(processInstance.getId()).active().orderByTaskCreateTime().
		 * desc().list(); if(tasks == null || tasks.isEmpty()) { throw new
		 * RestException(ExceptionErrorCode.B2052.name(), "no task found"); } Task task
		 * = tasks.get(0); ProcessInputModel processInputModel =(ProcessInputModel)
		 * processInstanceService.getTaskVariables(task.getId()).get(WorkFlowContants.
		 * WF_PROCESS_INPUT_VARIABLE_KEY);
		 * processInputModel.setWf_procTitle(task.getProcTitle());
		 * processInputModel.setWf_actionType(WorkFlowContants.
		 * ACTION_TYPE_CANCEL_PROCESS);
		 * processInputModel.setWf_curActInstId(task.getId());
		 * processInputModel.setWf_procDefId(task.getProcessDefinitionId());
		 * processInputModel.setWf_procInstId(task.getProcessInstanceId());
		 * processInputModel.setWf_appId(task.getTenantId()); //?
		 */
		ProcessInputModel processInputModel =new ProcessInputModel();
		processInputModel.setWf_curComment(comment);
		processInputModel.setWf_procInstId(procInstId);
		processInputModel.setWf_sender(sender);
		processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_CANCEL_PROCESS);
		Map<String, Object> resultMap = processExecuteService.nextExecute( processInputModel);
		if(resultMap.get("processInstanceModel") != null) {
			return (ProcessInstanceModel)resultMap.get("processInstanceModel");
		}else {
			throw new RestException(((ExceptionErrorCode)resultMap.get("executeErrorCode")).name() , (String)resultMap.get("executeErrorMsg"));
		}
	}

	/**
	 * 获取历史流程变量
	 * @param processInstanceId
	 * @param key
	 * @return
	 * @throws WorkFlowException
	 */
	public Object getProcessInstanceVariables(
			String processInstanceId,String key) throws WorkFlowException {
		if (StringUtils.isEmpty(processInstanceId)) {
			return null;
		}
		HistoricVariableInstance variableInstance = historyService.createHistoricVariableInstanceQuery().
				processInstanceId(processInstanceId).variableName(key).orderByLastUpdateTime().desc().singleResult();
		if(variableInstance==null) {
			return null;
		}
		return variableInstance.getValue();
	}

	/**
	 * 获取流程审核员
	 * @param processInstanceModel
	 * @return
	 */
	public String getAuditors(ProcessInstanceModel processInstanceModel) {
		List<ProcessAuditor> result = new ArrayList<ProcessAuditor>();
		// 获取当前环节所有审核员
		List<String> userIds = new ArrayList<String>();
		List<ValueObjectEntity> valueObjectList = new ArrayList<>();
		ProcessInstanceLog hisTaskLog = processTraceService.getHisTaskLog(
				processInstanceModel.getProcInstId(),false,false);
		List<ProcessLogModel> processLogModelList = hisTaskLog.getProcessDetailLogs().stream()
				.filter(t -> !"autoPass".equals(t.getDeleteReason())
						&& !"autoReject".equals(t.getDeleteReason())).collect(Collectors.toList());
		if (CollUtil.isEmpty(processLogModelList)) {
			// 所有环节都是自动通过/自动提交，则返回空审核员信息
			return JSONUtil.toJsonStr(result);
		}
		List<ProcessLogModel> logs = hisTaskLog.getProcessDetailLogs().stream()
				.filter(item -> item.getActDefKey().equals(processLogModelList.get(0).getActDefKey()))
				.collect(Collectors.toList());
		if (processInstanceModel.isFinish() || processInstanceModel.isAutoReject()) {
			result = ProcessAuditor.buildProcessAuditor(logs);
		} else {
			try {
				userIds = (List<String>) processInstanceService.getRuntimeService()
						.getProcVariable(processInstanceModel.getProcInstId(), WorkFlowContants.ELEMENT_ASSIGNEE_LIST);
				log.debug("===========userIds:{}", JSONUtil.toJsonStr(userIds));
				if (CollUtil.isNotEmpty(userIds)) {
					valueObjectList = userManagementService.names("user", userIds);
				}
			} catch (Exception e) {
				SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "获取审核员名称集合异常", e, userIds);
				log.warn("获取审核员名称集合异常=={processInstanceModel:{}}",
						processInstanceModel, e);
			}
		}

		List<User> userList = userService.getUserList(userIds);
		// 组装审核员数据
		for (String userId : userIds) {
			// 构建审核员信息对象
			ProcessAuditor auditor = ProcessAuditor.builder().id(userId)
					.status(WorkflowConstants.AUDIT_STATUS_DSH).build();
			List<ValueObjectEntity> userNameList = valueObjectList.stream().filter(e ->
					e.getId().equals(userId)).collect(Collectors.toList());
			auditor.setName(userNameList.size() > 0 ? userNameList.get(0).getName() : userId);

			// 同步更改已审核的审核员信息
			List<ProcessLogModel> _list = logs.stream()
					.filter(item -> userId.equals(item.getReceiveUserId()))
					.collect(Collectors.toList());
			if (CollUtil.isNotEmpty(_list) && _list.get(0).getComment() != null) {
				String comment = _list.get(0).getComment().getDisplayArea();
				if ("同意".equals(comment)) {
					auditor.setStatus(WorkflowConstants.AUDIT_RESULT_PASS);
				} else if ("退回".equals(comment)) {
					auditor.setStatus(WorkflowConstants.AUDIT_RESULT_SENDBACK);
				} else {
					auditor.setStatus(WorkflowConstants.AUDIT_RESULT_REJECT);
				}
				auditor.setAuditDate(_list.get(0).getEndTime().getTime());
			}
			List<User> currentUserList = userList.stream().filter(p -> p.getUserId().equals(userId)).collect(Collectors.toList());
			auditor.setAccount(currentUserList.size() > 0 ? currentUserList.get(0).getUserCode() : null);
			result.add(auditor);
		}

		result.sort(Comparator.comparing(t -> t.getAuditDate(), Comparator.nullsLast(Long::compareTo)));
		return JSONUtil.toJsonStr(result);
	}

}
