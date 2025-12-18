package com.aishu.wf.api.model;

import java.util.Date;

import lombok.Data;

/**
 * @description 流程环节实例对象
 * @author hanj
 */
@Data
public class ActivityInstanceVO {
	private String procDefId;
	private String procDefName;
	private String actDefId;
	private String actDefName;
	private String actDefType;
	private String actInstId;
	private String procInstId;
	private String sendUserId;
	private String sendUserName;
	private String sendUserOrgId;
	private String sendUserOrgName;
	private String receiverUserId;
	private String receiverUserName;
	private String receiverUserOrgId;
	private String receiverUserOrgName;
	private String owner;
	private String actInstState;
	private Date createTime;
	private Date finishTime;

}
