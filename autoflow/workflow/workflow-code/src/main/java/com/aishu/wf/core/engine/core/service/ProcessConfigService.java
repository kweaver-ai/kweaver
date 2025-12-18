package com.aishu.wf.core.engine.core.service;

import com.aishu.wf.core.common.util.ServiceResponse;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.metadata.IPage;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

/**
 * @description 流程管理配置Service
 * @author lw
 */
public interface ProcessConfigService  extends ActivitiService{
	
	/**
	 * 获取流程绑定的界面路径
	 * 获取界面路径的优先级为：1:环节,2:流程
	 * @param processDefId
	 * @param activityDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public String getWorkflowPage(String processDefId,String activityDefId) throws WorkFlowException;
	
	/**
	 * 获取流程配置绑定的桌面端、手机端相关参数
	 * 获取数据的优先级为：1:环节,2:流程
	 * @param processDefId
	 * @param activityDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public Map<String,String> getPortalPage(String processDefId,String activityDefId) throws WorkFlowException;

	/**
	 * 获取流程配置列表
	 * @param params
	 * @return
	 * @throws WorkFlowException
	 */
	public IPage<ProcessInfoConfig> findProcessInfoConfigsPage(ProcessDefinitionDTO queryDTO, ProcessInfoConfig params) throws WorkFlowException;

    Boolean checkEntity(ProcessInfoConfig params)
            throws WorkFlowException;

    public List<String> getAllProcessIdForExport(ProcessInfoConfig params);
	/**
	 * 获取流程配置列表
	 * @param params
	 * @return
	 * @throws WorkFlowException
	 */
	public List<ProcessInfoConfig> findProcessInfoConfigs(ProcessInfoConfig params) throws WorkFlowException;
	public  ActivityInfoConfig getActivityInfoConfig(String processDefId,String activityDefId) throws WorkFlowException;
	/**
	 * 获取流程环节配置
	 * @param processDefId
	 * @param activityDefId
	 * @param opScope
	 * @param pageDetailVaribale
	 * @return
	 * @throws WorkFlowException
	 */
	public ActivityInfoConfig getActivityInfoConfig(String processDefId,String activityDefId,String opScope,Map<String,Object> pageDetailVaribale) throws WorkFlowException;
	/**
	 * 获取流程环节配置
	 * @param processDefId
	 * @param activityDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public ActivityInfoConfig getActivityInfoConfigByLocal(String processDefId,
			String activityDefId);
	/**
	 * 获取流程配置
	 * @param processDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public ProcessInfoConfig getProcessInfoConfig(String processDefId) throws WorkFlowException;
	/**
	 * 获取批量流程配置
	 * @param processDefIdList
	 * @return
	 * @throws WorkFlowException
	 */
	public List<ProcessInfoConfig> getBatchProcessInfoConfig(List<String> processDefIdList) throws WorkFlowException;


	/**
	 * 根据流程定义KEY批量获取流程配置
	 * @param processDefKeyList
	 * @return
	 * @throws WorkFlowException
	 */
	public List<ProcessInfoConfig> getBatchProcessInfoByKey(List<String> processDefKeyList) throws WorkFlowException;
	/**
	 * 删除流程配置
	 * @param processDefId
	 * @return
	 * @throws WorkFlowException
	 */
	public boolean deleteProcessInfoConfig(String processDefId) throws WorkFlowException;
	/**
	 * 批量删除流程配置
	 * @param processDefIdList
	 * @return
	 * @throws WorkFlowException
	 */
	public boolean deleteBatchProcessInfoConfig(List<String> processDefIdList) throws WorkFlowException;
	/**
	 * 导出一个流程数据
	 * @param processDefId
	 * @return
	 */
	public ByteArrayOutputStream exportOneProcessData(String processDefId);
	/**
	 * 导入一个流程数据
	 * @param fileContent
	 * @param importType
	 * @return
	 */
	public ServiceResponse<Void> importOneProcessData(String proceDefId,String tenantId,String deploymentId,String fileContent,
			String importType);
	/**
	 * 判断是否流程贯彻流程
	 * @param processDefId
	 * @param activityDefId
	 * @return
	 */
	public  boolean isThroughBizAppProcess(String processDefId, String activityDefId);
	
	/**
	 * 导出某个应用下所有角色
	 * @param appId
	 * @return
	 */
	public ByteArrayOutputStream exportAllRoleData(String appId);
	
	
	/**
	 * 导入某个应用下所有角色
	 * @param fileContent
	 * @return
	 */
	public void importAllRoleData(String fileContent) ;
	
	/**
	 * 获取经办任务接收人
	 */
	public List<String> getPreTaskAssignee(String processInstanceId,String taskId) ;
	
	/**
	 * 获取流程配置和模型列表
	 * @param params
	 * @return
	 * @throws WorkFlowException
	 */
	public IPage<List<ProcessInfoConfig>> findProcessConfigAndModel(ProcessDefinitionDTO queryDTO, ProcessInfoConfig params) throws WorkFlowException;
}
