package com.aishu.wf.core.engine.core.model;

import lombok.Data;
import org.activiti.engine.task.Comment;

import java.util.Date;
import java.util.List;
/**
 * 流程详细日志模型
 *
 * @version: 1.0
 * @author lw
 */
@Data
public class ProcessLogModel {
	private String actDefName;
	private String actDefKey;
	private String actInstId;
	private String actDefType;
	private String actDefModel;
	private String actionType;
	private String processInstanceId;
	private String deleteReason;
	private Date startTime;
	private Date endTime;
	private String multiCommentMsg;
	private Comment comment;
	private String sendUserId;
	private String receiveUserId;
	private String sendUserName;
	private String receiveUserName;
	private String receiveUserAccount;
	private String sendOrgId;
	private String receiveOrgId;
	private String sendOrgName;
	private String sendCompanyName;
	private String sendCompanyId;
	private String receiveOrgName;
	private String ownerName;
	private String finishState;
	private String preTaskId;

	//用于组装给前端页面显示公司名称、部门、组织
	private String sendInfo;
	private String assigneeInfo;

	//用于标识是否连续多级审核日志
	private String multilevel;

	// 流程状态
	private String procStatus;

	private List<String> attachments;
}
