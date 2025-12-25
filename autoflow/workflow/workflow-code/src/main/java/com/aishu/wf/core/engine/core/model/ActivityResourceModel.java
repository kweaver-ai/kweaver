package com.aishu.wf.core.engine.core.model;

import java.util.Map;

import lombok.Data;

/**
 * 下一环节资源对象(配置对象-人员/组织/角色等）
 * 
 * @version: 1.0
 * @author lw
 */
@Data
public class ActivityResourceModel implements java.io.Serializable{
	private static final long serialVersionUID = 1L;
	/**
	 * 唯一标识
	 */
	private String id;  
	/**
	 * 父唯一标识
	 */
    private String parentId;  
    /**
	 * 名称
	 */
    private String name;  
    /**
	 * 类型,ORG:组织,USER:人员
	 */
    private String type;
    /**
	 * 级别
	 */
    private Integer level;
    /**
	 * 排序字段
	 */
    private Integer sort;
    /**
     * 备注
     */
    private String remark;
    /**
     * 实际的类型ID，与ID有区别，如类型为人员，id为用户账号，realId为UUID
     */
    private String realId;
   
	public ActivityResourceModel(String realId,String id, String pId, String name, Integer level, String type,Integer sort) {
		super();
		this.id = id;
		this.parentId = pId;
		this.name = name;
		this.type = type;
		this.level = level;
		this.sort = sort;
		this.realId=realId;
		
	}
	
	public ActivityResourceModel(String id, String pId, String name, Integer level, String type,Integer sort) {
		super();
		this.id = id;
		this.parentId = pId;
		this.name = name;
		this.type = type;
		this.level = level;
		this.sort = sort;
	}
	
	
}
