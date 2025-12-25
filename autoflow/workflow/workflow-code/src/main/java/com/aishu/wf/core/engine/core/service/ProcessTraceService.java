package com.aishu.wf.core.engine.core.service;

import com.aishu.wf.core.engine.core.model.ProcessInstanceLog;
import com.aishu.wf.core.engine.util.WorkFlowException;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * @description 流程监控Service
 * @author lw
 */
public interface ProcessTraceService  extends ActivitiService{

	/**
	 * 获取流程日志（包含当前任务和历史任务信息、含意见）
	 *
	 * @param procInstId
	 * @return 返回相同的历史任务、意见等数据
	 */
	 ProcessInstanceLog getHisTaskLog(String procInstId,boolean hasStart,boolean hasEnd) throws WorkFlowException;

	/**
	 * 获取流程轨迹，用于监控展现
	 *
	 * @param processInstanceId
	 * @return
	 */
	List<Map<String, Object>> getProcessTrace(String proceInstaceId);
}
