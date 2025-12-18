package com.aishu.wf.core.engine.core.model;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.Data;
/**
 * 下一步接受人对象
 * 
 * @version: 1.0
 * @author lw
 */
@Data
public class ActivityReceiverModel implements java.io.Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String receiveUserId;
	private String receiveUserName;
	private String receiveUserOrgId;
	private String receiveUserOrgName;
	private String subBusinessKey;
	private Map<String,Object> extendAttribute=new HashMap<String,Object>();
}
