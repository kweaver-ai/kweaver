package com.aishu.wf.api.model;

import java.util.Date;
import java.util.List;

import lombok.Data;

/**
 * @description 流程实例对象
 * @author hanj
 */
@Data
public class ProcessInstanceVO {

	private String procInstId;
	private String procInstTitle;
	private String businessKey;
	private String parentProcInstId;
	private String topProcInstId;
	private String procDefId;
	private String procDefName;
	//private String curActDefId;
	//private String curActDefName;
	private String startUserId;
	private String startUserName;
	//private String startUserCompanyId;
	private String startUserOrgId;
	private String startUserOrgName;
	private String procInstState;
	private Date createTime;
	private Date finishTime;
	private String tenantId;
	private List<String> subProcInstIds;
	private List<ActivityInstanceVO> nextActInsts;
}
