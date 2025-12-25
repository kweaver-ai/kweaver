package com.aishu.wf.api.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/**
 * @description 流程环节定义对象
 * @author hanj
 */
@Data
public class ActivityDefinitionVO {
	@JsonProperty
	private String procDefId;
	private String procDefName;
	private String actDefId;
	private String actDefName;
	private String actDefType;
	private String actDefChildType;
	private String actDefDealType;
	private String pageUrl;
	//private String cportalProtocol;
	private String mportalUrl;
	//private String mportalProtocol;
	private String otherSysDealStatus;
	private boolean isMulti;
	private boolean isNotSelectReceiver;
	private String jumpType;
	private String ideaDisplayArea;
	private String showIdea;
	private Integer actLimitTime;
	//private boolean isAsync;
	//private boolean subProcAct;
	private String description;
	private Integer actDefOrder;
	
	/**
	 * 环节定义变量--待定
	 */
	private Map<String, Object> variables;
}
