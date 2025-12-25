/*
 * 该类为数据库表实体类
 */
package com.aishu.wf.core.engine.identity.model;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;
import java.util.List;


/**
 * @author lw
 * @version 1.0
 * @since  
 */
@Data
@TableName("t_wf_role")
public class Role implements Serializable {
	private static final long serialVersionUID = 5454155825314635342L;
	//columns START
    /**
     * 角色ID       数据字段: ROLE_ID 
     */ 	
	@TableId
    private String roleId;
    /**
     * 角色名称       数据字段: ROLE_NAME 
     */ 	
	private String roleName;
    
    /**
     * 角色排序号       数据字段: ROLE_SORT 
     */ 	
	private Integer roleSort;
    /**
     * 角色类型，如全局角色:GLOBAL、业务系统角色：BIZ、其他:OTHER       数据字段: ROLE_TYPE 
     */ 	
	private String roleType;
	/**
     * 角色所属系统，所有:ALL、工作流:WF、门户:MH、内容发布:TCM     数据字段: ROLE_APP_ID
     */ 
	private String roleAppId;
    /**
     * 角色状态,（启用:QY、未启用:WQY）      数据字段: ROLE_STATUS 
     */ 	
	private String roleStatus;
	 /**
     * 角色创建时间     数据字段: ROLE_CREATE_TIME 
     */ 
	private Date roleCreateTime;
	/**
     * 角色创建者     数据字段: ROLE_CREATETOR 
     */ 
	private String roleCreator;
    /**
     * 备注       数据字段: REMARK 
     */ 	
	private String remark;

	/**
	 * 是否是模板       数据字段: template
	 */
	private String template;

	@TableField(exist = false)
	private List<User2role> user2roles;

	@TableField(exist = false)
	private String auditorNames;

	@TableField(exist = false)
	private List<User2role> auditorList;
}

