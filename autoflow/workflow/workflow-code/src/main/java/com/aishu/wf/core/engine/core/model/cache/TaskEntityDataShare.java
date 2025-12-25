package com.aishu.wf.core.engine.core.model.cache;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;


/**
 * 流程待办任务数据全局共享
 * 
 * @version: 1.0
 * @author lw
 */
public class TaskEntityDataShare {
	protected static Logger logger = LoggerFactory.getLogger(TaskEntityDataShare.class);
	//当前线程流程待办共享池
	static final ThreadLocal<List<ActivityInstanceModel>> taskEntityShareThreadLocal = new ThreadLocal<List<ActivityInstanceModel>>();
	//当前线程流程待办共享池
	static final ThreadLocal<List<ActivityInstanceModel>> hisTaskEntityShareThreadLocal = new ThreadLocal<List<ActivityInstanceModel>>();
	
	
	/**
	 * 返回当前线程中流程待办列表
	 * @return
	 */
	public static List<ActivityInstanceModel> getTask() {
		List<ActivityInstanceModel> taskEntitys=getTaskEntitys();
	    return taskEntitys;
	 }
	/**
	 * 返回当前线程中流程已办列表
	 * @return
	 */
	public static List<ActivityInstanceModel> getHisTask() {
		List<ActivityInstanceModel> hisTaskEntitys=getHisTaskEntitys();
	    return hisTaskEntitys;
	 }
	public static void setTask(ActivityInstanceModel taskEntity) {
		logger.debug("set待办数据:"+taskEntity);
		getTaskEntitys().add(taskEntity);
	}
	
	public static void setHisTask(ActivityInstanceModel taskEntity) {
		logger.debug("set已办数据:"+taskEntity);
		getHisTaskEntitys().add(taskEntity);
	}
	
	
	public static void clear() {
		if(getTaskEntitys()!=null){
			getTaskEntitys().clear();
			taskEntityShareThreadLocal.set(null);
		}
		if(getHisTaskEntitys()!=null){
			getHisTaskEntitys().clear();
			hisTaskEntityShareThreadLocal.set(null);
		}
	}
	
	private static List<ActivityInstanceModel> getTaskEntitys() {
		List<ActivityInstanceModel> taskEntitys=taskEntityShareThreadLocal.get();
		if(taskEntitys==null){
			taskEntitys=new CopyOnWriteArrayList<ActivityInstanceModel>();
			taskEntityShareThreadLocal.set(taskEntitys);
		}
		return taskEntitys;
	}

	private static List<ActivityInstanceModel> getHisTaskEntitys() {
		List<ActivityInstanceModel> hisTaskEntitys = hisTaskEntityShareThreadLocal
				.get();
		if (hisTaskEntitys == null) {
			hisTaskEntitys = new CopyOnWriteArrayList<ActivityInstanceModel>();
			hisTaskEntityShareThreadLocal.set(hisTaskEntitys);
		}
		return hisTaskEntitys;
	}
}
