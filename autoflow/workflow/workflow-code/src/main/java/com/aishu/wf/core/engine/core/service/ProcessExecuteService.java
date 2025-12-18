package com.aishu.wf.core.engine.core.service;

import java.util.Map;

import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.util.WorkFlowException;

/**
 * @description 流程执行Service
 * @author lw
 */
public interface ProcessExecuteService  extends ActivitiService{
	/**
	 * 流程执行接口
	 * @param processInputModel
	 * @return Map<String,Object>
	 */
	public Map<String,Object> nextExecute(ProcessInputModel processInputModel)throws WorkFlowException;

	public static String  EXECUTE_STATUS_SUCCESS="SUCCESS";
	public static String  EXECUTE_STATUS_ERROR="ERROR";
	
}
