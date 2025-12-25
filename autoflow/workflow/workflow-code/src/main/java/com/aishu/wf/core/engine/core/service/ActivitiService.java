package com.aishu.wf.core.engine.core.service;

import org.activiti.engine.FormService;
import org.activiti.engine.HistoryService;
import org.activiti.engine.IdentityService;
import org.activiti.engine.ManagementService;
import org.activiti.engine.ProcessEngineConfiguration;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.RuntimeService;
import org.activiti.engine.TaskService;

/**
 * @description 获取Activiti5相关Service的辅助类
 * @author lw
 */
public interface ActivitiService {

	RepositoryService getRepositoryService();

	RuntimeService getRuntimeService();

	HistoryService getHistoryService();

	IdentityService getIdentityService();

	TaskService getTaskService();

	FormService getFormService();

	ManagementService getManagementService();

	ProcessEngineConfiguration getProcessEngineConfiguration();

}
