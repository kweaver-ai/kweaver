package com.aishu.wf.core.engine.core.executor;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 流程执行工厂类,创建各种ProcessExecutor
 * @version:  1.0
 * @author lw 
 */
@Service
public class ProcessExecutorFactory {
	protected  Logger logger = LoggerFactory
			.getLogger(ProcessExecutorFactory.class);
	
	public ProcessExecutor buildProcessExecutor(String actionType) {
		if (StringUtils.isEmpty(actionType)) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,
					"无法初始化ProcessExecutor实例,actionType不能为空");
		}
		ProcessExecutor processExecutor = null;
		try {
			processExecutor = (ProcessExecutor) ApplicationContextHolder
					.getBean(actionType);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2050,
					"无法找到ProcessExecutor实例,actionType["+actionType+"]没有配置对应的 processExecute");
		}
		return processExecutor;
	}

}
