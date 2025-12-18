package com.aishu.wf.core.engine.core.service;

import com.aishu.wf.core.engine.core.handler.BizProcessHandler;
import com.aishu.wf.core.engine.core.handler.BizProcessHandlerFactory;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.*;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.RepositoryServiceImpl;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.ReadOnlyProcessDefinition;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @description 获取Activiti5相关Service的辅助类
 * @author lw
 */
@Service
@Slf4j
public abstract class AbstractServiceHelper implements ActivitiService {
    @Autowired
    protected RepositoryService repositoryService;
    @Autowired
    protected RuntimeService runtimeService;
    @Autowired
    protected HistoryService historyService;
    @Autowired
    protected IdentityService identityService;
    @Autowired
    protected TaskService taskService;
    @Autowired
    protected FormService formService;
    @Autowired
    protected ManagementService managementService;
    @Autowired
    protected ProcessEngineConfiguration processEngineConfiguration;
    @Autowired
    protected BizProcessHandlerFactory bussinessProcessHandlerFactory;

    @Override
    public RepositoryService getRepositoryService() {
        return repositoryService;
    }

    public void setRepositoryService(RepositoryService repositoryService) {
        this.repositoryService = repositoryService;
    }

    @Override
    public RuntimeService getRuntimeService() {
        return runtimeService;
    }

    public void setRuntimeService(RuntimeService runtimeService) {
        this.runtimeService = runtimeService;
    }

    @Override
    public HistoryService getHistoryService() {
        return historyService;
    }

    public void setHistoryService(HistoryService historyService) {
        this.historyService = historyService;
    }

    @Override
    public IdentityService getIdentityService() {
        return identityService;
    }

    public void setIdentityService(IdentityService identityService) {
        this.identityService = identityService;
    }

    @Override
    public TaskService getTaskService() {
        return taskService;
    }

    public void setTaskService(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    public FormService getFormService() {
        return formService;
    }

    public void setFormService(FormService formService) {
        this.formService = formService;
    }

    @Override
    public ManagementService getManagementService() {
        return managementService;
    }

    public void setManagementService(ManagementService managementService) {
        this.managementService = managementService;
    }

    @Override
    public ProcessEngineConfiguration getProcessEngineConfiguration() {
        return processEngineConfiguration;
    }

    public void setProcessEngineConfiguration(
            ProcessEngineConfiguration processEngineConfiguration) {
        this.processEngineConfiguration = processEngineConfiguration;
    }

    public BizProcessHandler getBussinessProcessHandler(String processDefinitionId) {
        BizProcessHandler handler = null;
        try {
            handler = bussinessProcessHandlerFactory.buildBussinessProcessHandler(processDefinitionId);
        } catch (Exception e) {
            log.warn("", e);
        }
        return handler;
    }


    /**
     * 根据流程定义KEY获取流程定义对象
     *
     * @param procDefKey
     * @return
     */
    public ProcessDefinition getProcessDefinitionByKey(String procDefKey) {
        if (procDefKey == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "procDefKey is null");
        }
        ProcessDefinition processDefinition = null;
        try {
        	processDefinition = repositoryService
                    .createProcessDefinitionQuery()
                    .processDefinitionKey(procDefKey).latestVersion().singleResult();
        } catch (Exception e) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前流程定义未找到!procDefKey:" + procDefKey, e);
        }
        if (processDefinition == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前流程定义未找到!procDefKey:" + procDefKey);
        }
        return processDefinition;
    }
    /**
     * 根据流程定义ID获取流程定义对象
     *
     * @param procDefId
     * @return
     */
    public ProcessDefinition getProcessDefinition(String procDefId) {
        if (procDefId == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "procDefId is null");
        }
        ProcessDefinition processDefinition = null;
        try {
            processDefinition = this.repositoryService.getProcessDefinition(procDefId);
        } catch (Exception e) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前流程定义未找到!procDefId:" + procDefId, e);
        }
        if (processDefinition == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前流程定义未找到!procDefId:" + procDefId);
        }
        return processDefinition;
    }


    /**
     * 根据流程定义ID获取流程定义对象
     *
     * @param procDefId
     * @return
     */
    public ReadOnlyProcessDefinition getDeployedProcessDefinition(String procDefId) {
        if (procDefId == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "procDefId is null");
        }
        RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) repositoryService;
        ReadOnlyProcessDefinition rpd = null;
        try {
            rpd = repositoryServiceImpl
                    .getDeployedProcessDefinition(procDefId);

        } catch (Exception e) {
            throw new WorkFlowException(ExceptionErrorCode.B2002, "当前流程定义未找到!procDefId:" + procDefId, e);
        }
        return rpd;
    }

    /**
     * 根据流程实例ID获取流程程实例对象
     *
     * @param procDefId
     * @return
     */
    public ProcessInstance getProcessInstance(String procInstId) {
        if (procInstId == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "procInstId is null");
        }
        ProcessInstance processInstance = runtimeService
                .createProcessInstanceQuery()
                .processInstanceId(procInstId)
                .active().singleResult();
        if (processInstance == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2051, "当前流程实例未找到!procInstId:" + procInstId);
        }
        return processInstance;
    }

    /**
     * 根据流程实例ID获取流程程实例对象
     *
     * @param procDefId
     * @return
     */
    public HistoricProcessInstance getHisProcessInstance(String procInstId) {
        if (procInstId == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "procInstId is null");
        }
        HistoricProcessInstance processInstance = this.historyService.createHistoricProcessInstanceQuery().processInstanceId(procInstId).singleResult();
        if (processInstance == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2051, "当前流程实例未找到!procInstId:" + procInstId);
        }
        return processInstance;
    }


    /**
     * 根据任务ID获得任务实例
     *
     * @param taskId 任务ID
     * @return
     * @
     */
    public TaskEntity findTaskById(String taskId) {
        if (taskId == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2001, "taskId is null");
        }
        TaskEntity task = (TaskEntity) taskService.createTaskQuery()
                .taskId(taskId).singleResult();
        if (task == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2052,"当前待办任务未找到!taskId:" + taskId);
        }
        return task;
    }

    /**
     * 根据任务审批人和流程实例ID获得任务实例
     *
     * @param taskId 任务ID
     * @return
     * @
     */
    public TaskEntity findTaskByAssignee(String procInstId, String assignee) {
        TaskEntity task = (TaskEntity) taskService.createTaskQuery()
                .processInstanceId(procInstId)
                .taskAssignee(assignee).singleResult();
        if (task == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2052, "当前待办任务未找到!procInstId:" + procInstId + ",assignee:" + assignee);
        }
        return task;
    }

    /**
     * @param taskId     当前任务ID
     * @param activityId 流程转向执行任务节点ID<br>
     *                   此参数为空，默认为提交操作
     * @param variables  流程变量
     * @
     */
    public void commitProcess(String taskId, String activityId, Map<String, Object> variables) {
        if (variables == null) {
            variables = Maps.newHashMap();
        }
        taskService.complete(taskId, activityId, variables);
    }

}
