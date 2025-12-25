package com.aishu.wf.core.engine.core.model;

import java.util.Date;

import lombok.Data;

/**
 * 业务数据对象
 * @author lw
 *
 */
@Data
public class BusinessDataObject implements java.io.Serializable{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	/**
	 * 业务类型，如合同，方便根据对象查询分析
	 */
	private String objectType;
	/**
	 * 序列化之后的业务对象
	 */
	private String bizData;
}
