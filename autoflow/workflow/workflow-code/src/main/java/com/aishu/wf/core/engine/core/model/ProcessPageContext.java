package com.aishu.wf.core.engine.core.model;

import org.apache.commons.lang3.StringUtils;

import com.aishu.wf.core.engine.util.WorkFlowException;

import lombok.Data;
/**
 * 流程上下文
 * 
 * @version: 1.0
 * @author lw
 */
@Data
public class ProcessPageContext {
	private String openPageType;
	private String actionType;
	private String workflowPage;
	private String userId;
	private String userOrgId;
	
	public ProcessPageContext(String openPageType, String actionType,
			String workflowPage, String userId, String userOrgId) {
		super();
		this.openPageType = openPageType;
		this.actionType = actionType;
		this.workflowPage = workflowPage;
		if(StringUtils.isEmpty(userId)){
			throw new WorkFlowException(ExceptionErrorCode.B2001,"打开流程界面的userId不允许为空");
		}
		if(StringUtils.isEmpty(userOrgId)){
			throw new WorkFlowException(ExceptionErrorCode.B2001,"打开流程界面的userOrgId不允许为空");
		}
		this.userId = userId;
		this.userOrgId = userOrgId;
	}
	
}
