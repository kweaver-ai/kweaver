package com.aishu.wf.core.engine.core.listener;

import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.cache.TaskEntityDataShare;

import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 任务删除（待办变已办）
 * 
 * @version: 1.0
 * @author lw
 */
public class TaskDeleleListener implements TaskListener  {
	private static final long serialVersionUID = 1L;
	protected Logger logger = LoggerFactory.getLogger(getClass());

	@Override
	public void notify(DelegateTask delegate) {
		if (!delegate.getEventName().equals(TaskListener.EVENTNAME_COMPLETE))
			return;
		try {
			TaskEntity delegateTask = (TaskEntity) delegate;
			ActivityInstanceModel activityInfo=ActivityInstanceModel.buildHisTask(delegateTask);
			TaskEntityDataShare.setHisTask(activityInfo);
		} catch (Exception e) {
			logger.warn("complete task setHisTask error",e);
		}
	}
	

}