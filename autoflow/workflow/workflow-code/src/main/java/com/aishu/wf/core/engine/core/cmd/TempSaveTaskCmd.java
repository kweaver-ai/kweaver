package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.ActivitiObjectNotFoundException;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.identity.Authentication;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.CommentEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.persistence.entity.VariableInstanceEntity;
import org.activiti.engine.runtime.Execution;
import org.activiti.engine.task.Comment;
import org.activiti.engine.task.Event;
import org.apache.commons.lang3.StringUtils;

import com.aishu.wf.core.engine.util.WorkFlowContants;

/**
 * 暂存待办任务
 * @author lw
 */
public class TempSaveTaskCmd implements Command<Void>, Serializable {

	private static final long serialVersionUID = 1L;

	protected String taskId;
	protected Map<String, Object> variables;

	public TempSaveTaskCmd(String taskId, Map<String, Object> variables) {
		this.taskId = taskId;
		this.variables = variables;
	}

	public Void execute(CommandContext commandContext) {
		if (taskId == null) {
			throw new ActivitiIllegalArgumentException("taskId is null");
		}
		TaskEntity taskEntity = commandContext.getTaskEntityManager()
				.findTaskById(taskId);
		if (taskEntity == null) {
			throw new ActivitiObjectNotFoundException(
					"Cannot find taskEntity for id '" + taskId + "'.",
					Execution.class);
		}
		//更新页面元素
		updateField(commandContext, taskEntity);
		//更新意见字段
		updateComment(commandContext, taskEntity);
		taskEntity.setActionType(WorkFlowContants.ACTION_TYPE_SAVE_ACTIVITY);
		//更新当前任务及对应的历史任务
		taskEntity.updateCascade();
		return null;
	}

	
	private void updateField(CommandContext commandContext,
			TaskEntity taskEntity) {
		List<VariableInstanceEntity> variableInstanceEntitys = commandContext
				.getVariableInstanceEntityManager()
				.findVariableInstancesByTaskId(taskId);
		if (variableInstanceEntitys == null)
			return;
		for (VariableInstanceEntity variableInstanceEntity : variableInstanceEntitys) {
			if (!(variableInstanceEntity.getName().equals(
							WorkFlowContants.WF_BUSINESS_DATA_OBJECT_KEY))) {
				continue;
			}
			if (variables.get(variableInstanceEntity.getName())!=null)
				taskEntity.setVariableLocal(variableInstanceEntity.getName(),
						variables.get(variableInstanceEntity.getName()));
			
		}
	}
	
	private void updateComment(CommandContext commandContext,
			TaskEntity taskEntity) {
		String message = (String) variables.get(WorkFlowContants.WF_CUR_COMMENT_KEY);
		if (StringUtils.isBlank(message)) {
			return;
		}
		List<Comment> comments = commandContext.getCommentEntityManager()
				.findCommentsByTaskId(taskId);
		if (comments != null && !comments.isEmpty()) {
			CommentEntity commentEntity = (CommentEntity) comments.get(0);
			commandContext.getCommentEntityManager().delete(commentEntity);
		} 
		addComment(commandContext, taskEntity, message);
		
	}


	private void addComment(CommandContext commandContext,
			TaskEntity taskEntity, String message) {
		String userId = Authentication.getAuthenticatedUserId();
		CommentEntity comment = new CommentEntity();
		comment.setUserId(userId);
		comment.setType(CommentEntity.TYPE_COMMENT);
		comment.setTime(Context.getProcessEngineConfiguration().getClock()
				.getCurrentTime());
		comment.setTaskId(taskId);
		comment.setProcessInstanceId(taskEntity.getProcessInstanceId());
		comment.setAction(Event.ACTION_ADD_COMMENT);
		setMessage(comment,message);
		commandContext.getCommentEntityManager().insert(comment);
	}
	private void setMessage(CommentEntity comment,String message){
		String eventMessage = message.replaceAll("\\s+", " ");
		if (eventMessage.length() > 163) {
			eventMessage = eventMessage.substring(0, 160) + "...";
		}
		comment.setMessage(eventMessage);
		comment.setFullMessage(message);
	}

}
