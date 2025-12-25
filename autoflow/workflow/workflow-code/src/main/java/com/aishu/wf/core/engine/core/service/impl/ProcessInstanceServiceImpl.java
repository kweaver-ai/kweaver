package com.aishu.wf.core.engine.core.service.impl;

import com.aishu.wf.core.common.aspect.annotation.RedisLock;
import com.aishu.wf.core.common.config.CustomConfig;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.*;
import com.aishu.wf.core.engine.core.model.cache.ProcessMgrDataShare;
import com.aishu.wf.core.engine.core.model.dto.ProcessInstanceDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessTaskDTO;
import com.aishu.wf.core.engine.core.service.*;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import cn.hutool.core.util.StrUtil;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.history.HistoricProcessInstanceQuery;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.runtime.Execution;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Comment;
import org.activiti.engine.task.Task;
import org.activiti.engine.task.TaskQuery;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @description 流程实例实现类
 * @author hanj
 */
@Service
@Transactional(propagation = Propagation.SUPPORTS, rollbackFor = Exception.class)
public class ProcessInstanceServiceImpl extends AbstractServiceHelper implements ProcessInstanceService {

    @Autowired
    private UserService userService;

    @Resource
    private UserManagementService userManagementService;

    @Autowired
    protected ProcessDefinitionService processDefinitionService;

    @Autowired
    private ProcessExecuteService processExecuteService;

    @Resource
    private CustomConfig customConfig;

    @Resource
    private ProcessTraceService processTraceService;

    @Autowired
    protected ProcessInfoConfigManager ProcessInfoConfigManager;

    protected Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    public IPage<ProcessInstanceModel> findInstanceList(ProcessInstanceDTO queryDTO) {
        HistoricProcessInstanceQuery query = this.getHistoryService().createHistoricProcessInstanceQuery();
        if (StringUtils.isNotEmpty(queryDTO.getProc_def_name())) {
            query.processDefinitionName(queryDTO.getProc_def_name());
        }
        if (StringUtils.isNotEmpty(queryDTO.getTitle())) {
            query.processInstanceNameLike(queryDTO.getTitle());
        }
        if (Objects.nonNull(queryDTO.getState()) && queryDTO.getState() != 0) {
            query.procState(queryDTO.getState());
        }
        query.processInstanceTenantId(queryDTO.getTenant_id());
        IPage<ProcessInstanceModel> page = new Page<>(queryDTO.getPageNumber(), queryDTO.getPageSize());
        page.setTotal(query.count());
        List<HistoricProcessInstance> historicProcessInstances = query.orderByProcessInstanceStartTime().desc()
                .listPage(queryDTO.getPageNumber(), queryDTO.getPageSize());
        Set<String> userIds = new HashSet<>();
        historicProcessInstances.forEach(instance -> userIds.add(instance.getStartUserId()));
        Map<String, String> namesMap = this.getNamesMapByUserIds(userIds);
        List<ProcessInstanceModel> resultList = Lists.newArrayList();
        for (HistoricProcessInstance instance : historicProcessInstances) {
            ProcessInstanceModel build = ProcessInstanceModel.build(instance);
            String userName = namesMap.get(instance.getStartUserId());
            build.setStartUserName(userName);
            resultList.add(build);
        }
        page.setRecords(resultList);
        return page;
    }

    /**
     * 批量userIds转换名称
     *
     * @param userIds 用户ID集合，无重复
     * @return <id，name>键值对map
     */
    private Map<String, String> getNamesMapByUserIds(Set<String> userIds) {
        Map<String, String> namesMap = Maps.newHashMap();
        try {
            List<ValueObjectEntity> names = userManagementService.names("user", Lists.newArrayList(userIds));
            namesMap = names.stream().collect(Collectors.toMap(ValueObjectEntity::getId, ValueObjectEntity::getName));
        } catch (Exception e) {
            logger.warn("根据用户ID转换用户名称失败！参数：{}", Arrays.toString(userIds.toArray()), e);
        }
        return namesMap;
    }

    @Override
    public ProcessInstanceLog getProcLogs(String id, String type) {
        ProcessInstanceLog hisTaskLog = processTraceService.getHisTaskLog(id,true,false);
        if (WorkflowConstants.PROC_LOGS_IMAGE.equals(type)) {
            hisTaskLog.setProcessTrace(processTraceService.getProcessTrace(id));
        }
        return hisTaskLog;
    }

    @Override
    public ActivityInstanceModel getTask(String taskId) {
        TaskEntity task = this.findTaskById(taskId);
        ActivityDefinitionModel activityDefinitionModel = processDefinitionService
                .getActivity(task.getProcessDefinitionId(),
                        task.getTaskDefinitionKey());
        if (activityDefinitionModel == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2003, "activityDefinitionModel is not found");
        }
        ActivityInstanceModel activityInstanceModel = ActivityInstanceModel.buildTask(task);
        activityInstanceModel.setActivityDefinition(activityDefinitionModel);
        return activityInstanceModel;
    }

    @Override
    public ActivityInstanceModel getHistoryTask(String taskId) {
        if (StringUtils.isEmpty(taskId)) {
            return null;
        }
        HistoricTaskInstance task = this.historyService
                .createHistoricTaskInstanceQuery().taskId(taskId)
                .singleResult();
        if (task == null) {
            return null;
        }
        return ActivityInstanceModel.buildHisTask(task);
    }

    @Override
    public List<HistoricTaskInstance> getHistoryTaskList(String processInstanceId) {
        if (StringUtils.isEmpty(processInstanceId)) {
            return null;
        }
        List<HistoricTaskInstance> taskList = this.historyService
                .createHistoricTaskInstanceQuery().processInstanceId(processInstanceId).list();
        return taskList;
    }

    @Override
    public ProcessInstanceModel getProcessInstanceById(String procInstId) {
        if (StringUtils.isEmpty(procInstId)) {
            return null;
        }
        HistoricProcessInstance hisInstance = historyService
                .createHistoricProcessInstanceQuery()
                .processInstanceId(procInstId).singleResult();
        if (hisInstance != null) {
            return ProcessInstanceModel.build(hisInstance);
        }
        return null;
    }

    @Override
    public ProcessInstanceModel getProcessInstanceByBizKey(String bizKey)
            throws WorkFlowException {
        ProcessInstanceModel processInstanceModel = null;
        if (StringUtils.isEmpty(bizKey)) {
            return processInstanceModel;
        }
        HistoricProcessInstance hisInstance = historyService
                .createHistoricProcessInstanceQuery()
                .processInstanceBusinessKey(bizKey).singleResult();
        if (hisInstance != null) {
            processInstanceModel = ProcessInstanceModel.build(hisInstance);
        }
        return processInstanceModel;
    }

    @Override
    public List<ProcessInstanceModel> getProcessInstancesByBizKey(String bizKey)
            throws WorkFlowException {
        List<ProcessInstanceModel> processInstanceModels = new ArrayList<ProcessInstanceModel>();
        if (StringUtils.isEmpty(bizKey)) {
            return processInstanceModels;
        }
        List<ProcessInstance> processInstances = runtimeService
                .createProcessInstanceQuery().processInstanceBusinessKey(bizKey)
                .active().list();

        if (processInstances == null) {
            return processInstanceModels;
        }
        for (ProcessInstance processInstance : processInstances) {
            ProcessInstanceModel processInstanceModel = ProcessInstanceModel
                    .build(processInstance);
            processInstanceModels.add(processInstanceModel);
        }
        return processInstanceModels;
    }

    @Override
    public Map<String, Object> getProcessInstanceVariables(
            String processInstanceId) throws WorkFlowException {
        if (StringUtils.isEmpty(processInstanceId)) {
            return null;
        }
        Map<String, Object> variables = Maps.newHashMap();
        ProcessInstance processInstance = runtimeService
                .createProcessInstanceQuery()
                .processInstanceId(processInstanceId).includeProcessVariables()
                .singleResult();
        if (processInstance != null) {
            variables = processInstance.getProcessVariables();
        } else {
            HistoricProcessInstance hisProcessInstance = historyService
                    .createHistoricProcessInstanceQuery()
                    .processInstanceId(processInstanceId)
                    .includeProcessVariables().singleResult();
            if (hisProcessInstance != null) {
                variables = hisProcessInstance.getProcessVariables();
            }
        }
        return variables;
    }

    @Override
    public Map<String, Object> getTaskVariables(String taskId) {
        if (StringUtils.isEmpty(taskId)) {
            return null;
        }
        return taskService.getVariables(taskId);
    }

    @Override
    public Map<String, Object> getHistoryTaskVariables(String taskId) {
        if (StringUtils.isEmpty(taskId)) {
            return null;
        }
        HistoricTaskInstance historicTaskInstance = this.historyService
                .createHistoricTaskInstanceQuery().taskId(taskId)
                .includeTaskLocalVariables().singleResult();
        return historicTaskInstance.getTaskLocalVariables();
    }

    @Override
    public ProcessInputModel getProcessInputVariableByTask(String taskId) {
    	ProcessInputModel processInputModel =null;
        if (StringUtils.isEmpty(taskId)) {
            return processInputModel;
        }
    	processInputModel = (ProcessInputModel) taskService.getVariable(taskId,
                WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
        return processInputModel;
    }

    @Override
    public BusinessDataObject getBusinessDataObject(String procInstId) {
        if (StringUtils.isEmpty(procInstId)) {
            return null;
        }
        return (BusinessDataObject) getProcessInstanceVariables(procInstId)
                .get("wf_businessDataObject");
    }

    @Override
    public ProcessInputModel getProcessInputVariable(String procInstId) {
    	ProcessInputModel processInputModel = null;
        if (StringUtils.isEmpty(procInstId)) {
            return processInputModel;
        }
        ProcessInstance processInstance = runtimeService
                .createProcessInstanceQuery().processInstanceId(procInstId)
                .includeProcessVariables().singleResult();
        Map<String, Object> variables = processInstance.getProcessVariables();
        if (variables.containsKey(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY)) {
        	processInputModel = (ProcessInputModel) variables.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
        }
        return processInputModel;
    }

    @Override
	public Object getProcessInstanceVariables(String procInstId, String key) throws WorkFlowException {
        if (StringUtils.isEmpty(procInstId)) {
            return null;
        }
        HistoricVariableInstance var = this.historyService
        		.createHistoricVariableInstanceQuery().processInstanceId(procInstId).variableName(key).singleResult();
        return var.getValue();
	}

    @Override
    public ProcessInputModel getProcessInputVariableByFinished(String procInstId) {
    	ProcessInputModel processInputModel = null;
        if (StringUtils.isEmpty(procInstId)) {
            return processInputModel;
        }
        HistoricProcessInstance processInstance = this.historyService
                .createHistoricProcessInstanceQueryCI()
                .processInstanceId(procInstId).includeProcessVariables()
                .singleResult();
        Map<String, Object> variables = processInstance.getProcessVariables();
        if (variables.containsKey(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY)) {
        	processInputModel = (ProcessInputModel) variables.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
        }
        return processInputModel;
    }

    @Override
    public ActivityInstanceModel getTaskByProcessFinished(String procInstId,
                                                          String endTaskId) {
        if (StringUtils.isEmpty(procInstId)) {
            return null;
        }
        List<HistoricTaskInstance> historicTaskInstances = historyService
                .createHistoricTaskInstanceQuery()
                .processInstanceId(procInstId).processFinished()
                .orderByHistoricTaskInstanceEndTime().desc().list();
        if (historicTaskInstances == null || historicTaskInstances.isEmpty()) {
            return null;
        }
        return ActivityInstanceModel.buildHisTask(historicTaskInstances.get(0));
    }

    @Override
    public ActivityInstanceModel getLastTaskNotFinished(String procInstId, String endActivityId) {
        if (StringUtils.isEmpty(procInstId)) {
            return null;
        }
        List<HistoricTaskInstance> historicTaskInstances = historyService
                .createHistoricTaskInstanceQuery()
                .processInstanceId(procInstId)
                .orderByHistoricTaskInstanceStartTime().desc().list();
        if (historicTaskInstances == null || historicTaskInstances.isEmpty()) {
            return null;
        }
        try {
            processDefinitionService.getActivity(
                    historicTaskInstances.get(0).getProcessDefinitionId(),
                    historicTaskInstances.get(0).getTaskDefinitionKey());
        } catch (Exception e) {
            processDefinitionService.getActivity(
                    historicTaskInstances.get(0).getProcessDefinitionId(), endActivityId);
        }
        return ActivityInstanceModel.buildHisTask(historicTaskInstances.get(0));
    }

    @Override
    public List<ProcessLogModel> getProcessComments(String procInstId) {
        List<ProcessLogModel> processComments = new ArrayList<>();
        if (StringUtils.isEmpty(procInstId)) {
            return processComments;
        }
        List<Comment> comments = taskService
                .getProcessInstanceComments(procInstId);
        try {
            if (comments.isEmpty()) {
                return processComments;
            }
            for (Comment comment : comments) {
                String taskId = comment.getTaskId();
                if (StringUtils.isEmpty(taskId)) {
                    continue;
                }
                HistoricTaskInstance historicTaskInstance = historyService
                        .createHistoricTaskInstanceQuery().taskId(taskId)
                        .singleResult();
                if (historicTaskInstance == null) {
                    continue;
                }
                String userName = "";
                if (StringUtils.isNotBlank(comment.getUserId())) {
                    userName = userService.getUserById(comment.getUserId()).getUserName();
                }
                ProcessLogModel processComment = new ProcessLogModel();
                processComment.setComment(comment);
                processComment.setSendUserId(comment.getUserId());
                processComment.setSendUserName(userName);
                processComments.add(processComment);
                try {
                    if (StringUtils.isNotBlank(historicTaskInstance.getOwner())) {
                        processComment.setOwnerName(userService.getUserById(historicTaskInstance.getOwner())
                                .getUserName());
                    }
                } catch (Exception e) {
                    logger.warn(String.format(
                            "获取委托人owner的userName出现异常,procInstId[%s],userId[%s]",
                            procInstId, historicTaskInstance.getOwner()), e);
                }
                processComment.setActionType(historicTaskInstance.getActionType());
                processComment.setActDefKey(historicTaskInstance.getTaskDefinitionKey());
                processComment.setActDefName(historicTaskInstance.getName());
                processComment.setActInstId(historicTaskInstance.getId());
                processComment.setDeleteReason(historicTaskInstance.getDeleteReason());
                processComment.setEndTime(historicTaskInstance.getEndTime());
                processComment.setStartTime(historicTaskInstance.getStartTime());
                processComment.setProcessInstanceId(historicTaskInstance.getProcessInstanceId());
            }
        } catch (Exception e) {
            logger.warn(String.format(
                    "获取流程意见列表出现异常,procInstId[%s]",procInstId), e);
        }
        return processComments;
    }

    @Override
    public List<String> processInstanceBatchCancel(List<String> procInstIds, String userId,String reason) throws Exception {
        List<String> procInstIdList = new ArrayList<>();
        for (String procInstId : procInstIds) {
            Boolean resultFlag = this.processInstanceToCancel(procInstId, userId, reason);
            if (resultFlag) {
                procInstIdList.add(procInstId);
            }
        }
        return procInstIdList;
    }

    /**
     * 重新分配审核人员
     *
     * @param id      任务ID
     * @param auditor 审核员
     */
    @Override
    public void againSetTaskAuditor(String id, String oldAuditor, String auditor, String topExecutionId) throws Exception {
        ActivityInstanceModel actInst = this.getTask(id);
        if (actInst == null) {
            throw new IllegalArgumentException("流程任务[" + id + "]不存在");
        }
        if (Objects.equals(auditor,actInst.getReceiver())) {
            throw new IllegalArgumentException("不能变更为当前审核员");
        }
        ProcessInputModel processInputModel = (ProcessInputModel) this
                .getTaskVariables(actInst.getActInstId()).get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
        processInputModel.setWf_receiver(auditor);
        processInputModel.setWf_receivers(null);
        if (!StringUtils.isEmpty(actInst.getSendUserId())) {
            processInputModel.setWf_sender(actInst.getSender());
            // by siyu.chen getSendUserId
            if (actInst.getSendUserId() != null) {
                processInputModel.setWf_sendUserId(actInst.getSendUserId());
            }
            processInputModel.setWf_sendUserOrgId(actInst.getSenderOrgId());
        } else {
            processInputModel.setWf_sender(actInst.getReceiver());
             // by siyu.chen getSendUserId
             if (actInst.getReceiverUserId() != null) {
                 processInputModel.setWf_sendUserId(actInst.getReceiverUserId());
             }
            processInputModel.setWf_sendUserOrgId(actInst.getReceiverOrgId());
        }
        processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_RECEIVER_TRANSFER);
        processInputModel.setWf_curActInstId(actInst.getActInstId());
        processInputModel.setWf_curActDefId(actInst.getActivityDefinition().getActDefId());
        processInputModel.setWf_curActDefName(actInst.getActivityDefinition().getActDefName());
        processInputModel.setWf_procDefId(actInst.getProcDefId());
        processInputModel.setWf_procTitle(actInst.getProcTitle());
        processInputModel.setWf_procInstId(actInst.getProcInstId());
        Map<String, Object> map = processExecuteService.nextExecute(processInputModel);
        if (!ProcessExecuteService.EXECUTE_STATUS_SUCCESS.equals(map.get("executeStatus"))) {
            throw new Exception((String) map.getOrDefault("executeErrorMsg", "重新分配人员失败！"));
        }
        try{
            Object variableLocal = this.getRuntimeService().getVariableLocal(topExecutionId, WorkFlowContants.ELEMENT_ASSIGNEE_LIST);
            List<String> originalAuditors = (ArrayList<String>) variableLocal;
            Collections.replaceAll(originalAuditors, oldAuditor, auditor);
            this.getRuntimeService().setVariableLocal(topExecutionId, WorkFlowContants.ELEMENT_ASSIGNEE_LIST, originalAuditors);
        } catch (Exception e) {
            logger.warn("原审核员替换转审审核员失败, 任务ID: {}, 执行ID: {} 转审人: {}, 被转审人: {}, detail: {}", id, actInst.getExecutionId(), oldAuditor, auditor, e);
        }
    }

    @Override
    public Boolean addTaskForInstance(String userId, String processInstanceId) {
        ProcessInstanceModel processInstanceModel = this.getProcessInstanceById(processInstanceId);
        ProcessInputModel processInputModel = new ProcessInputModel();
        // 待办变量表中的输入数据
        ProcessInputModel inputModelFromVariable = (ProcessInputModel) this.getProcessInstanceVariables(processInstanceId)
                .get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
        if (inputModelFromVariable != null) {
            processInputModel = inputModelFromVariable;
        }
        Execution execution = getRuntimeService().createExecutionQuery().parentId(processInstanceId).singleResult();
        List<Execution> executionList = getRuntimeService().createExecutionQuery().parentId(execution.getId()).list();
        processInputModel.setWf_curActDefId(executionList.get(0).getActivityId());
        // 设置执行类型为：add_multiinstance_activity
        processInputModel.setWf_receiver(userId);
        processInputModel.setWf_receivers(null);
        processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_ADD_MULTIINSTANCE_ACTIVITY);
        processInputModel.setWf_procDefId(processInstanceModel.getProcDefId());
        processInputModel.setWf_procInstId(processInstanceId);
        processExecuteService.nextExecute(processInputModel);
        return Boolean.TRUE;
    }

    @Override
    public Boolean addTaskForInstanceSerial(String userId, String processInstanceId) {
        ProcessInstanceModel processInstanceModel = this.getProcessInstanceById(processInstanceId);
        ProcessInputModel processInputModel = new ProcessInputModel();
        Execution execution = getRuntimeService().createExecutionQuery().parentId(processInstanceId).singleResult();
        processInputModel.setWf_curActDefId(execution.getActivityId());
        // 设置执行类型为：add_multiinstance_activity
        processInputModel.setWf_receiver(userId);
        processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_ADD_MULTIINSTANCE_SERIAL_ACTIVITY);
        processInputModel.setWf_procDefId(processInstanceModel.getProcDefId());
        processInputModel.setWf_procInstId(processInstanceId);
        processExecuteService.nextExecute(processInputModel);
        return Boolean.TRUE;
    }

    @Override
    @RedisLock
    public List<String> deleteAllTaskByUserId(String userId, String reason) {
        return this.deleteTaskForInstance(userId, null,reason);
    }

	@Override
	public List<String> deleteTaskForInstance(String userId, String processInstanceId, String reason) {
		TaskQuery taskQuery = this.getTaskService().createTaskQuery().taskAssignee(userId);
		if (StringUtils.isNotBlank(processInstanceId)) {
			taskQuery = taskQuery.processInstanceId(processInstanceId);
		}

        List<String> procInstIds = Lists.newArrayList();
		// 查询出userId所有的待办任务
		List<Task> tasks = taskQuery.active().list();
		if (tasks == null || tasks.isEmpty()) {
			return procInstIds;
		}
        for (Task task : tasks) {
			// 判断当前待办任务的流程还有多少个待审核任务
			long taskCount = this.getTaskService().createTaskQuery().processInstanceId(task.getProcessInstanceId())
					.count();
			// 大于1说明可以删除待审核任务，否则作废流程
			if (taskCount > 1) {
				ProcessInputModel processInputModel = new ProcessInputModel();
				// 待办变量表中的输入数据
				ProcessInputModel inputModelFromVariable = (ProcessInputModel) this.getTaskVariables(task.getId())
						.get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
				if (inputModelFromVariable != null) {
					inputModelFromVariable.setWf_curActInstId(task.getId());
					processInputModel = inputModelFromVariable;
				}
				// 设置执行类型为：delete_multiinstance_activity
				processInputModel.setWf_receiver(userId);
				processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY);
				processInputModel.setWf_procDefId(task.getProcessDefinitionId());
				processInputModel.setWf_procInstId(task.getProcessInstanceId());
				processInputModel.setWf_curComment(reason);
				ProcessMgrDataShare.setProcessMgrData(WorkFlowContants.PROCESS_DEF_DEL_MANAGE_OPT);
				processExecuteService.nextExecute(processInputModel);
				ProcessMgrDataShare.clear();
			} else {
				// 1个流程仅剩余1个待审核任务，就作废流程
                procInstIds.add(task.getProcessInstanceId());
			}
		}
        return procInstIds;
	}

    /**
     * 获取待办任务列表
     *
     * @param queryDTO
     * @return
     */
    @Override
    public IPage<ProcessTaskModel> findTaskList(ProcessTaskDTO queryDTO) {
        TaskQuery query = this.getTaskService()
                .createTaskQuery();
        query.taskTenantId(customConfig.getTenantId());
        // 增加流程定义名称模糊查询
        if (StringUtils.isNotEmpty(queryDTO.getProc_def_name())) {
            query.processDefinitionNameLike(queryDTO.getProc_def_name());
        }
        if (StringUtils.isNotEmpty(queryDTO.getTitle())) {
            query.procTitle(queryDTO.getTitle());
        }
        IPage<ProcessTaskModel> page = new Page<>(queryDTO.getPageNumber(), queryDTO.getPageSize());
        page.setTotal(query.count());
        List<Task> tasks = query.taskTenantId(queryDTO.getTenant_id()).orderByTaskCreateTime().desc()
                .listPage(queryDTO.getPageNumber(), queryDTO.getPageSize());
        List<ProcessTaskModel> pageList = new ArrayList<>();
        Set<String> userIds = new HashSet<>();
        tasks.forEach(task -> {
            userIds.add(task.getAssigneeUserId());
            userIds.add(task.getSendUserId());
        });
        Map<String, String> namesMap = this.getNamesMapByUserIds(userIds);
        for (Task task : tasks) {
            ProcessTaskModel taskModel = new ProcessTaskModel();
            taskModel.setId(task.getId());
            taskModel.setName(task.getName());
            taskModel.setProcDefId(task.getProcessDefinitionId());
            taskModel.setProcDefName(task.getProcessDefinitionName());
            taskModel.setProcInstId(task.getProcessInstanceId());
            taskModel.setKey(task.getTaskDefinitionKey());
            taskModel.setAssigneeOrgId(task.getAssigneeOrgId());
            taskModel.setAssigneeOrgName(task.getAssigneeOrgName());
            taskModel.setProcTitle(task.getProcTitle());
            String assigneeUserId = task.getAssigneeUserId();
            taskModel.setAssigneeUserId(assigneeUserId);
            taskModel.setAssigneeUserName(namesMap.get(assigneeUserId) != null ? namesMap.get(assigneeUserId) : task.getAssigneeUserName());
            taskModel.setSendOrgId(task.getSenderOrgId());
            taskModel.setSendOrgName(task.getSenderOrgName());
            String sendUserId = task.getSendUserId();
            taskModel.setSendUserId(sendUserId);
            taskModel.setSendUserName(namesMap.get(sendUserId) != null ? namesMap.get(sendUserId) : task.getSendUserName());
            taskModel.setCreateTime(task.getCreateTime());
            pageList.add(taskModel);
        }
        page.setRecords(pageList);
        return page;
    }

    @Override
    public Boolean processInstanceToCancel(String procInstId, String userId,String reason) throws Exception {
        ProcessInstance processInstance = this.getRuntimeService().createProcessInstanceQuery()
                .processInstanceId(procInstId).singleResult();
        if (processInstance == null) {
            throw new IllegalArgumentException("流程实例[" + procInstId + "]不存在");
        }
        List<Task> tasks = this.getTaskService().createTaskQuery()
                .processInstanceId(processInstance.getId()).active()
                .orderByTaskCreateTime().desc().list();
        ProcessInputModel processInputModel = null;
        if (tasks != null && !tasks.isEmpty()) {
            Task task = tasks.get(0);
            processInputModel = (ProcessInputModel) this
                    .getTaskVariables(task.getId())
                    .get(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY);
            if (processInputModel != null) {
                processInputModel.setWf_curActInstId(task.getId());
            }
        }
        if (processInputModel == null) {
            processInputModel = new ProcessInputModel();
        }
        processInputModel
                .setWf_actionType(WorkFlowContants.ACTION_TYPE_CANCEL_PROCESS);
        processInputModel.setWf_procDefId(processInstance
                .getProcessDefinitionId());
        processInputModel.setWf_procInstId(processInstance
                .getProcessInstanceId());
        processInputModel.setWf_sender(userId);
        processInputModel.setWf_curComment(reason);
        ProcessMgrDataShare.setProcessMgrData(WorkFlowContants.PROCESS_DEF_DEL_MANAGE_OPT);
        Map<String, Object> resultMap = processExecuteService.nextExecute(processInputModel);
        ProcessMgrDataShare.clear();
        if ("ERROR".equals(resultMap.get("executeStatus"))) {
            throw new Exception((String) resultMap.get("executeErrorMsg"));
        }
        return Boolean.TRUE;
    }

    @Override
    public List<Task> getProcessTasks(String processInstanceId, String taskDefKey) {
		if (StringUtils.isEmpty(processInstanceId) || StringUtils.isEmpty(taskDefKey)) {
			return null;
		}
        List<Task> tasks = getTaskService().createTaskQuery().taskDefinitionKey(taskDefKey).processInstanceId(processInstanceId).list();
		return tasks;
	}

	@Override
	public boolean checkAuditAuth(String type, String procInstId, String auditor, int csfLevel) {
        boolean result = false;
        if(WorkflowConstants.TYPE_APPLY.equals(type)){
            ProcessInstanceModel procInstModel = this.getProcessInstanceById(procInstId);
            if (procInstModel == null) {
                throw new IllegalArgumentException("未找到流程实例信息。");
            }
            result = procInstModel.getStartUserId().equals(auditor);
            if(!result){
                throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                        BizExceptionCodeEnum.A401001101.getMessage());
            }
        } else if(WorkflowConstants.TYPE_TASK.equals(type)){
            TaskEntity task = (TaskEntity) taskService.createTaskQuery().processInstanceId(procInstId)
                    .taskAssignee(auditor).singleResult();
            result = task != null;
            if(!result){
                throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                        BizExceptionCodeEnum.A401001101.getMessage());
            }
            result = this.checkCsfLevel(auditor, csfLevel);
            if(!result){
                throw new RestException(BizExceptionCodeEnum.A401001102.getCode(),
                        BizExceptionCodeEnum.A401001102.getMessage());
            }
        } else if(WorkflowConstants.TYPE_HISTORY.equals(type)){
            List<HistoricTaskInstance> historicTaskList = historyService.createHistoricTaskInstanceQuery().processInstanceId(procInstId)
                    .taskAssignee(auditor).list();
            historicTaskList = historicTaskList.stream().filter(h ->
                !h.getStatus().equals("5") &&
                !((h.getStatus().equals("1") || h.getStatus().equals("2")|| h.getStatus().equals("3")) && StrUtil.isBlank(h.getDeleteReason())))
                .collect(Collectors.toList());
            result = historicTaskList.size() > 0;
            if(!result){
                throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                        BizExceptionCodeEnum.A401001101.getMessage());
            }
        }

        return result;
	}

	private boolean checkCsfLevel(String userId, Integer docCsfLevel){
        // 获取审核员信息
        User auditor = userService.getUserById(userId);
        if (auditor == null) {
            throw new IllegalArgumentException("未找到审核员信息。");
        }
        // 比较审核员密级和文档密级，如果审核员密级大于或等于文档的密级，才能够进行审核
        if (docCsfLevel.compareTo(auditor.getCsfLevel()) <= 0) {
            return true;
        }
        return false;
    }

	@Override
	public Task getProcessTask(String processInstanceId, String receiver) {
		return findTaskByAssignee(processInstanceId, receiver);
	}
}
