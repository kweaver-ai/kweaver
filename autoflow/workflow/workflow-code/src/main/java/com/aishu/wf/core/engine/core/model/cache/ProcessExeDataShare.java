package com.aishu.wf.core.engine.core.model.cache;

import java.util.Map;

/**
 * 流程执行数据全局共享
 * 
 * @version: 1.0
 * @author lw
 */
public class ProcessExeDataShare {

	static ThreadLocal<Map<String,Object>> processExeDataShareThreadLocal = new ThreadLocal<Map<String,Object>>();
	  
	public static void setProcessExeData1(Map<String,Object> processExeData) {
		clear();
		processExeDataShareThreadLocal.set(processExeData);
	}

	public static Map<String,Object> getProcessExeData1() {
		return processExeDataShareThreadLocal.get();
	}
	public static void clear() {
		processExeDataShareThreadLocal.set(null);
	}
}
