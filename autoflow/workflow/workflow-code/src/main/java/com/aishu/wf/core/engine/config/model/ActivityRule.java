package com.aishu.wf.core.engine.config.model;

import javax.validation.constraints.NotBlank;
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
@TableName("t_wf_activity_rule")
public class ActivityRule implements java.io.Serializable{
	private static final long serialVersionUID = 5454155825314635342L;
	

	//date formats
	
	//可以直接使用: @Length(max=50,message="用户名长度不能大于50")显示错误消息
	//columns START
    /**
     * 环节规则ID       db_column: RULE_ID 
     */	
	@Size(max=50)
	@TableId(value = "rule_id", type = IdType.ASSIGN_UUID)
	private String ruleId;
    /**
     * 环节规则名称       db_column: RULE_NAME 
     */	
	@NotBlank @Size(max=250)
	private String ruleName;
    /**
     * 流程定义ID       db_column: PROC_DEF_ID 
     */	
	@NotBlank @Size(max=100)
	private String procDefId;
    /**
     * 源环节ID       db_column: SOURCE_ACT_ID 
     */	
	@NotBlank @Size(max=50)
	private String sourceActId;
	@TableField(exist = false)
	private String sourceActName;
    /**
     * 目标环节ID       db_column: TARGET_ACT_ID 
     */	
	@NotBlank @Size(max=50)
	private String targetActId;
	@TableField(exist = false)
	private String targetActName;
    /**
     * 环节规则脚本       db_column: RULE_SCRIPT 
     */	
	@NotBlank @Size(max=4000)
	private String ruleScript;
    /**
     * 环节规则优先级       db_column: RULE_PRIORITY 
     */	
	
	private Integer rulePriority;
	 /**
     * 环节规则脚本类型,A：环节，R：资源       db_column: RULE_TYPE,F:多实例环节完成条件
     */	
	@Size(max=5)
	private String ruleType;
	public static final String RULE_TYPE_ACT="A";
	public static final String RULE_TYPE_ACT_RES="R";
	public static final String RULE_TYPE_ACT_FINISH="F";
	
    /**
     * 环节规则描述       db_column: RULE_REMARK 
     */	
	@Size(max=2000)
	private String ruleRemark;
	//columns END

	public void clear(){
		this.setRuleId("");
		this.setRuleName("");
		this.setRulePriority(null);
		this.setRuleRemark("");
	}

}

