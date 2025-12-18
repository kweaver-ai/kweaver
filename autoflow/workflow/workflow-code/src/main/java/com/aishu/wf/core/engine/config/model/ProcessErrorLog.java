package com.aishu.wf.core.engine.config.model;

/**
 * @author lw
 * @version 1.0
 * @since  
 */
import java.util.Date;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;
@Data
@TableName("t_wf_process_error_log")
public class ProcessErrorLog implements java.io.Serializable{
	private static final long serialVersionUID = 5454155825314635342L;
	

	//可以直接使用: @Size(max=50,message="用户名长度不能大于50")显示错误消息
	//columns START
    /**
     * 主键，GUID       db_column: PELOG_ID 
     */	
	@Size(max=36)
	@TableId(value = "pelog_id", type = IdType.ASSIGN_UUID)
	private String pelogId;
    /**
     * 流程实例ID       db_column: PROCESS_INSTANCE_ID 
     */	
	@NotBlank @Size(max=50)
	private String processInstanceId;
    /**
     * 流程标题       db_column: PROCESS_TITLE 
     */	
	@NotBlank @Size(max=500)
	private String processTitle;
    /**
     * 流程发送人       db_column: CREATOR 
     */	
	@NotBlank @Size(max=50)
	private String creator;
    /**
     * 流程操作类型       db_column: ACTION_TYPE 
     */	
	@NotBlank @Size(max=30)
	private String actionType;
    /**
     * 流程消息内容       db_column: PROCESS_MSG 
     */	
	@NotBlank @Size(max=4000)
	private String processMsg;
    /**
     * 记录时间       db_column: PELOG_CREATE_TIME 
     */	
	@NotNull 
	private Date pelogCreateTime;

	@TableField(exist = false)
	private Date startPelogTime;
	@TableField(exist = false)
	private Date endPelogTime;
    /**
     * 流程错误描述       db_column: ERROR_MSG
     */	
	@Size(max=4000)
	private String errorMsg;
	
	@NotBlank @Size(max=100)
	private String userTime;
	
	private String receivers;
	private String processDefName;
	private String appId;
	private String processLogLevel;

	@TableField(exist = false)
	private String dataSource;
	public static final String DATA_SOURCE_MANAGER="m";
	public static final String DATA_SOURCE_REST="r";
	private String retryStatus;
	
	//columns END

	public ProcessErrorLog(){
		this.pelogCreateTime = new Date();
	}

	public ProcessErrorLog(String processInstanceId,
			String processTitle, String creator, String actionType,String errorMsg,
			String processMsg) {
		super();
		this.pelogId = java.util.UUID.randomUUID().toString();
		this.processInstanceId = processInstanceId;
		this.processTitle = processTitle;
		this.creator = creator;
		this.actionType = actionType;
		this.processMsg = processMsg;
		this.pelogCreateTime = new Date();
		this.errorMsg = errorMsg;
	}

}

