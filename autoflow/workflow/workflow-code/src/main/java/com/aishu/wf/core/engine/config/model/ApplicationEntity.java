package com.aishu.wf.core.engine.config.model;

import java.util.Date;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

/**
 * @author lw
 * @version 1.0
 * @since  
 */
@Data
@TableName("t_wf_application")
public class ApplicationEntity implements java.io.Serializable{
	private static final long serialVersionUID = 5454155825314635342L;

	//columns START
    /**
     * 应用系统唯一关键字       db_column: APP_ID 
     */	
	@Size(max=50)
	@TableId(type = IdType.INPUT)
	private String appId;
    /**
     * 应用系统名称       db_column: APP_NAME 
     */	
	@NotBlank @Size(max=50)
	private String appName;
    /**
     * 应用系统分类，分为inner：内部应用（如：标准化等）out：外部应用（如ERP等）
       db_column: APP_TYPE 
     */	
	@Size(max=20)
	private String appType;
	@TableField(exist = false)
	private String appTypes;
    /**
     * 应用系统访问路径       db_column: APP_ACCESS_URL 
     */	
	@Size(max=300)
	private String appAccessUrl;
    /**
     * 应用系统创建时间       db_column: APP_CREATE_TIME 
     */	
	@NotNull 
	private Date appCreateTime;
    /**
     * 应用系统更新时间       db_column: APP_UPDATE_TIME 
     */	
	
	private Date appUpdateTime;
    /**
     * 应用系统创建人       db_column: APP_CREATOR_ID 
     */	
	@NotBlank @Size(max=50)
	private String appCreatorId;
    /**
     * 应用系统更新人       db_column: APP_UPDATOR_ID 
     */	
	@Size(max=50)
	private String appUpdatorId;
    /**
     * 应用系统状态，N:正常,T:已停止,D:已删除       db_column: APP_STATUS 
     */	
	@NotBlank @Size(max=2)
	private String appStatus;
    /**
     * 应用系统描述       db_column: APP_DESC 
     */	
	@Size(max=300)
	private String appDesc;
    /**
     * 应用系统开发厂商       db_column: APP_PROVIDER 
     */	
	@NotBlank @Size(max=100)
	private String appProvider;
    /**
     * 应用系统联系人       db_column: APP_LINKMAN 
     */	
	@Size(max=50)
	private String appLinkman;
    /**
     * 应用系统联系电话       db_column: APP_PHONE 
     */	
	@Size(max=30)
	private String appPhone;
	//columns END
	@Size(max=200)
	private String ipList;
}

