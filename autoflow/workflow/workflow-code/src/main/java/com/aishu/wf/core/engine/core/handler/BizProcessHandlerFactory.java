package com.aishu.wf.core.engine.core.handler;

import org.activiti.engine.ProcessEngineConfiguration;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.aishu.wf.core.common.util.ClassUtils;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.executor.ProcessExecutorFactory;

/**
 * 业务应用代理处理工程
 * @version:  1.0
 * @author lw 
 */
@Service
public class BizProcessHandlerFactory {
	@Autowired
	private ProcessInfoConfigManager processInfoConfigManager;
	
	protected  Logger logger = LoggerFactory
			.getLogger(ProcessExecutorFactory.class);
	@Autowired
	protected  ProcessEngineConfiguration processEngineConfiguration;

	public BizProcessHandlerFactory() {

	}

	public BizProcessHandler buildBussinessProcessHandler(String processDefinitionId) {
		Assert.notNull(processDefinitionId, "流程定义ID不允许为空");
		ProcessInfoConfig processInfoConfig=processInfoConfigManager.getById(processDefinitionId);
		Assert.notNull(processInfoConfig, String.format("查询流程配置信息失败,processDefinitionId[%s]",processDefinitionId));
		if(StringUtils.isEmpty(processInfoConfig.getProcessHandlerClassPath())){
			return null;
		}
		BizProcessHandler bussinessProcessHandler  = null;
		try {
			 bussinessProcessHandler = (BizProcessHandler) ClassUtils.getInstance(processInfoConfig.getProcessHandlerClassPath());
		} catch (Exception e) {
			logger.warn("无法初始化BussinessProcessHandler实例,processInfoConfig{}",new Object[]{processInfoConfig}, e);
		}
		
		return bussinessProcessHandler;

	}

}
