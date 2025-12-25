package com.aishu.wf.core.engine.core.model.cache;


/**
 * 流程管理数据全局共享
 * 
 * @version: 1.0
 * @author lw
 */
public class ProcessMgrDataShare {

	static ThreadLocal<Object> processMgrDataThreadLocal = new ThreadLocal<Object>();
	  
	public static void setProcessMgrData(Object processMgrData) {
		clear();
		processMgrDataThreadLocal.set(processMgrData);
	}

	public static Object getProcessMgrData() {
		return processMgrDataThreadLocal.get();
	}
	
	public static void clear() {
		 processMgrDataThreadLocal.set(null);
	}
}
