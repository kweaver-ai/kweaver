package com.aishu.wf.core.engine.identity.model;


import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("t_wf_user2role")
public class User2role implements Serializable {

	private static final long serialVersionUID = 5454155825314635342L;

	/**
	 * 主键
	 */
	@TableField("role_id")
	private String roleId;

	/**
	 * 用户ID
	 */
	@TableField("user_id")
	private String userId;

	/**
	 * 用户编码
	 */
	@TableField("user_code")
	private String userCode;

	/**
	 * 用户名称
	 */
	@TableField("user_name")
	private String userName;

	/**
	 * 组织ID
	 */
	@TableField("org_id")
	private String orgId;

	/**
	 * 组织名称
	 */
	@TableField("org_name")
	private String orgName;

	/**
	 * 备注
	 */
	@TableField("remark")
	private String remark;

	/**
	 * 排序
	 */
	@TableField("sort")
	private Integer sort;

	/**
	 * 创建人ID
	 */
	@TableField("create_user_id")
	private String createUserId;

	/**
	 * 创建人名称
	 */
	@TableField("create_user_name")
	private String createUserName;

	/**
	 * 创建时间
	 */
	@TableField("create_time")
	private Date createTime;


}
