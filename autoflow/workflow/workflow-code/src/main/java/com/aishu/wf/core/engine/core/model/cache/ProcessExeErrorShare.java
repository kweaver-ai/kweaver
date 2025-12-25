package com.aishu.wf.core.engine.core.model.cache;

import java.util.Map;

/**
 * 流程执行错误消息全局共享
 * 
 * @version: 1.0
 * @author lw
 */
public class ProcessExeErrorShare {

	static ThreadLocal<Map<String,Object>> processExeErrorShareThreadLocal = new ThreadLocal<Map<String,Object>>();
	  
	public static void setProcessExeErrorData(Map<String,Object> processExeErrorData) {
		processExeErrorShareThreadLocal.set(null);
		processExeErrorShareThreadLocal.set(processExeErrorData);
	}

	public static Map<String,Object> getProcessExeErrorData() {
		return processExeErrorShareThreadLocal.get();
	}
}
