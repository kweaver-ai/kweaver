package com.aishu.wf.core.engine.config.model;

import java.util.List;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;
@Data
@TableName("t_wf_application_user")
public class Application2UserEntity implements java.io.Serializable{
	/**
	 * 
	 */
	private static final long serialVersionUID = -2777896586605557679L;
	
	private String appId;
	private String userId;
	@TableField(exist = false)
	private String userName;
	private String remark;
	@TableField(exist = false)
	private String userEmail;
	@TableField(exist = false)
	private List<ApplicationEntity> applications;
	
}
